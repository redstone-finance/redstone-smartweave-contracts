# redstone-smartweave-contracts

## Update manifest for a provider
- Firstly, place your JWK key in `.secrets/redstone-jwk.json`
- Then run the following command `node src/tools/providers-registry.api.js addManifest "<PATH_TO_MANIFEST>" "<UPDATE_COMMENT>" 0 false`

Example:
```bash
node src/tools/providers-registry.api.js addManifest "../redstone-node/manifests/all-supported-tokens.json" "Added pangolin source with Avax tokens" 0 false
```

## Register a new provider
You can register a new provider after adding a manifest from its wallet

- Add provider details to the tools/provider-registry.api.js
- Update `providerToConfig` mapping
- Run `node src/tools/providers-registry.api.js register "<PROVIDER_NAME>" "<MANIFEST_TX_ID>" false`

Example:
```bash
node src/tools/providers-registry.api.js register "redstone-avalanche" "aqr1QCGj6zwQzZmfqDK2k3QFfoBU3904ZKrcq6OIbZE" false
```
