# redstone-smartweave-contracts

## Deployment

- Firstly, place your JWK key in `.secrets/redstone-jwk.json`
- Then run the following command `node src/tools/providers-registry.api.js addManifest "<PATH_TO_MANIFEST>" "<UPDATE_COMMENT>" 0 false`

For example:
```bash
node src/tools/providers-registry.api.js addManifest "../redstone-node/manifests/all-supported-tokens.json" "Added pangolin source with Avax tokens" 0 false
```
