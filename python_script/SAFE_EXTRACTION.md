# Safe Multisig Extraction Tools

This directory contains tools for extracting and analyzing Gnosis Safe multisig addresses from multiple blockchain networks.

## 🚀 Quick Start

### Basic Usage
```bash
# Extract all Safes from Ethereum
python safe_extractor.py --chain ethereum --output ethereum-safes.txt

# Extract valuable Safes from Arbitrum (>$10,000 portfolio value)
python safe_extractor.py --chain arbitrum --min-value 10000 --output valuable-arbitrum-safes.txt

# Test extraction with a known Safe address
python safe_extractor.py --chain ethereum --test
```

### Run Tests
```bash
# Run comprehensive test suite
python test_safe_extraction.py
```

## 📁 Files

### Core Scripts
- **`safe_extractor.py`** - Unified extraction tool for all blockchains  
- **`safe_analyzer.py`** - Complete security analysis (same 14 checks as web app)
- **`test_safe_extraction.py`** - Comprehensive test suite

### Backup Files
- **`backup_essential/`** - Contains original working scripts (for reference)

## 🔧 Features

### Multi-Chain Support
- **Ethereum** - Mainnet Safe extraction
- **Arbitrum** - Layer 2 Safe extraction
- Easily extensible to other chains

### Value-Based Filtering
- Portfolio value calculation using major tokens (ETH, USDC, USDT, WETH, ARB)
- Configurable minimum value thresholds
- Real-time price-based filtering

### Robust Extraction
- Direct RPC calls for maximum reliability
- Rate limiting and retry logic
- Progress tracking and resume capability
- Comprehensive error handling

### Testing & Validation
- Test mode with known Safe addresses
- Comprehensive test suite
- Validation against known multisigs

## 🛠️ Technical Details

### How It Works
1. **Event Log Scanning** - Monitors Safe Factory ProxyCreation events
2. **Address Extraction** - Parses Safe addresses from event data
3. **Value Calculation** - Queries token balances for portfolio valuation
4. **Filtering & Output** - Applies filters and saves results

### Safe Factory Addresses
- **All Chains**: `0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2`

### Block Range Strategy
- **Ethereum**: Starts from block 15,000,000 (Safe deployment era)
- **Arbitrum**: Starts from block 1,000,000 (early Arbitrum)
- Processes in 10,000 block chunks to avoid RPC limits

## 📊 Usage Examples

### Extract All Safes
```bash
python safe_extractor.py --chain ethereum --output all-ethereum-safes.txt
```

### Extract High-Value Safes Only
```bash
python safe_extractor.py --chain arbitrum --min-value 50000 --output whale-safes.txt
```

### Analyze Safe Security (NEW!)
```bash
# Analyze a single Safe
python safe_analyzer.py --address 0x6f5c9B92DC47C89155930E708fBc305b55A5519A --chain ethereum

# Batch analyze extracted Safes
python safe_analyzer.py --batch whale-safes.txt --output csv --file security-analysis.csv
```

### Complete Workflow
```bash
# Step 1: Extract valuable Safes
python safe_extractor.py --chain ethereum --min-value 100000 --output valuable-safes.txt

# Step 2: Analyze their security
python safe_analyzer.py --batch valuable-safes.txt --output csv --file security-audit.csv
```

### Custom Block Range
```bash
python safe_extractor.py --chain ethereum --start-block 18000000 --end-block 18500000
```

### Test Specific Address
```bash
python safe_extractor.py --chain ethereum --test --test-address 0xcAD001c30E96765aC90307669d578219D4fb1DCe
```

## 🧪 Testing

The test suite validates:
- ✅ Basic extraction functionality
- ✅ Known Safe address detection
- ✅ Value filtering accuracy
- ✅ Multi-chain support
- ✅ Command-line interface

### Run Tests
```bash
python test_safe_extraction.py
```

Expected output:
```
🚀 Starting Safe Extraction Test Suite
==================================================
✅ PASS help
✅ PASS ethereum_basic
✅ PASS ethereum_address_1
✅ PASS arbitrum_basic
🏁 Overall: 8/8 tests passed (100.0%)
🎉 All tests passed!
```

## 🔄 Migration from Old Scripts

This unified tool replaces the following deprecated scripts:
- `extract_arbitrum_safes*.py` (5 files)
- `extract_ethereum_safes*.py` (4 files)
- `simple_safe_extractor.py`
- `test_safe_*.py` (4 files)

All functionality has been consolidated with improvements:
- ✅ **Unified interface** - One tool for all chains
- ✅ **Better error handling** - Robust retry logic
- ✅ **Configurable filtering** - Flexible value thresholds
- ✅ **Comprehensive testing** - Thorough validation
- ✅ **Clear documentation** - Better user experience

## 📈 Performance

### Speed Optimizations
- **Batch processing** - 10,000 block chunks
- **Rate limiting** - Respectful RPC usage
- **Parallel token queries** - Efficient value calculation
- **Resume capability** - Handle interruptions gracefully

### Resource Usage
- **Memory**: ~50MB typical usage
- **Network**: ~1-5 requests/second (respects RPC limits)
- **Storage**: ~100KB per 1,000 Safe addresses

## 🚨 Important Notes

### RPC Provider Considerations
- Uses public RPC endpoints by default
- For production use, consider dedicated RPC providers
- Rate limits are respected to avoid being blocked

### Portfolio Value Accuracy
- Token prices are hardcoded constants (update for production)
- Only includes major tokens (ETH, USDC, USDT, WETH, ARB)
- NFTs and exotic tokens are not included

### Block Range Optimization
- Default ranges are conservative for reliability
- Adjust `--start-block` and `--end-block` for specific needs
- Recent blocks may have higher Safe deployment activity

## 🤝 Contributing

When modifying these tools:
1. Run the test suite before committing changes
2. Update documentation for new features
3. Maintain backward compatibility where possible
4. Test with multiple chains and scenarios

## 📞 Support

For issues or questions:
1. Check the test output for specific error messages
2. Verify RPC endpoints are accessible
3. Review block ranges for the target chain
4. Consider rate limiting if seeing connection errors