const manifests = require("./manifests.api");
const providers = require("./providers-registry.api");
const helpers = require("./_helpers");

module.exports = {
  deploy: async (onTestWeave = true) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);

    console.log("Deploying manifests...");
    const {manifestMainTxId, manifestStocksTxId, manifestRapidTxId} = await manifests.deployAll(onTestWeave)

    console.log("Registering providers...");
    const [
      redstoneTxId,
      redstoneStocksTxId,
      redstoneRapidTxId] = await Promise.all(
      [
        providers.register("redstone", manifestMainTxId, onTestWeave),
        providers.register("redstone-stocks", manifestStocksTxId, onTestWeave),
        providers.register("redstone-rapid", manifestRapidTxId, onTestWeave),
      ]);

    return {redstoneTxId, redstoneStocksTxId, redstoneRapidTxId}
  },
}

require('make-runnable');
