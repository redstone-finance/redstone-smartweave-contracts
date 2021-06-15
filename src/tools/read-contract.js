const {readContract} = require("smartweave");
const helpers = require("./_helpers");
const registry = require("./contracts-registry.api");

module.exports = {
  contractsRegistry: async (onTestWeave = true) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);
    const {arweave} = await helpers.initArweave(onTestWeave);
    const result = await readContract(
      arweave,
      registry.getRegistryContractTxId(onTestWeave),
      null,
      true
    );
    console.log("\n=== RESULT ===\n", result, result.versions);
    return result;
  },

  providersRegistry: async (onTestWeave = true, txId = null) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);
    const {arweave} = await helpers.initArweave(onTestWeave);

    const providersContractTxId = txId || await registry.currentContractTxId("providers-registry", onTestWeave);

    console.log("Calling providers-registry", providersContractTxId);

    const result = await readContract(
      arweave,
      providersContractTxId,
      null,
      true
    );

    return result;

  }
}

require('make-runnable');
