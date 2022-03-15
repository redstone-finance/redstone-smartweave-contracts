const {connectArweave} = require("./connect-arweave");
const {connectContract} = require("./connect-contract");
const {loadWallet} = require("./load-wallet");

async function addNetworks() {
    const arweave = connectArweave();
    const wallet = await loadWallet(arweave);
    const contract = await connectContract(arweave, wallet);

    await addNetwork(contract, {
        id: "ppe_localhost",
        name: "Localhost Flat PSTs network",
        desc: "Network that handles basic PSTs - without reads to other contracts",
        url: "http://localhost:5666"
    });

    await addNetwork(contract,
        {
            id: "redstone_testnet_1",
            name: "Flat PSTs network",
            desc: "Network that handles basic PSTs - without reads to other contracts",
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
        await contract.writeInteraction(input);
    } else {
        console.error(result);
    }
}

addNetworks().finally();



