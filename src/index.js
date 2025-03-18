const { initializeBlockchain } = require('./core/blockchain/blockchainService');
const { TokenManager } = require('./core/tokenization/tokenManager');
const { SmartContractService } = require('./core/smartContracts/smartContractService');
const { DomainResolver } = require('./core/domains/domainResolver');
const { configurePlugin } = require('./config/configService');

// UI Components (Optional)
const UI = {
  VerificationBadge: require('./ui/verification/VerificationBadge'),
  TokenDisplay: require('./ui/tokenDisplay/TokenDisplay'),
  DomainInfoPanel: require('./ui/domainInfo/DomainInfoPanel')
};

// API Routes
const apiRoutes = require('./api/routes');

/**
 * Initialize the Easter's Crypto plugin
 * @param {Object} config - Configuration options
 */
function initEastersCrypto(config = {}) {
  // Apply configuration
  const finalConfig = configurePlugin(config);
  
  // Initialize blockchain services
  const blockchainProvider = initializeBlockchain(finalConfig.blockchain);
  
  // Create service instances
  const tokenManager = new TokenManager(blockchainProvider);
  const smartContractService = new SmartContractService(blockchainProvider);
  const domainResolver = new DomainResolver(blockchainProvider);
  
  // Return the plugin API
  return {
    // Core services
    tokenManager,
    smartContractService,
    domainResolver,
    
    // UI Components (if enabled)
    UI: finalConfig.enableUI ? UI : null,
    
    // API routes for Next.js integration
    apiRoutes,
    
    // Configuration
    config: finalConfig,
    
    // Utility to get the plugin status
    getStatus: () => ({
      initialized: true,
      blockchainConnected: blockchainProvider.isConnected(),
      config: finalConfig
    })
  };
}

module.exports = {
  initEastersCrypto,
  UI
};
