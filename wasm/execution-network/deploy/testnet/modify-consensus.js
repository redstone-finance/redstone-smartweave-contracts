const {connectArweave} = require("./connect-arweave");
const {connectContract} = require("./connect-contract");
const {loadWallet, walletAddress} = require("./load-wallet");
const {LoggerFactory} = require("redstone-smartweave");

LoggerFactory.INST.logLevel('debug', 'WASM:AS')

const testnet = false;

async function modifyConsensus() {
    const arweave = connectArweave(testnet);
    const wallet = await loadWallet(arweave, testnet);
    const contract = await connectContract(arweave, wallet, testnet);

    const input = {
        function: 'modifyConsensus',
        modifyConsensus: {
            networkId: "redstone_network",
            params: {
                quorumSize: "0.6",
                sampleSize: "2",
                decisionThreshold: "1",
            }
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


modifyConsensus().finally();



