// Test script to check chain configuration for all Safe addresses
import { createPublicClient, http } from 'viem';
import { mainnet, base, arbitrum, optimism, polygon } from 'viem/chains';

const GNOSIS_SAFE_ABI = [
  {
    "inputs": [],
    "name": "VERSION",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const SUPPORTED_CHAINS = [
  {
    id: 1,
    name: 'Ethereum',
    viemChain: mainnet,
    rpcUrl: 'https://eth.drpc.org'
  },
  {
    id: 8453,
    name: 'Base',
    viemChain: base,
    rpcUrl: 'https://base.drpc.org'
  },
  {
    id: 42161,
    name: 'Arbitrum',
    viemChain: arbitrum,
    rpcUrl: 'https://arbitrum.drpc.org'
  },
  {
    id: 10,
    name: 'Optimism',
    viemChain: optimism,
    rpcUrl: 'https://optimism.drpc.org'
  },
  {
    id: 137,
    name: 'Polygon',
    viemChain: polygon,
    rpcUrl: 'https://polygon.drpc.org'
  }
];

const COMPREHENSIVE_SAFE_LIST = {
  1: [
    { address: '0x73b047fe6337183A454c5217241D780a932777bD', name: 'Lido Emergency Brakes Multisig' },
    { address: '0x3B59C6d0034490093460787566dc5D6cE17F2f9C', name: 'Uniswap Accountability Committee' },
    { address: '0xcAD001c30E96765aC90307669d578219D4fb1DCe', name: 'Euler Finance DAO' },
    { address: '0xFEB4acf3df3cDEA7399794D0869ef76A6EfAff52', name: 'Yearn DAO Multisig' },
    { address: '0x467947EE34aF926cF1DCac093870f613C96B1E0c', name: 'Curve Finance Emergency Owner'},
    { address: '0x4FF1b9D9ba8558F5EAfCec096318eA0d8b541971', name: 'Origin Finance Guardian Multisig' },
    { address: '0x9fC3dc011b461664c835F2527fffb1169b3C213e', name: 'Ethereum Foundation DeFi Multisig' },
    { address: '0xac140648435d03f784879cd789130f22ef588fcd', name: 'Aave Chan Initiative' },
    { address: '0xF6aF7dA33f86F138Cc7DBE3a970De1905Da5d1E8', name: 'LooksRare Team Safe Multisig' },
    { address: '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f', name: 'Balancer DAO Multisig' }
  ],
  8453: [
    { address: '0x1a07dceefeebba3d1873e2b92bef190d2f11c3cb', name: 'Beefy Finance Multisig' },
    { address: '0xcBa28b38103307Ec8dA98377ffF9816C164f9AFa', name: 'Morpho DAO Multisig' },
    { address: '0xBDE0c70BdC242577c52dFAD53389F82fd149EA5a', name: 'Aerodrome Team Multisig'}
  ],
  42161: [
    { address: '0x7c68c42de679ffb0f16216154c996c354cf1161b', name: 'Balancer Protocol Fees Multisig' },
    { address: '0xc9647361742eb964965b461c44bdf5c4bc3c406d', name: 'Ethena Multisig' },
    { address: '0x6346282db8323a54e840c6c772b4399c9c655c0d', name: 'Yearn Strategist Multisig' }
  ],
  10: [
    { address: '0x838352F4E3992187a33a04826273dB3992Ee2b3f', name: 'Velodrome Council'},
    { address: '0x4Cf8fE0A4c2539F7EFDD2047d8A5D46F14613088', name: 'Lido Emergency Brakes Multisig' }
  ],
  137: [
    { address: '0xc0c07644631543c3af2fA7230D387C5fA418a131', name: 'Angle Protocol Management Multisig' },
    { address: '0x47290de56e71dc6f46c26e50776fe86cc8b21656', name: 'Stargate Finance Multisig' }
  ]
};

function createClient(chain) {
  return createPublicClient({
    chain: chain.viemChain,
    transport: http(chain.rpcUrl)
  });
}

async function checkContractCode(address, chain) {
  try {
    const client = createClient(chain);
    const code = await client.getBytecode({ address: address });
    return code !== undefined && code !== '0x';
  } catch {
    return false;
  }
}

async function checkChainConfiguration(address) {
  const deployedChains = [];
  
  for (const chain of SUPPORTED_CHAINS) {
    try {
      const hasCode = await checkContractCode(address, chain);
      if (hasCode) {
        try {
          const client = createClient(chain);
          await client.readContract({
            address: address,
            abi: GNOSIS_SAFE_ABI,
            functionName: 'VERSION'
          });
          deployedChains.push(chain);
        } catch {
          // Not a Safe contract
        }
      }
    } catch {
      // Network error, skip
    }
  }
  
  return {
    deployedChains,
    isMultiChain: deployedChains.length > 1,
    totalDeployments: deployedChains.length
  };
}

async function testAllSafes() {
  console.log('🔍 Testing Chain Configuration for Safe Multisigs');
  console.log('=' + '='.repeat(80));
  console.log('');
  
  const results = {
    singleChain: [],
    multiChain: [],
    errors: []
  };
  
  let totalChecked = 0;
  
  for (const [chainId, safes] of Object.entries(COMPREHENSIVE_SAFE_LIST)) {
    const chainName = SUPPORTED_CHAINS.find(c => c.id === parseInt(chainId))?.name || chainId;
    console.log(`\n📡 Checking ${chainName} Safes...`);
    console.log('-'.repeat(80));
    
    for (const safe of safes) {
      totalChecked++;
      process.stdout.write(`  Checking ${safe.name}... `);
      
      try {
        const config = await checkChainConfiguration(safe.address);
        
        if (config.totalDeployments === 0) {
          console.log('❌ Not found');
          results.errors.push({
            ...safe,
            originalChain: chainName,
            error: 'Not found on any chain'
          });
        } else if (config.totalDeployments === 1) {
          console.log(`✅ Single chain (${config.deployedChains[0].name})`);
          results.singleChain.push({
            ...safe,
            originalChain: chainName,
            deployedChains: config.deployedChains
          });
        } else {
          const chains = config.deployedChains.map(c => c.name).join(', ');
          console.log(`⚠️  MULTI-CHAIN! (${chains})`);
          results.multiChain.push({
            ...safe,
            originalChain: chainName,
            deployedChains: config.deployedChains,
            totalDeployments: config.totalDeployments
          });
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.errors.push({
          ...safe,
          originalChain: chainName,
          error: error.message
        });
      }
    }
  }
  
  // Print summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 CHAIN CONFIGURATION ANALYSIS SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTotal Safes Checked: ${totalChecked}`);
  console.log(`✅ Single Chain Deployments: ${results.singleChain.length} (${(results.singleChain.length/totalChecked*100).toFixed(1)}%)`);
  console.log(`⚠️  Multi-Chain Deployments: ${results.multiChain.length} (${(results.multiChain.length/totalChecked*100).toFixed(1)}%)`);
  console.log(`❌ Errors: ${results.errors.length}`);
  
  // Highlight multi-chain deployments (outliers)
  if (results.multiChain.length > 0) {
    console.log('\n\n🚨 MULTI-CHAIN DEPLOYMENT OUTLIERS (REPLAY ATTACK RISK!)');
    console.log('='.repeat(80));
    console.log('These Safes exist on multiple chains with the same address:');
    console.log('');
    
    results.multiChain.forEach((safe, index) => {
      console.log(`${index + 1}. ${safe.name}`);
      console.log(`   Address: ${safe.address}`);
      console.log(`   Originally listed on: ${safe.originalChain}`);
      console.log(`   Deployed on ${safe.totalDeployments} chains: ${safe.deployedChains.map(c => c.name).join(', ')}`);
      console.log(`   ⚠️  Security Risk: Signatures could potentially be replayed across chains!`);
      console.log('');
    });
    
    console.log('💡 Recommendation: These Safes should ensure all transactions include proper');
    console.log('   chain ID verification to prevent replay attacks.');
  } else {
    console.log('\n\n✅ GOOD NEWS!');
    console.log('No multi-chain deployments detected in the tested sample.');
    console.log('All Safes are deployed on a single chain, eliminating replay attack risks.');
  }
  
  // Show errors if any
  if (results.errors.length > 0) {
    console.log('\n\n❌ ERRORS ENCOUNTERED');
    console.log('='.repeat(80));
    results.errors.forEach((safe, index) => {
      console.log(`${index + 1}. ${safe.name} (${safe.originalChain})`);
      console.log(`   Address: ${safe.address}`);
      console.log(`   Error: ${safe.error}`);
      console.log('');
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Chain Configuration Check Complete!');
  console.log('='.repeat(80));
}

testAllSafes().catch(console.error);
