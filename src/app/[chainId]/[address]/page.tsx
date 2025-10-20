import Link from 'next/link';
import MultisigChecker from '@/components/MultisigChecker';
import { SUPPORTED_CHAINS, CHAIN_EXAMPLES } from '@/constants/chains';

// Generate static params for most common examples for better performance
export async function generateStaticParams() {
  const params: { chainId: string; address: string }[] = [];
  
  // Only pre-generate a few common examples for better performance
  // All other addresses will be handled dynamically
  SUPPORTED_CHAINS.slice(0, 2).forEach(chain => {
    const examples = CHAIN_EXAMPLES[chain.id];
    if (examples) {
      examples.slice(0, 2).forEach(example => {
        params.push({
          chainId: chain.id.toString(),
          address: example.address,
        });
      });
    }
  });
  
  return params;
}

export default async function MultisigPage({
  params,
}: {
  params: Promise<{ chainId: string; address: string }>;
}) {
  const { chainId, address } = await params;

  // Validate chainId is supported
  const isValidChain = SUPPORTED_CHAINS.some(chain => chain.id.toString() === chainId);
  
  if (!isValidChain) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Unsupported Chain
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Chain ID {chainId} is not supported. Please use one of the supported chains.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Multisig Security Checker
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Analyze your Safe multisig contract to ensure it follows security best practices.
            Enter an Ethereum address below to get started.
          </p>
        </div>

        <MultisigChecker 
          initialChainId={parseInt(chainId)} 
          initialAddress={address}
          autoAnalyze={true}
        />
      </div>
    </div>
  );
}