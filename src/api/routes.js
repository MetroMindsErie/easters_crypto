import express from 'express';

/**
 * Create API routes for Easter's Crypto
 */
function createApiRoutes(services) {
  const router = express.Router();
  
  // Domain resolution endpoints
  router.get('/domain/:domainName', async (req, res) => {
    try {
      const { domainName } = req.params;
      const result = await services.domainResolver.resolveDomain(domainName);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Token management endpoints
  router.get('/token/:contractAddress/:tokenId', async (req, res) => {
    try {
      const { contractAddress, tokenId } = req.params;
      const result = await services.tokenManager.getTokenMetadata(contractAddress, tokenId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Smart contract endpoints
  router.get('/contracts', (req, res) => {
    try {
      const contracts = services.smartContractService.getDeployedContracts();
      res.json({ contracts });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  return router;
}

/**
 * API routes handler for Next.js integration
 */
export default function apiRoutes(req, res) {
  const services = this;
  const router = createApiRoutes(services);
  
  return router(req, res);
}
