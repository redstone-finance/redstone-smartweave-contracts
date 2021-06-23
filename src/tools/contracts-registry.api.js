const {interactWrite, interactRead} = require("smartweave");
const helpers = require("./_helpers")
const fs = require("fs");

const knownContracts = ["providers-registry", "token"];

module.exports = {

  deploy: async (onTestWeave = true) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);
    const contractTxId =  await helpers.createContract(
      "./dist/contracts-registry/contracts-registry.contract.js",
      `./dist/contracts-registry/initial-state${onTestWeave ? '-test' : ''}.json`,
      onTestWeave
    );

    module.exports.updateRegistryContractTxId(onTestWeave, contractTxId);

    return contractTxId;
  },

  register: async (onTestWeave = true, contractName, contractTxId, comment) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);
    const {jwk, arweave, testWeave} = await helpers.initArweave(onTestWeave);
    console.info("Registering", {contractName, contractTxId, comment});

    if (!knownContracts.includes(contractName)) {
      throw new Error(`Unknown contract "${contractName}".`);
    }

    const address = module.exports.getRegistryContractTxId(onTestWeave);
    const writeTxId = await interactWrite(
      arweave,
      jwk,
      address,
      {
        function: "registerContracts",
        data: {
          contracts: {
            [contractName]: contractTxId
          },
          comment: comment
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

    console.log(`Contract ${contractName}:${contractTxId} has been registered on contract ${address}`);

    return writeTxId;
  },

  getRegistryContractTxId: (test) => {
    test = helpers.parseBoolean(test);
    const path = contractsRegistryFilePath(test);

    return fs.readFileSync(path).toString("utf-8").trim();
  },

  updateRegistryContractTxId: (test, contractTxId) => {
    if (!test) {
      console.warn(`Updating production contracts registry tx id to ${contractTxId}`);
    }
    const filePath = contractsRegistryFilePath(test);
    fs.writeFileSync(
      filePath,
      contractTxId);

    console.info(`${contractTxId} saved in ${filePath}`);
  },

  currentContractTxId: async (contractName, onTestWeave = true, externalJwk = null) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);
    const {jwk, arweave, testWeave} = await helpers.initArweave(onTestWeave, externalJwk);

    const result = await interactRead(
      arweave,
      jwk,
      module.exports.getRegistryContractTxId(onTestWeave),
      {
        function: "contractsCurrentTxId",
        data: {
          contractNames: [contractName]
        }
      }
    );

    if (result === undefined || result[contractName] === undefined) {
      throw new Error(`Contract not registered ${contractName}`);
    }

    return result[contractName]
  }
}

function contractsRegistryFilePath(test) {
  return `${__dirname}/../../contracts-registry.address${test ? '.test.txt' : '.txt'}`;
}

require('make-runnable');
