const {createContract} = require("smartweave");
const Arweave = require("./_helpers");
const fs = require("fs");

async function main() {

  const {jwk, arweave} = Arweave.init();

  // note: don't forget to compile the contract :-)
  const contractSource = fs.readFileSync("./dist/providers-registry-contract.js", "utf-8");
  console.log(contractSource);

  const contractTxId = await createContract(
    arweave, jwk, contractSource, JSON.stringify({
      trace: true,
      contractAdmin: "33F0QHcb22W7LwWR1iRC8Az1ntZG09XQ03YWuw2ABqA"
    }));
  console.log(`New contract id: ${contractTxId}`);
  // 4o-2xMPa45BXjGuII_LbOMQWfhE1F0qugdEUZvRlXRY
}

main();