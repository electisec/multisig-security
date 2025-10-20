// Gnosis Safe ABI with all the functions we need
export const GNOSIS_SAFE_ABI = [
  {
    "inputs": [],
    "name": "VERSION",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getThreshold",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getOwners",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nonce",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "start", "type": "address"},
      {"internalType": "uint256", "name": "pageSize", "type": "uint256"}
    ],
    "name": "getModulesPaginated",
    "outputs": [
      {"internalType": "address[]", "name": "array", "type": "address[]"},
      {"internalType": "address", "name": "next", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getGuard",
    "outputs": [{"internalType": "address", "name": "guard", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getFallbackHandler",
    "outputs": [{"internalType": "address", "name": "handler", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Known official Safe fallback handlers that are safe to use
export const OFFICIAL_SAFE_FALLBACK_HANDLERS: { [address: string]: string } = {
  // CompatibilityFallbackHandler (current recommended handler)
  '0x017062a1de2fe6b99be3d9d37841fed19f573804': 'CompatibilityFallbackHandler',
  '0xf48f2b2d2a534e402487b3ee7c18c33aec0fe5e4': 'CompatibilityFallbackHandler 1.3.0',
  '0xfd0732dc9e303f09fcef3a7388ad10a83459ec99': 'CompatibilityFallbackHandler 1.4.1',

  // DefaultCallbackHandler (legacy but official)
  '0xd5d82b6addc9027b22dca772aa68d5d74cdbdf44': 'DefaultCallbackHandler',

  // TokenCallbackHandler (used by Safe UI)
  '0x7f6ab15b00e1e8e1d4ff2b25ce0e2e83dd5e24d1': 'TokenCallbackHandler',
  '0x6ac8d65dc698ae07263e3a98aa698c33060b4a13': 'TokenCallbackHandler',

  // SignMessageLib (for EIP-1271 signature verification)
  '0x98ffbbf51bb33a056b08ddf711f289936aaff717': 'SignMessageLib',
  '0xa65387f16b013cf2af4605ad8aa5ec25a2cbda83': 'SignMessageLib',

  // CreateCall (for creating contracts from Safe)
  '0x7cbb62eaa69f79e6873cd1ecb2392971036cfaa4': 'CreateCall',
  '0x9b35af71d77eaf8d7e40252370304687390a1a52': 'CreateCall',

  // SimulateTxAccessor (for simulating transactions)
  '0x59ad6735bcd8152b84860cb256dd9e96b85f69da': 'SimulateTxAccessor',
  '0x727a77a074d1e6c4530e814f89e618a3298fc044': 'SimulateTxAccessor',
};

// Sentinel address used for modules list
export const SENTINEL_MODULES_ADDRESS = '0x0000000000000000000000000000000000000001';