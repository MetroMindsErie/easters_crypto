import { ethers } from 'ethers';
import ERC721_ABI from './abis/ERC721.json' assert { type: 'json' };
import ERC1155_ABI from './abis/ERC1155.json' assert { type: 'json' };

/**
 * Manages tokenization operations for real estate assets
 */
class TokenManager {
  constructor(blockchainProvider) {
    this.provider = blockchainProvider;
    this.contracts = {};
  }
  
  /**
   * Initialize a contract instance for token management
   * @param {string} contractAddress - The token contract address
   * @param {string} tokenType - Type of token ('ERC721' or 'ERC1155')
   */
  loadContract(contractAddress, tokenType = 'ERC721') {
    if (!ethers.utils.isAddress(contractAddress)) {
      throw new Error('Invalid contract address');
    }
    
    const abi = tokenType === 'ERC1155' ? ERC1155_ABI : ERC721_ABI;
    
    try {
      // Use the wallet to get a contract instance with signer
      const wallet = this.provider.getWallet();
      this.contracts[contractAddress] = new ethers.Contract(
        contractAddress,
        abi,
        wallet
      );
      
      return this.contracts[contractAddress];
    } catch (error) {
      console.error('Contract loading error:', error);
      throw new Error(`Failed to load contract: ${error.message}`);
    }
  }
  
  /**
   * Mint a new NFT representing a property
   * @param {string} contractAddress - Address of the token contract
   * @param {string} tokenURI - Metadata URI for the token
   * @param {string} recipient - Address to receive the minted token
   * @param {object} propertyData - Additional property metadata
   */
  async mintPropertyToken(contractAddress, tokenURI, recipient, propertyData = {}) {
    try {
      const contract = this.contracts[contractAddress] || this.loadContract(contractAddress);
      
      // Include domain information if available
      const metadata = {
        propertyData,
        tokenURI,
        timestamp: Date.now()
      };
      
      // Call mint function (implementation depends on contract)
      const tx = await contract.mint(recipient, tokenURI, JSON.stringify(metadata));
      const receipt = await tx.wait();
      
      // Parse event to get the token ID
      const transferEvent = receipt.events.find(e => e.event === 'Transfer');
      const tokenId = transferEvent ? transferEvent.args.tokenId : null;
      
      return {
        success: true,
        tokenId: tokenId ? tokenId.toString() : null,
        transactionHash: receipt.transactionHash,
        metadata
      };
    } catch (error) {
      console.error('Token minting error:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }
  
  /**
   * Create fractional ownership tokens for a property
   * @param {string} contractAddress - ERC1155 contract address
   * @param {number} tokenId - ID of the property token
   * @param {number} fractions - Number of fractions to create
   */
  async createFractionalTokens(contractAddress, tokenId, fractions) {
    try {
      const contract = this.contracts[contractAddress] ||
        this.loadContract(contractAddress, 'ERC1155');
      
      const tx = await contract.mint(
        this.provider.getWallet().address,
        tokenId,
        fractions,
        ethers.utils.toUtf8Bytes("")  // No additional data
      );
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        tokenId,
        fractions,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Fractional token creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get token metadata
   * @param {string} contractAddress - Token contract address
   * @param {string} tokenId - ID of the token
   */
  async getTokenMetadata(contractAddress, tokenId) {
    try {
      const contract = this.contracts[contractAddress] || this.loadContract(contractAddress);
      
      // Get token URI from contract
      const tokenURI = await contract.tokenURI(tokenId);
      
      // Fetch metadata from the URI (could be IPFS, HTTP, etc.)
      let metadata = null;
      if (tokenURI.startsWith('ipfs://')) {
        // Logic to fetch from IPFS
        const ipfsHash = tokenURI.replace('ipfs://', '');
        // Implementation depends on how you want to fetch from IPFS
      } else if (tokenURI.startsWith('http')) {
        // Fetch from HTTP URL
        const response = await fetch(tokenURI);
        metadata = await response.json();
      }
      
      return {
        tokenId,
        tokenURI,
        metadata,
        owner: await contract.ownerOf(tokenId)
      };
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Transfer token ownership
   * @param {string} contractAddress - Token contract address
   * @param {string} tokenId - ID of the token
   * @param {string} from - Current owner address
   * @param {string} to - New owner address
   */
  async transferToken(contractAddress, tokenId, from, to) {
    try {
      const contract = this.contracts[contractAddress] || this.loadContract(contractAddress);
      
      const tx = await contract.transferFrom(from, to, tokenId);
      const receipt = await tx.wait();
      
      return {
        success: true,
        tokenId,
        from,
        to,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Token transfer error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export {
  TokenManager
};
