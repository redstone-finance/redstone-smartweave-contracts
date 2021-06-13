const fs = require("fs");
const helpers = require("./_helpers");

module.exports = {
  deploy: async (pathToManifest, onTestWeave = true) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);
    const {jwk, arweave, testWeave} = await helpers.initArweave(onTestWeave);

    const data = fs.readFileSync(pathToManifest, "utf-8");

    const dataTransaction = await arweave.createTransaction({data}, jwk);
    await arweave.transactions.sign(dataTransaction, jwk)
    await arweave.transactions.post(dataTransaction)

    if (onTestWeave) {
      await testWeave.mine();
    } else {
      console.log("Waiting for block mining...");
      await helpers.waitForConfirmation(dataTransaction.id, arweave);
    }

    return dataTransaction.id;
  },

  deployAll: async (onTestWeave = true) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);
    const [
      manifestMainTxId,
      manifestStocksTxId,
      manifestRapidTxId] = await Promise.all(
      [
        module.exports.deploy("../redstone-node/manifests/all-supported-tokens.json", onTestWeave),
        module.exports.deploy("../redstone-node/manifests/stocks.json", onTestWeave),
        module.exports.deploy("../redstone-node/manifests/rapid.json", onTestWeave),
      ]);

    return {manifestMainTxId, manifestStocksTxId, manifestRapidTxId};
  }
}

require('make-runnable');
