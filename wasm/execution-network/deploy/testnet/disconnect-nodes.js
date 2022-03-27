const {connectArweave} = require("./connect-arweave");
const {connectContract} = require("./connect-contract");
const {loadWallet, walletAddress} = require("./load-wallet");
const {LoggerFactory} = require("redstone-smartweave");

LoggerFactory.INST.logLevel('debug', 'WASM:AS')

async function disconnectNodes() {
    const arweave = connectArweave();
    const wallet = await loadWallet(arweave);
    const walletAddr = await walletAddress(arweave, wallet);
    const contract = await connectContract(arweave, wallet);

    await disconnectNode(contract, {
        id: "MacBook-Air-Piotr.local_5777_hV8F2CfILQqeEH67AFVQnnU3tYTrXv72aJa3KYJ1nws",
        networkId: "ppe_localhost"
    });

    /*await disconnectNode(contract, {
        id: "localnode_2",
        networkId: "ppe_localhost"
    });

    await disconnectNode(contract, {
        id: "localnode_3",
        networkId: "ppe_localhost"
    });*/
}

async function disconnectNode(contract, disconnectNode) {
    const input = {
        function: 'disconnectNode',
        disconnectNode
    };

    const result = await contract.dryWrite(input);

    if (result.type == 'ok') {
        await contract.writeInteraction(input);
    } else {
        console.error(result);
    }
}

disconnectNodes().finally();


