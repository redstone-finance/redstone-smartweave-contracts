const {connectArweave} = require("./connect-arweave");
const {connectContract} = require("./connect-contract");
const {loadWallet} = require("./load-wallet");

const testnet = false;

async function addNetworks() {
    const arweave = connectArweave(testnet);
    const wallet = await loadWallet(arweave, testnet);
    const contract = await connectContract(arweave, wallet, testnet);

    /*await addNetwork(contract, {
        id: "ppe_localhost",
        name: "Localhost Flat PSTs network",
        desc: "Network that handles basic PSTs - without reads to other contracts",
        url: "http://localhost:5666"
    });*/

    await addNetwork(contract,
        {
            id: "ppe_testnet_1",
            name: "ppe's testnet",
            desc: "Some random contracts...",
            url: "https://redstone.finance"
        });

}

async function addNetwork(contract, addNetwork) {
    const input = {
        function: 'addNetwork',
        addNetwork
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

addNetworks().finally();



