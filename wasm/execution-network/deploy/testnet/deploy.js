const fs = require('fs');
const path = require('path');
const {SmartWeaveNodeFactory} = require('redstone-smartweave');
const {connectArweave} = require("./connect-arweave");
const {loadWallet, walletAddress} = require("./load-wallet");
const {mineBlock} = require("../utils");

async function deploy() {
    const arweave = connectArweave();
    const smartweave = SmartWeaveNodeFactory.memCached(arweave);
    const wallet = await loadWallet(arweave);
    const walletAddr = await walletAddress(arweave, wallet);

    const contractSrc = fs.readFileSync(path.join(__dirname, '../../build/optimized.wasm'))
    const stateFromFile = JSON.parse(fs.readFileSync(path.join(__dirname, '../init-state.json'), "utf-8"));
    console.log("stateFromFile", stateFromFile);
    const initialState = {
        ...stateFromFile,
        ...{
            owner: walletAddr,
            balances: {
                [walletAddr]: 10000000
            }
        }
    }

    const contractTxId = await smartweave.createContract.deploy({
        wallet,
        initState: JSON.stringify(initialState),
        src: contractSrc
    },
        path.join(__dirname, '../../assembly'));
    fs.writeFileSync(path.join(__dirname, 'contract-tx-id.txt'), contractTxId);

    await mineBlock(arweave);

    const contract = smartweave
        .contract(contractTxId)
        .setEvaluationOptions({
            gasLimit: 14000000
        })
        .connect(wallet);

    const {state, validity} = await contract.readState();

    console.log("Init state:", state);
    console.log("Contract tx id", contractTxId);
}

deploy().finally();



