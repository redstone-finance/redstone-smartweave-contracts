const {createContract} = require("smartweave");
const Arweave = require("./_helpers");
const fs = require("fs");

async function main() {

  const {jwk, arweave} = Arweave.init();

  // note: don't forget to compile the contract :-)
  const contractSource = fs.readFileSync("./dist/providers-registry/providers-registry.contract.js", "utf-8");
  console.log(contractSource);
  const admin = await arweave.wallets.jwkToAddress(jwk);
  console.log(admin);

  const contractTxId = await createContract(
    arweave, jwk, contractSource, JSON.stringify({
      trace: true,
      readonly: false,
      contractAdmins: [admin]
    }));
  console.log(`New contract id: ${contractTxId}`);
  // 4o-2xMPa45BXjGuII_LbOMQWfhE1F0qugdEUZvRlXRY
}

main();
