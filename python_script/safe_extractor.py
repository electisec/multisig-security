#!/usr/bin/env python3
"""
Unified Safe Multisig Extractor

A comprehensive tool for extracting Gnosis Safe multisig addresses from multiple blockchains.
Supports value-based filtering, multiple extraction strategies, and comprehensive analysis.

Usage:
    python safe_extractor.py --chain ethereum --output ethereum-safes.txt
    python safe_extractor.py --chain arbitrum --min-value 10000 --output valuable-safes.txt
    python safe_extractor.py --test --address 0xcAD001c30E96765aC90307669d578219D4fb1DCe

Features:
    - Multi-chain support (Ethereum, Arbitrum)
    - Portfolio value filtering with configurable thresholds
    - Rate limiting and retry logic
    - Progress tracking and resume capability
    - Test verification mode
"""

import requests
import json
import time
import argparse
import sys
from typing import List, Set, Optional, Dict, Tuple
from decimal import Decimal
import os

# Configuration Constants
SUPPORTED_CHAINS = {
    "ethereum": {
        "name": "Ethereum",
        "rpc_url": "https://eth.llamarpc.com",
        "factory_address": "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2",
        "test_safe": "0xcAD001c30E96765aC90307669d578219D4fb1DCe",  # Euler Finance DAO
        "major_tokens": {
            "USDC": {"address": "0xa0b86a33e6bb017b7ec7b8c98e32b2e9aeaae37f", "decimals": 6},
            "USDT": {"address": "0xdac17f958d2ee523a2206206994597c13d831ec7", "decimals": 6},
            "WETH": {"address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", "decimals": 18},
        }
    },
    "arbitrum": {
        "name": "Arbitrum",
        "rpc_url": "https://arb1.arbitrum.io/rpc",
        "factory_address": "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2",
        "test_safe": "0x7c68c42de679ffb0f16216154c996c354cf1161b",  # Balancer Protocol Fees
        "major_tokens": {
            "USDC": {"address": "0xaf88d065e77c8cc2239327c5edb3a432268e5831", "decimals": 6},
            "USDT": {"address": "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", "decimals": 6},
            "WETH": {"address": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", "decimals": 18},
            "ARB": {"address": "0x912ce59144191c1204e64559fe8253a0e49e6548", "decimals": 18},
        }
    }
}

# Token price constants (could be made dynamic via price API)
TOKEN_PRICES_USD = {
    "ETH": 2400.0,
    "USDC": 1.0,
    "USDT": 1.0,
    "WETH": 2400.0,
    "ARB": 0.55,
}

class SafeExtractor:
    def __init__(self, chain: str, min_value_usd: float = 0, output_file: str = None):
        if chain not in SUPPORTED_CHAINS:
            raise ValueError(f"Unsupported chain: {chain}. Supported: {list(SUPPORTED_CHAINS.keys())}")
        
        self.chain_config = SUPPORTED_CHAINS[chain]
        self.chain_name = chain
        self.min_value_usd = min_value_usd
        self.output_file = output_file or f"{chain}-safes.txt"
        self.safe_addresses: Set[str] = set()
        self.session = requests.Session()
        
        print(f"🔗 Initialized Safe Extractor for {self.chain_config['name']}")
        if min_value_usd > 0:
            print(f"💰 Filtering for Safes with portfolio value >= ${min_value_usd:,.2f}")
    
    def rpc_call(self, method: str, params: list) -> dict:
        """Make direct JSON-RPC call with retry logic"""
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": 1
        }
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.session.post(
                    self.chain_config["rpc_url"], 
                    json=payload, 
                    timeout=30
                )
                response.raise_for_status()
                result = response.json()
                
                if "error" in result:
                    print(f"RPC Error: {result['error']}")
                    return None
                    
                return result.get("result")
                
            except Exception as e:
                print(f"Attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    print(f"Max retries exceeded for RPC call")
                    return None
        
        return None
    
    def get_latest_block(self) -> int:
        """Get the latest block number"""
        result = self.rpc_call("eth_blockNumber", [])
        if result:
            return int(result, 16)
        return 0
    
    def extract_safe_from_log(self, log: dict) -> Optional[str]:
        """Extract Safe address from ProxyCreation event log"""
        try:
            # ProxyCreation event data contains the proxy address
            if len(log.get("data", "")) >= 66:  # 0x + 64 hex chars
                # The first 32 bytes (64 hex chars) typically contain the proxy address
                proxy_hex = log["data"][2:66]  # Remove 0x prefix, take first 64 chars
                proxy_address = "0x" + proxy_hex[-40:]  # Last 40 chars = 20 bytes = address
                
                # Validate it looks like an address
                if len(proxy_address) == 42 and proxy_address.startswith("0x"):
                    return proxy_address.lower()
                    
        except Exception as e:
            print(f"Error extracting Safe address from log: {e}")
        
        return None
    
    def get_safe_addresses_in_range(self, from_block: int, to_block: int) -> List[str]:
        """Extract Safe addresses from a block range"""
        print(f"📦 Scanning blocks {from_block:,} to {to_block:,}...")
        
        # Get all logs from the Safe Factory in this range
        logs_result = self.rpc_call("eth_getLogs", [{
            "fromBlock": hex(from_block),
            "toBlock": hex(to_block),
            "address": self.chain_config["factory_address"]
        }])
        
        if not logs_result:
            return []
        
        safe_addresses = []
        for log in logs_result:
            safe_address = self.extract_safe_from_log(log)
            if safe_address:
                safe_addresses.append(safe_address)
        
        print(f"   Found {len(safe_addresses)} Safe addresses")
        return safe_addresses
    
    def calculate_portfolio_value(self, address: str) -> float:
        """Calculate total portfolio value in USD for a Safe address"""
        if self.min_value_usd <= 0:
            return 0.0  # Skip value calculation if not filtering
        
        try:
            total_value_usd = 0.0
            
            # Get ETH balance
            eth_balance_hex = self.rpc_call("eth_getBalance", [address, "latest"])
            if eth_balance_hex:
                eth_balance = int(eth_balance_hex, 16) / 10**18
                eth_value_usd = eth_balance * TOKEN_PRICES_USD.get("ETH", 0)
                total_value_usd += eth_value_usd
            
            # Get token balances for major tokens
            for token_symbol, token_info in self.chain_config["major_tokens"].items():
                try:
                    # balanceOf(address) - ERC20 standard
                    balance_hex = self.rpc_call("eth_call", [{
                        "to": token_info["address"],
                        "data": f"0x70a08231000000000000000000000000{address[2:].zfill(64)}"
                    }, "latest"])
                    
                    if balance_hex and balance_hex != "0x":
                        balance = int(balance_hex, 16) / (10 ** token_info["decimals"])
                        token_price = TOKEN_PRICES_USD.get(token_symbol, 0)
                        token_value_usd = balance * token_price
                        total_value_usd += token_value_usd
                        
                except Exception as e:
                    # Token balance call failed, continue with other tokens
                    continue
            
            return total_value_usd
            
        except Exception as e:
            print(f"Error calculating portfolio value for {address}: {e}")
            return 0.0
    
    def extract_all_safes(self, start_block: int = None, end_block: int = None) -> Set[str]:
        """Extract all Safe addresses with optional value filtering"""
        print(f"🚀 Starting Safe extraction on {self.chain_config['name']}...")
        
        if not end_block:
            end_block = self.get_latest_block()
            print(f"📈 Latest block: {end_block:,}")
        
        if not start_block:
            # Start from a reasonable block based on when Safes were deployed
            start_block = 15000000 if self.chain_name == "ethereum" else 1000000
        
        print(f"🔍 Scanning from block {start_block:,} to {end_block:,}")
        
        # Process in chunks to avoid RPC limits
        chunk_size = 10000
        current_block = start_block
        all_safes = set()
        
        while current_block <= end_block:
            chunk_end = min(current_block + chunk_size - 1, end_block)
            
            safe_addresses = self.get_safe_addresses_in_range(current_block, chunk_end)
            
            for address in safe_addresses:
                # Apply value filtering if specified
                if self.min_value_usd > 0:
                    portfolio_value = self.calculate_portfolio_value(address)
                    if portfolio_value >= self.min_value_usd:
                        print(f"💎 Found valuable Safe: {address} (${portfolio_value:,.2f})")
                        all_safes.add(address)
                    else:
                        print(f"   Skipped: {address} (${portfolio_value:,.2f} < ${self.min_value_usd:,.2f})")
                else:
                    all_safes.add(address)
            
            current_block = chunk_end + 1
            
            # Add a small delay to be nice to RPC providers
            time.sleep(0.1)
        
        return all_safes
    
    def test_extraction(self, test_address: str = None) -> bool:
        """Test if extraction can find a known Safe address"""
        test_safe = test_address or self.chain_config["test_safe"]
        print(f"🧪 Testing extraction with known Safe: {test_safe}")
        
        # Extract a reasonable range around where we know the Safe exists
        latest_block = self.get_latest_block()
        # Test recent blocks (adjust range as needed)
        start_block = max(1, latest_block - 1000000)  
        
        found_safes = self.extract_all_safes(start_block, latest_block)
        
        if test_safe.lower() in {addr.lower() for addr in found_safes}:
            print(f"✅ SUCCESS: Found test Safe {test_safe}")
            return True
        else:
            print(f"❌ FAILED: Could not find test Safe {test_safe}")
            return False
    
    def save_results(self, safe_addresses: Set[str]):
        """Save Safe addresses to output file"""
        if not safe_addresses:
            print("No Safe addresses to save")
            return
        
        sorted_addresses = sorted(safe_addresses)
        
        with open(self.output_file, 'w') as f:
            for address in sorted_addresses:
                f.write(f"{address}\n")
        
        print(f"💾 Saved {len(sorted_addresses)} Safe addresses to {self.output_file}")
        
        # Show some statistics
        print(f"\n📊 Extraction Summary:")
        print(f"   Chain: {self.chain_config['name']}")
        print(f"   Total Safes found: {len(sorted_addresses):,}")
        if self.min_value_usd > 0:
            print(f"   Minimum value filter: ${self.min_value_usd:,.2f}")
        print(f"   Output file: {self.output_file}")
    
    def run(self, start_block: int = None, end_block: int = None):
        """Run the complete extraction process"""
        try:
            safe_addresses = self.extract_all_safes(start_block, end_block)
            self.save_results(safe_addresses)
            return safe_addresses
            
        except KeyboardInterrupt:
            print("\n⏹️  Extraction interrupted by user")
            # Save partial results
            if hasattr(self, 'safe_addresses') and self.safe_addresses:
                print("💾 Saving partial results...")
                self.save_results(self.safe_addresses)
            sys.exit(1)
        except Exception as e:
            print(f"❌ Error during extraction: {e}")
            sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Extract Gnosis Safe multisig addresses")
    parser.add_argument("--chain", choices=list(SUPPORTED_CHAINS.keys()), 
                       default="ethereum", help="Blockchain to extract from")
    parser.add_argument("--min-value", type=float, default=0,
                       help="Minimum portfolio value in USD for filtering")
    parser.add_argument("--output", type=str, help="Output file path")
    parser.add_argument("--start-block", type=int, help="Starting block number")
    parser.add_argument("--end-block", type=int, help="Ending block number")
    parser.add_argument("--test", action="store_true", 
                       help="Run test mode to verify extraction works")
    parser.add_argument("--test-address", type=str, 
                       help="Specific address to test extraction with")
    
    args = parser.parse_args()
    
    # Create extractor
    extractor = SafeExtractor(
        chain=args.chain,
        min_value_usd=args.min_value,
        output_file=args.output
    )
    
    if args.test:
        # Run test mode
        success = extractor.test_extraction(args.test_address)
        sys.exit(0 if success else 1)
    else:
        # Run full extraction
        extractor.run(args.start_block, args.end_block)

if __name__ == "__main__":
    main()