const {connectArweave} = require("./connect-arweave");
const {connectContract} = require("./connect-contract");
const {loadWallet, walletAddress} = require("./load-wallet");
const {LoggerFactory} = require("redstone-smartweave");

LoggerFactory.INST.logLevel('debug', 'WASM:AS')

const testnet = false;

async function disconnectAllNodes() {
    const arweave = connectArweave(testnet);
    const wallet = await loadWallet(arweave, testnet);
    const contract = await connectContract(arweave, wallet, testnet);

    const input = {
        function: 'disconnectAllNodes',
        disconnectAllNodes: {
            networkId: "all_pst"
        }
    };

    const result = await contract.dryWrite(input);

    if (result.type == 'ok') {
        if (testnet) {
            await contract.writeInteraction(input);
        } else {
            await contract.bundleInteraction(input);
        }
    } else {
        console.error(result);
    }

}


disconnectAllNodes().finally();



