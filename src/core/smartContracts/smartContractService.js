const { ethers } = require('ethers');
const PROPERTY_MARKETPLACE_ABI = require('./abis/PropertyMarketplace.json');
const FRACTIONAL_REGISTRY_ABI = require('./abis/FractionalRegistry.json');

/**
 * Service for deploying and interacting with smart contracts
 */
class SmartContractService {
  constructor(blockchainProvider) {
    this.provider = blockchainProvider;
    this.deployedContracts = {};
  }
  
  /**
   * Load an existing contract
   * @param {string} address - Contract address
   * @param {Array|Object} abi - Contract ABI
   */
  loadContract(address, abi) {
    if (!ethers.utils.isAddress(address)) {
      throw new Error('Invalid contract address');
    }
    
    try {
      const contract = new ethers.Contract(
        address,
        abi,
        this.provider.getWallet()
      );
      
      this.deployedContracts[address] = {
        contract,
        address,
        type: 'custom'
      };
      
      return contract;
    } catch (error) {
      console.error('Contract loading error:', error);
      throw new Error(`Failed to load contract: ${error.message}`);
    }
  }
  
  /**
   * Deploy a property tokenization contract
   * @param {string} name - Token name
   * @param {string} symbol - Token symbol
   */
  async deployTokenizationContract(name, symbol) {
    try {
      // Contract factory for property tokenization (ERC721)
      const contractFactory = new ethers.ContractFactory(
        PROPERTY_MARKETPLACE_ABI.abi,
        PROPERTY_MARKETPLACE_ABI.bytecode,
        this.provider.getWallet()
      );
      
      // Deploy the contract
      const contract = await contractFactory.deploy(name, symbol);
      await contract.deployed();
      
      this.deployedContracts[contract.address] = {
        contract,
        address: contract.address,
        type: 'PropertyTokenization'
      };
      
      return {
        success: true,
        contractAddress: contract.address,
        name,
        symbol,
        transactionHash: contract.deployTransaction.hash
      };
    } catch (error) {
      console.error('Contract deployment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Deploy a fractional ownership contract
   * @param {string} propertyTokenAddress - Address of the property token contract
   */
  async deployFractionalContract(propertyTokenAddress) {
    try {
      if (!ethers.utils.isAddress(propertyTokenAddress)) {
        throw new Error('Invalid property token address');
      }
      
      // Contract factory for fractional ownership (ERC1155)
      const contractFactory = new ethers.ContractFactory(
        FRACTIONAL_REGISTRY_ABI.abi,
        FRACTIONAL_REGISTRY_ABI.bytecode,
        this.provider.getWallet()
      );
      
      // Deploy with property contract as parameter
      const contract = await contractFactory.deploy(propertyTokenAddress);
      await contract.deployed();
      
      this.deployedContracts[contract.address] = {
        contract,
        address: contract.address,
        type: 'FractionalOwnership',
        propertyTokenAddress
      };
      
      return {
        success: true,
        contractAddress: contract.address,
        propertyTokenAddress,
        transactionHash: contract.deployTransaction.hash
      };
    } catch (error) {
      console.error('Fractional contract deployment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * List property for sale
   * @param {string} marketplaceAddress - Address of marketplace contract
   * @param {string} tokenId - ID of the property token
   * @param {string} price - Price in wei
   */
  async listPropertyForSale(marketplaceAddress, tokenId, price) {
    try {
      const contract = this.deployedContracts[marketplaceAddress]?.contract || 
        this.loadContract(marketplaceAddress, PROPERTY_MARKETPLACE_ABI.abi);
      
      const tx = await contract.listProperty(tokenId, ethers.BigNumber.from(price));
      const receipt = await tx.wait();
      
      return {
        success: true,
        tokenId,
        price,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Property listing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Buy property or fractional shares
   * @param {string} marketplaceAddress - Address of marketplace contract
   * @param {string} tokenId - ID of the property token
   * @param {number} shares - Number of shares to buy (for fractional)
   */
  async buyProperty(marketplaceAddress, tokenId, shares = 1) {
    try {
      const contract = this.deployedContracts[marketplaceAddress]?.contract ||
        this.loadContract(marketplaceAddress, PROPERTY_MARKETPLACE_ABI.abi);
      
      // Get listing info to determine the price
      const listing = await contract.getPropertyListing(tokenId);
      const price = listing.price.mul(shares);
      
      const tx = await contract.purchaseProperty(tokenId, shares, { value: price });
      const receipt = await tx.wait();
      
      return {
        success: true,
        tokenId,
        shares,
        price: price.toString(),
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Property purchase error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get the list of contracts deployed by this service
   */
  getDeployedContracts() {
    const contracts = {};
    
    for (const [address, details] of Object.entries(this.deployedContracts)) {
      contracts[address] = {
        address,
        type: details.type,
        ...(details.propertyTokenAddress && { propertyTokenAddress: details.propertyTokenAddress })
      };
    }
    
    return contracts;
  }
}

module.exports = {
  SmartContractService
};
