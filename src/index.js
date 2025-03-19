import { initializeBlockchain } from './core/blockchain/blockchainService.js';
import { TokenManager } from './core/tokenization/tokenManager.js';
import { SmartContractService } from './core/smartContracts/smartContractService.js';
import { DomainResolver } from './core/domains/domainResolver.js';
import { configurePlugin } from './config/configService.js';

// UI Components (Optional)
import VerificationBadge from './ui/verification/VerificationBadge.js';
import TokenDisplay from './ui/tokenDisplay/TokenDisplay.js';
import DomainInfoPanel from './ui/domainInfo/DomainInfoPanel.js';

// API Routes
import apiRoutes from './api/routes.js';

// UI Components object for conditional export
const UI = {
  VerificationBadge,
  TokenDisplay,
  DomainInfoPanel
};

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

export {
  initEastersCrypto,
  UI
};
