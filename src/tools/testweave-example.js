const Arweave = require("arweave/node");
const fs = require("fs");
const {createContract, interactWrite, readContract} = require("smartweave");
const TestWeave = require("testweave-sdk").default;

module.exports = {

  deploy: async () => {
    // init arweave as usual
    const arweave = Arweave.init({
      host: 'localhost',
      port: 1984,
      protocol: 'http',
      timeout: 20000,
      logging: false,
    });

    const testWeave = await TestWeave.init(arweave);

    const contractSource = fs.readFileSync("./dist/examples/example-contract-1.js").toString();

    // create the contract and mine the transaction for creating it
    const c = await createContract(arweave, testWeave.rootJWK, contractSource, JSON.stringify({}));
    await testWeave.mine();

    console.info("contract tx id: ", c);

    const iwt = await interactWrite(arweave, testWeave.rootJWK, c, {
      function: 'add'
    });
    await testWeave.mine();

    console.log("write tx id: ", iwt);

    // note: this does not work as expected - contract's state does not change after write operation from line 28.
    const afterTransaction = await readContract(arweave, c, null, true);

    return afterTransaction;

  },

  read: async (contractId) => {
    const arweave = Arweave.init({
      host: 'localhost',
      port: 1984,
      protocol: 'http',
      timeout: 20000,
      logging: false,
    });

    await TestWeave.init(arweave);

    return await readContract(arweave, contractId, null, true);
  },

  write: async (contractId) => {
    const arweave = Arweave.init({
      host: 'localhost',
      port: 1984,
      protocol: 'http',
      timeout: 20000,
      logging: false,
    });

    const testWeave = await TestWeave.init(arweave);

    const iwt = await interactWrite(arweave, testWeave.rootJWK, contractId, {
      function: 'add'
    });

    await testWeave.mine();

    return iwt;

  }
}

require('make-runnable')
