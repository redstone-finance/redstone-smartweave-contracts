const {connectArweave} = require("./connect-arweave");
const {connectContract} = require("./connect-contract");
const {loadWallet} = require("./load-wallet");

async function addNetwork() {
    const arweave = connectArweave();
    const wallet = await loadWallet(arweave);
    const contract = await connectContract(arweave, wallet);

    const input = {
        function: 'addNetwork',
        addNetwork: {
            id: "redstone_testnet_1",
            name: "Flat PSTs network",
            desc: "Network that handles basic PSTs - without reads to other contracts",
            url: "https://redstone.finance"
        }
    };

    const result = await contract.dryWrite(input);

    if (result.type == 'ok') {
        await contract.writeInteraction(input);
    } else {
        console.error(result);
    }
}

addNetwork().finally();



