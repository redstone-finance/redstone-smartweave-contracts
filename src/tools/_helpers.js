const Arweave = require("arweave/node");
const fs = require("fs");
const {createContract} = require("smartweave");
const TestWeave = require("testweave-sdk").default;

module.exports = {
  initArweave: async (onTestWeave, jwkPath) => {
    if (onTestWeave) {
      console.log("Initialising Arweave instance on TestWeave host");
    }

    const arweave = Arweave.init({
      host: onTestWeave ? "localhost" : "arweave.net", // Hostname or IP address for a Arweave host
      port: onTestWeave ? 1984 : 443,           // Port
      protocol: onTestWeave ? "http" : "https",   // Network protocol http or https
      timeout: 20000,      // Network request timeouts in milliseconds
      logging: false,      // Enable network request logging
    });

    const testWeave = onTestWeave
      ? await TestWeave.init(arweave)
      : null;

    const jwk = onTestWeave
      ? testWeave.rootJWK
      : module.exports.readJSON(jwkPath || module.exports.getProdJwkPath())

    return {jwk, arweave, testWeave};
  },

  createContract: async (sourcePath, initialInputPath, onTestWeave) => {
    const {jwk, arweave, testWeave} = await module.exports.initArweave(onTestWeave);

    // note: don't forget to compile the contract :-)
    const contractSource = fs.readFileSync(sourcePath, "utf-8");
    const initialState = fs.readFileSync(initialInputPath, "utf-8");

    console.info("Creating contract", {sourcePath});

    const contractTxId = await createContract(
      arweave, onTestWeave ? testWeave.rootJWK : jwk, contractSource, initialState);

    if (onTestWeave) {
      console.log("Mining...");
      await testWeave.mine();
    } else {
      console.log("Waiting for block mining...");
      await module.exports.waitForConfirmation(contractTxId, arweave);
    }

    return contractTxId;
  },

  getProdJwkPath: () => {
    return "./.secrets/redstone-jwk.json"
  },

  waitForConfirmation: async (transactionId, arweave) => {
    const statusAfterMine = await arweave.transactions.getStatus(transactionId);

    if (statusAfterMine.confirmed === null) {
      console.log(`Transaction ${transactionId} not yet confirmed. Waiting another 30 seconds before next check.`);
      setTimeout(() => {
        module.exports.waitForConfirmation(transactionId, arweave);
      }, 30000);
    } else {
      console.log(`Transaction ${transactionId} confirmed`, statusAfterMine);
      return statusAfterMine;
    }
  },

  parseBoolean: (val) => {
    return val === true || val === "true";
  },

  readJSON: (path) => {
    const content = fs.readFileSync(path, "utf-8");
    try {
      return JSON.parse(content);
    } catch (e) {
      throw new Error(`File "${path}" does not contain a valid JSON`);
    }
  }

}
