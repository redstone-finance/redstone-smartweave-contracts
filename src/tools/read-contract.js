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
    return {result, versions: result.state.versions, v1: result.state.versions.v1.contracts};
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

  },

  token: async(onTestWeave = true, txId = null) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);
    const {arweave} = await helpers.initArweave(onTestWeave);

    const tokenContractTxId = txId || await registry.currentContractTxId("token", onTestWeave);

    console.log("Calling token", tokenContractTxId);

    const result = await readContract(
      arweave,
      tokenContractTxId,
      null,
      true
    );

    return {result, balances: result.state.balances, deposits: JSON.stringify(result.state.contractDeposits)};
  }
}

require('make-runnable');
