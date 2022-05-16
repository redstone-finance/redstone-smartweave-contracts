const {connectArweave} = require("./connect-arweave");
const {connectContract} = require("./connect-contract");
const {loadWallet, walletAddress} = require("./load-wallet");
const {LoggerFactory} = require("redstone-smartweave");

LoggerFactory.INST.logLevel('debug', 'WASM:AS')

const testnet = false;

async function disconnectNodes() {
    const arweave = connectArweave(testnet);
    const wallet = await loadWallet(arweave, testnet);
    const walletAddr = await walletAddress(arweave, wallet);
    const contract = await connectContract(arweave, wallet, testnet);

    await disconnectNode(contract, {
        id: "3fea32083819_8080_JQwYpXCFr_iwgLngZdIe7pm-Q8pxNU24Tb2DK00-2P8",
        networkId: "redstone_network"
    });
/*    await disconnectNode(contract, {
        id: "b8de826e0d62_8080_JQwYpXCFr_iwgLngZdIe7pm-Q8pxNU24Tb2DK00-2P8",
        networkId: "redstone_network"
    });
    await disconnectNode(contract, {
        id: "d6b5c28e0703_8080_JQwYpXCFr_iwgLngZdIe7pm-Q8pxNU24Tb2DK00-2P8",
        networkId: "redstone_network"
    });
    await disconnectNode(contract, {
        id: "e2032798323e_8080_JQwYpXCFr_iwgLngZdIe7pm-Q8pxNU24Tb2DK00-2P8",
        networkId: "redstone_network"
    });*/

}

async function disconnectNode(contract, disconnectNode) {
    const input = {
        function: 'disconnectNode',
        disconnectNode
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

disconnectNodes().finally();



