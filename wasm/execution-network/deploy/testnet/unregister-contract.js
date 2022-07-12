const {connectArweave} = require("./connect-arweave");
const {connectContract} = require("./connect-contract");
const {loadWallet, walletAddress} = require("./load-wallet");

const testnet = false;

async function unregisterContract() {
    const arweave = connectArweave(testnet);
    const wallet = await loadWallet(arweave, testnet);
    const contract = await connectContract(arweave, wallet, testnet);

    await unregisterFromNetwork('redstone_network', contract);
}

async function unregisterFromNetwork(networkId, contract) {
    const contracts = testnet
        ? [
            "NfOsoVlsQ4_hh_tLwvI4IkNQr0Ey5p3_uHTqKD1O3Ts",
            "fnbd1aINsmadftOiY6YU9K5i7hz7n76afypx0Shk1uo",
            "LtEAEAyVdQfTamLdCz6zeX9ji0hMZ6iaXttrTexra9A",
            "X0Bd7SZY2ezke7RXuTzUm3oV90x53FPwKJZMUgsihx0"
        ]
        : [
            "DJWTeeWivJnGzaXMtk3UliIW1aKruy_f0wxtNi-znV4"
        ]


    const input = {
        function: 'unregisterContracts',
        unregisterContracts: {
            networkId,
            contracts
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

unregisterContract().finally();
