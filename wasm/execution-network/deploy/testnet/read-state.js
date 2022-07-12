const {connectArweave} = require("./connect-arweave");
const {connectContract} = require("./connect-contract");
const {loadWallet} = require("./load-wallet");
const fs = require("fs");

async function readState() {
    const arweave = connectArweave();
    const wallet = await loadWallet(arweave);
    const contract = await connectContract(arweave, wallet);
    const {state, validity} = await contract.readState();

    console.log(state);

    fs.writeFileSync(`./deploy/${contract.txId()}-state.json`, JSON.stringify(state));

}

readState().finally();
