const {connectArweave} = require("./connect-arweave");
const {connectContract} = require("./connect-contract");
const {loadWallet} = require("./load-wallet");

async function transfers() {
    const arweave = connectArweave();
    const wallet = await loadWallet(arweave);
    const contract = await connectContract(arweave, wallet);

    await transfer(contract, {
        target: "kM2EU6gm6LamFUe0N6Vemu46ynTkDETFtjhwDJAKKEc",
        qty: 987
    });
}

async function transfer(contract, transfer) {
    const input = {
        function: 'transfer',
        transfer
    };

    const result = await contract.dryWrite(input);

    if (result.type == 'ok') {
        await contract.writeInteraction(input);
    } else {
        console.error(result);
    }
}

transfers().finally();



