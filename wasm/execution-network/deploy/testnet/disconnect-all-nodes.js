const {connectArweave} = require("./connect-arweave");
const {connectContract} = require("./connect-contract");
const {loadWallet, walletAddress} = require("./load-wallet");
const {LoggerFactory} = require("redstone-smartweave");

LoggerFactory.INST.logLevel('debug', 'WASM:AS')

async function disconnectAllNodes() {
    const arweave = connectArweave();
    const wallet = await loadWallet(arweave);
    const contract = await connectContract(arweave, wallet);

    const input = {
        function: 'disconnectAllNodes',
        disconnectAllNodes: {
            networkId: "ppe_localhost"
        }
    };

    const result = await contract.dryWrite(input);

    if (result.type == 'ok') {
        await contract.writeInteraction(input);
    } else {
        console.error(result);
    }

}


disconnectAllNodes().finally();



