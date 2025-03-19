import { ethers } from 'ethers';
import contentHash from 'content-hash';
import ENS_REGISTRY_ABI from './abis/ENSRegistry.json' assert { type: 'json' };
import ENS_RESOLVER_ABI from './abis/ENSPublicResolver.json' assert { type: 'json' };

/**
 * Domain resolver for crypto domains (.eth, .crypto, etc.)
 */
class DomainResolver {
  constructor(blockchainProvider) {
    this.provider = blockchainProvider;
    
    // ENS Registry contract address (mainnet)
    this.ensRegistryAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
    
    // Initialize ENS contracts
    this.initializeENSContracts();
  }
  
  initializeENSContracts() {
    this.ensRegistry = new ethers.Contract(
      this.ensRegistryAddress,
      ENS_REGISTRY_ABI,
      this.provider.getProvider()
    );
  }
  
  /**
   * Resolve an ENS domain (.eth)
   * @param {string} domain - ENS domain to resolve (example.eth)
   */
  async resolveENSDomain(domain) {
    try {
      // Normalize domain
      if (!domain.endsWith('.eth')) {
        domain = `${domain}.eth`;
      }
      
      // Get the resolver for this domain
      const resolverAddress = await this.ensRegistry.resolver(ethers.utils.namehash(domain));
      
      if (resolverAddress === ethers.constants.AddressZero) {
        return {
          success: false,
          error: `No resolver found for domain ${domain}`
        };
      }
      
      // Create resolver contract instance
      const resolver = new ethers.Contract(
        resolverAddress,
        ENS_RESOLVER_ABI,
        this.provider.getProvider()
      );
      
      // Get the address this domain points to
      const address = await resolver.addr(ethers.utils.namehash(domain));
      
      // Try to get content hash (IPFS or other content identifiers)
      let content = null;
      try {
        const contentHashHex = await resolver.contenthash(ethers.utils.namehash(domain));
        if (contentHashHex && contentHashHex !== '0x') {
          content = {
            raw: contentHashHex,
            decoded: contentHash.decode(contentHashHex)
          };
        }
      } catch (e) {
        // Content hash might not be available - ignore
      }
      
      // Get text records for metadata
      const metadata = {};
      try {
        // Common text records for real estate domains
        const textRecords = [
          'description', 'url', 'email', 'avatar',
          'property.location', 'property.beds', 'property.baths',
          'property.sqft', 'property.images', 'property.video'
        ];
        
        for (const key of textRecords) {
          try {
            const value = await resolver.text(ethers.utils.namehash(domain), key);
            if (value && value !== '') {
              metadata[key] = value;
            }
          } catch (e) {
            // Skip if this record doesn't exist
          }
        }
      } catch (e) {
        // Text record retrieval failed - continue
      }
      
      return {
        success: true,
        domain,
        address,
        content,
        metadata,
        resolverAddress
      };
    } catch (error) {
      console.error('ENS domain resolution error:', error);
      return {
        success: false,
        domain,
        error: error.message
      };
    }
  }
  
  /**
   * Resolve a Unstoppable domain (.crypto, .nft, etc.)
   * @param {string} domain - Unstoppable domain to resolve
   */
  async resolveUnstoppableDomain(domain) {
    try {
      // Unstoppable Domains resolution requires specific contracts
      // Simplified implementation - would need the official Unstoppable Domains SDK
      // or contract interactions for full implementation
      
      // Return placeholder response
      return {
        success: false,
        domain,
        error: "Unstoppable Domains resolution requires additional implementation"
      };
    } catch (error) {
      return {
        success: false,
        domain,
        error: error.message
      };
    }
  }
  
  /**
   * Resolve any crypto domain and get its metadata
   * @param {string} domain - Crypto domain to resolve
   */
  async resolveDomain(domain) {
    if (domain.endsWith('.eth')) {
      return this.resolveENSDomain(domain);
    } else if (['crypto', 'nft', 'blockchain', 'bitcoin', 'x', 'dao'].some(tld => domain.endsWith(`.${tld}`))) {
      return this.resolveUnstoppableDomain(domain);
    } else {
      return {
        success: false,
        domain,
        error: "Unsupported domain type. Supported: .eth, .crypto, .nft, etc."
      };
    }
  }
  
  /**
   * Verify domain ownership (check if address owns the domain)
   * @param {string} domain - Domain to check
   * @param {string} address - Address to verify against
   */
  async verifyDomainOwnership(domain, address) {
    try {
      const resolution = await this.resolveDomain(domain);
      
      if (!resolution.success) {
        return {
          success: false,
          verified: false,
          error: resolution.error
        };
      }
      
      // Compare resolved address with provided address
      const isOwner = resolution.address.toLowerCase() === address.toLowerCase();
      
      return {
        success: true,
        verified: isOwner,
        domain,
        ownerAddress: resolution.address
      };
    } catch (error) {
      return {
        success: false,
        verified: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get property metadata from crypto domain
   * @param {string} domain - Domain to extract property data from
   */
  async getPropertyMetadata(domain) {
    const resolution = await this.resolveDomain(domain);
    
    if (!resolution.success) {
      return resolution;
    }
    
    // Extract property-specific metadata
    const propertyMetadata = {};
    
    for (const [key, value] of Object.entries(resolution.metadata)) {
      if (key.startsWith('property.')) {
        propertyMetadata[key.replace('property.', '')] = value;
      }
    }
    
    // Try to parse JSON data from specific fields
    try {
      if (resolution.metadata['property.images']) {
        propertyMetadata.images = JSON.parse(resolution.metadata['property.images']);
      }
    } catch (e) {
      // If parsing fails, keep as string
    }
    
    return {
      ...resolution,
      propertyMetadata
    };
  }
}

export {
  DomainResolver
};
