import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Configure the Easter's Crypto plugin
 * @param {Object} userConfig - User-provided configuration
 * @returns {Object} Final configuration
 */
export function configurePlugin(userConfig = {}) {
  // Default configuration
  const defaultConfig = {
    blockchain: {
      network: process.env.NETWORK || 'mainnet',
      infuraApiKey: process.env.INFURA_API_KEY,
      privateKey: process.env.PRIVATE_KEY,
      rpcUrl: process.env.RPC_URL,
      useInfura: !!process.env.INFURA_API_KEY
    },
    enableUI: process.env.ENABLE_UI === 'true',
    ipfs: {
      projectId: process.env.IPFS_PROJECT_ID,
      projectSecret: process.env.IPFS_PROJECT_SECRET
    },
    api: {
      basePath: process.env.API_BASE_PATH || '/api/easters-crypto',
      port: parseInt(process.env.PORT || '3001', 10)
    }
  };

  // Merge with user configuration
  const finalConfig = {
    ...defaultConfig,
    ...userConfig,
    blockchain: {
      ...defaultConfig.blockchain,
      ...(userConfig.blockchain || {})
    },
    ipfs: {
      ...defaultConfig.ipfs,
      ...(userConfig.ipfs || {})
    },
    api: {
      ...defaultConfig.api,
      ...(userConfig.api || {})
    }
  };

  return finalConfig;
}
