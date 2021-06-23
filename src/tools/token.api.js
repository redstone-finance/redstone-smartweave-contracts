const {interactWrite, readContract} = require("smartweave");
const helpers = require("./_helpers");
const registry = require("./contracts-registry.api");

module.exports = {
  deploy: async (onTestWeave = true, baseContractTxId = null) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);

    const {arweave} = await helpers.initArweave(onTestWeave);

    let initialStateData = null;
    if (baseContractTxId !== null) {
      console.log("reading state for: ", baseContractTxId);

      initialStateData = (await readContract(
        arweave,
        baseContractTxId,
        null,
        true
      ));

      if (initialStateData === null) {
        throw new Error(`Could not read base state from ${baseContractTxId}`);
      }
    }

    const transactionId = await helpers.createContract(
      "./dist/token/token.contract.js",
      initialStateData?.state || `./dist/token/initial-state${onTestWeave ? '-test' : ''}.json`,
      onTestWeave
    );

    return await registry.register(onTestWeave, "token", transactionId, "initial deploy");
  },

  deposit: async (targetId, qty, onTestWeave = true) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);

    const {jwk, arweave, testWeave} = await helpers.initArweave(onTestWeave);

    const token = await registry.currentContractTxId("token", onTestWeave);

    console.log(`writing to token: ${token}`);

    const writeTxId = await interactWrite(
      arweave,
      jwk,
      token,
      {
        function: "deposit",
        data: {
          contractName: "providers-registry",
          targetId: targetId,
          qty: qty
        }
      }
    );

    if (onTestWeave) {
      console.log("Mining...");
      await testWeave.mine();
    } else {
      console.log("Waiting for block mining...");
      await helpers.waitForConfirmation(writeTxId, arweave);
    }

    return writeTxId;
  }

}

require('make-runnable');
