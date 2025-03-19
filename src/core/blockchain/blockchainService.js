import { ethers } from 'ethers';
import Web3 from 'web3';

/**
 * BlockchainProvider handles connection to blockchain networks
 */
class BlockchainProvider {
  constructor(config) {
    this.config = config;
    this.provider = null;
    this.web3 = null;
    this.walletInstance = null;
    this.connected = false;
    
    this.initialize();
  }
  
  initialize() {
    try {
      // Initialize ethers provider
      if (this.config.useInfura) {
        this.provider = new ethers.providers.InfuraProvider(
          this.config.network,
          this.config.infuraApiKey
        );
      } else if (this.config.rpcUrl) {
        this.provider = new ethers.providers.JsonRpcProvider(this.config.rpcUrl);
      } else {
        this.provider = ethers.getDefaultProvider(this.config.network);
      }
      
      // Initialize Web3
      this.web3 = new Web3(
        this.config.rpcUrl || 
        `https://${this.config.network}.infura.io/v3/${this.config.infuraApiKey}`
      );
      
      // Set up wallet if private key is provided
      if (this.config.privateKey) {
        this.walletInstance = new ethers.Wallet(this.config.privateKey, this.provider);
      }
      
      this.connected = true;
    } catch (error) {
      console.error('Blockchain provider initialization failed:', error);
      this.connected = false;
    }
  }
  
  isConnected() {
    return this.connected;
  }
  
  getProvider() {
    return this.provider;
  }
  
  getWeb3() {
    return this.web3;
  }
  
  getWallet() {
    if (!this.walletInstance) {
      throw new Error('Wallet not configured. Provide a private key in configuration.');
    }
    return this.walletInstance;
  }
  
  async getGasPrice() {
    return await this.provider.getGasPrice();
  }
  
  async signMessage(message) {
    return await this.getWallet().signMessage(message);
  }
  
  async sendTransaction(transactionConfig) {
    const wallet = this.getWallet();
    const tx = await wallet.sendTransaction(transactionConfig);
    return await tx.wait();
  }
}

/**
 * Initialize blockchain services with provided configuration
 * @param {Object} config - Blockchain configuration
 */
function initializeBlockchain(config = {}) {
  // Apply default configuration
  const defaultConfig = {
    network: 'mainnet',
    useInfura: true,
    infuraApiKey: process.env.INFURA_API_KEY,
    privateKey: process.env.PRIVATE_KEY,
    rpcUrl: null
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  
  return new BlockchainProvider(finalConfig);
}

export {
  initializeBlockchain,
  BlockchainProvider
};
