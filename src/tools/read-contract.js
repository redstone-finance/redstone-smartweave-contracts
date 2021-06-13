const {readContract} = require("smartweave");
const helpers = require("./_helpers");
const registry = require("./contracts-registry.api");

module.exports = {
  contractsRegistry: async (onTestWeave = true) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);
    const {arweave} = await helpers.initArweave(onTestWeave);
    const result = await readContract(
      arweave,
      registry.getRegistryContractTxId(onTestWeave)
    );
    console.log("\n=== RESULT ===\n", result, result.versions, result.versions["v1"]);
  },

  providersRegistry: async (onTestWeave = true) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);
    const {arweave} = await helpers.initArweave(onTestWeave);

    const providersContractTxId = await registry.currentContractTxId("providers-registry", onTestWeave);

    console.log("Calling providers-registry", providersContractTxId);

    const result = await readContract(
      arweave,
      providersContractTxId,
      null,
      true
    );
    console.log("\n=== RESULT ===\n", result.state.providers, result.validity);

  }
}

require('make-runnable');
