# Easter's Crypto Integration Guide

![Easter's Crypto](https://via.placeholder.com/150?text=Easter%27s+Crypto)

## 🚀 Overview

Easter's Crypto is a modular backend service that provides tokenization and smart contract functionality for real estate applications. It's designed to be easily integrated into existing Next.js applications while offering powerful blockchain capabilities with minimal setup.

## 🔑 Key Features

- **Property Tokenization**: Mint NFTs representing real estate properties
- **Fractional Ownership**: Create and manage fractional ownership tokens
- **Crypto Domain Resolution**: Verify ownership through crypto domains (.eth, .crypto, etc.)
- **Smart Contract Deployment**: Deploy and interact with property marketplace contracts
- **Modular Integration**: Easily plug into existing Next.js applications
- **Optional UI Components**: Ready-to-use React components for verification displays

## 📋 Prerequisites

- Node.js (v14+)
- A Next.js application (v12+)
- Basic understanding of blockchain concepts
- Infura API key (or alternative Ethereum provider)
- Ethereum wallet with private key (for transactions)

## 🛠️ Installation

```bash
# Install the package from npm
npm install easters-crypto

# Or using yarn
yarn add easters-crypto
```

## ⚙️ Configuration

1. Create a `.env.local` file in your Next.js project root with the following variables:

```properties
# Blockchain Configuration
INFURA_API_KEY=your_infura_api_key
PRIVATE_KEY=your_wallet_private_key
NETWORK=mainnet  # or rinkeby, goerli, etc.

# Optional configurations
RPC_URL=your_custom_rpc_url  # Alternative to Infura
IPFS_PROJECT_ID=your_ipfs_project_id
IPFS_PROJECT_SECRET=your_ipfs_project_secret
```

2. Import and initialize Easter's Crypto in your Next.js application:

```javascript
// In pages/_app.js or equivalent
import { initEastersCrypto } from 'easters-crypto';

// Initialize with configuration
const eastersCrypto = initEastersCrypto({
  blockchain: {
    network: process.env.NETWORK || 'mainnet',
    infuraApiKey: process.env.INFURA_API_KEY,
    privateKey: process.env.PRIVATE_KEY
  },
  enableUI: true // Enable UI components
});

// Make it available to your app
export default function MyApp({ Component, pageProps }) {
  return (
    <Component 
      {...pageProps} 
      eastersCrypto={eastersCrypto} 
    />
  );
}
```

## 🔍 Usage Examples

### Setting up API Routes

Create a file at `pages/api/easters-crypto/[...path].js`:

```javascript
// Import API routes from Easter's Crypto
import { initEastersCrypto } from 'easters-crypto';

const eastersCrypto = initEastersCrypto({
  blockchain: {
    network: process.env.NETWORK,
    infuraApiKey: process.env.INFURA_API_KEY,
    privateKey: process.env.PRIVATE_KEY
  }
});

// Forward requests to Easter's Crypto API handler
export default function handler(req, res) {
  return eastersCrypto.apiRoutes(req, res);
}
```

### Tokenizing a Property

```javascript
import { useState } from 'react';

export default function TokenizePage({ eastersCrypto }) {
  const [tokenId, setTokenId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleTokenize = async () => {
    setLoading(true);
    
    // Example contract address - you'd deploy this first
    const contractAddress = "0x1234...5678";
    
    // Property details
    const propertyData = {
      address: "123 Blockchain Ave, Crypto City",
      beds: 3,
      baths: 2,
      sqft: 2000,
      description: "Beautiful property with modern amenities"
    };
    
    // Metadata URI (could be IPFS)
    const tokenURI = "https://example.com/property/metadata.json";
    
    // Recipient address (could be the user's wallet)
    const recipientAddress = "0xabcd...1234";
    
    try {
      const result = await eastersCrypto.tokenManager.mintPropertyToken(
        contractAddress,
        tokenURI,
        recipientAddress,
        propertyData
      );
      
      if (result.success) {
        setTokenId(result.tokenId);
        console.log("Property tokenized successfully:", result);
      } else {
        console.error("Tokenization failed:", result.error);
      }
    } catch (error) {
      console.error("Exception during tokenization:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h1>Tokenize Property</h1>
      <button 
        onClick={handleTokenize} 
        disabled={loading}
      >
        {loading ? "Processing..." : "Tokenize Property"}
      </button>
      
      {tokenId && (
        <div>
          <h2>Success!</h2>
          <p>Token ID: {tokenId}</p>
        </div>
      )}
    </div>
  );
}
```

### Using the Verification Badge Component

```javascript
import { useState, useEffect } from 'react';

export default function PropertyListing({ eastersCrypto, propertyDomain }) {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function verifyDomain() {
      if (propertyDomain) {
        const result = await eastersCrypto.domainResolver.resolveDomain(propertyDomain);
        setVerified(result.success);
        setLoading(false);
      }
    }
    
    verifyDomain();
  }, [propertyDomain, eastersCrypto]);
  
  // Early return for loading state
  if (loading) return <p>Verifying domain...</p>;
  
  // Get the VerificationBadge component if UI is enabled
  const VerificationBadge = eastersCrypto.UI?.VerificationBadge;
  
  return (
    <div className="property-card">
      <h2>Luxury Downtown Condo</h2>
      
      {/* Display verification badge if UI is enabled */}
      {VerificationBadge && (
        <VerificationBadge 
          isVerified={verified}
          domain={propertyDomain}
          size="medium"
          onClick={() => window.open(`https://app.ens.domains/name/${propertyDomain}`)}
        />
      )}
      
      {/* Alternative if UI is disabled */}
      {!VerificationBadge && verified && (
        <span>✓ Verified</span>
      )}
      
      <p>3 bed, 2 bath luxury condo in prime downtown location</p>
      <p>Price: 250 ETH</p>
    </div>
  );
}
```

### Resolving Crypto Domains

```javascript
export default function DomainInfo({ eastersCrypto }) {
  const [domain, setDomain] = useState('');
  const [domainData, setDomainData] = useState(null);
  
  const handleResolveDomain = async () => {
    if (!domain) return;
    
    const result = await eastersCrypto.domainResolver.resolveDomain(domain);
    
    if (result.success) {
      setDomainData(result);
    } else {
      alert(`Failed to resolve domain: ${result.error}`);
    }
  };
  
  return (
    <div>
      <h1>Domain Resolver</h1>
      
      <input 
        type="text" 
        value={domain} 
        onChange={(e) => setDomain(e.target.value)}
        placeholder="Enter domain (e.g., myestate.eth)"
      />
      
      <button onClick={handleResolveDomain}>Resolve Domain</button>
      
      {domainData && (
        <div>
          <h2>Domain Information</h2>
          <p>Address: {domainData.address}</p>
          
          {domainData.metadata && (
            <div>
              <h3>Property Details</h3>
              <ul>
                {Object.entries(domainData.metadata).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {value}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## 📚 API Documentation

### Core Services

#### Token Manager

- `loadContract(contractAddress, tokenType)`: Load a token contract
- `mintPropertyToken(contractAddress, tokenURI, recipient, propertyData)`: Mint a new property token
- `createFractionalTokens(contractAddress, tokenId, fractions)`: Create fractional ownership tokens
- `getTokenMetadata(contractAddress, tokenId)`: Get token metadata
- `transferToken(contractAddress, tokenId, from, to)`: Transfer token ownership

#### Smart Contract Service

- `loadContract(address, abi)`: Load an existing smart contract
- `deployTokenizationContract(name, symbol)`: Deploy a new property tokenization contract
- `deployFractionalContract(propertyTokenAddress)`: Deploy a fractional ownership contract
- `listPropertyForSale(marketplaceAddress, tokenId, price)`: List a property for sale
- `buyProperty(marketplaceAddress, tokenId, shares)`: Buy property or fractional shares

#### Domain Resolver

- `resolveDomain(domain)`: Resolve any crypto domain (.eth, .crypto, etc.)
- `verifyDomainOwnership(domain, address)`: Verify domain ownership
- `getPropertyMetadata(domain)`: Extract property metadata from domain

### UI Components

- `VerificationBadge`: Display verification status with configurable styling
- `TokenDisplay`: Visualize property tokens with metadata
- `DomainInfoPanel`: Display domain resolution information

## 🔄 Blockchain Networks

Easter's Crypto supports the following networks:

- Ethereum Mainnet
- Rinkeby (testnet)
- Goerli (testnet)
- Sepolia (testnet)
- Custom networks (via RPC URL)

## 🛣️ Roadmap

- Support for additional blockchain networks (Polygon, Arbitrum)
- Extended support for Unstoppable Domains
- Enhanced fractional ownership management
- Interactive property marketplace components
- IPFS metadata storage integration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email support@easterscrypto.com or open an issue on our GitHub repository.

---

Built with ❤️ by Easter's Crypto Team
