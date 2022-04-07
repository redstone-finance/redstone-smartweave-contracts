const {connectArweave} = require("./connect-arweave");
const {connectContract} = require("./connect-contract");
const {loadWallet, walletAddress} = require("./load-wallet");

const testnet = false;

async function registerContract() {
    const arweave = connectArweave(testnet);
    const wallet = await loadWallet(arweave, testnet);
    const contract = await connectContract(arweave, wallet, testnet);

    //await registerForNetwork('redstone_testnet_1', contract);
    await registerForNetwork('ppe_testnet_1', contract);
    await registerForNetwork('kuba_testnet_1', contract);
    //await registerForNetwork('ppe_localhost', contract);
}

async function registerForNetwork(networkId, contract) {
    const contracts = testnet
        ? [
            "NfOsoVlsQ4_hh_tLwvI4IkNQr0Ey5p3_uHTqKD1O3Ts",
            "fnbd1aINsmadftOiY6YU9K5i7hz7n76afypx0Shk1uo",
            "LtEAEAyVdQfTamLdCz6zeX9ji0hMZ6iaXttrTexra9A",
            "X0Bd7SZY2ezke7RXuTzUm3oV90x53FPwKJZMUgsihx0"
        ]
        : [
            "OrO8n453N6bx921wtsEs-0OCImBLCItNU5oSbFKlFuU", //redstone
            "-8A6RexFkpfWwuyVO98wzSFZh0d6VJuI-buTJvlwOJQ", //ardrive
            "usjm4PCxUd5mtaon7zc97-dt-3qf67yPyqgzLnLqk5A", //verto
            "mzvUgNc8YFk0w5K5H7c8pyT-FC5Y_ba0r7_8766Kx74", //commxyz
            "f6lW-sKxsc340p8eBBL2i_fnmSI_fRSFmkqvzqyUsRs", //arverify
            "KT45jaf8n9UwgkEareWxPgLJk4oMWpI5NODgYVIF1fY", //warp9
            "ewepANKEVffP0cm_XKjwTYhSBqaiQrJbVrCcBiWqw-s", //arwiki
            "6eTVr8IKPNYbMHVcpHFXr-XNaL5hT6zRJXimcP-owmo", //openbits

        ]


    const input = {
        function: 'registerContracts',
        registerContracts: {
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

registerContract().finally();
