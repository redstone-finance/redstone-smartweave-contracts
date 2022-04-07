const fs = require("fs");
const {addFunds} = require("../utils");
const path = require("path");

module.exports.loadWallet = async function (arweave, testnet) {
    if (testnet) {
        const wallet = JSON.parse(fs.readFileSync(path.join(__dirname, 'testnet-wallet.json'), 'utf-8'));
        await addFunds(arweave, wallet);
        return wallet;
    } else {
        return JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../.secrets/redstone-jwk.json'), 'utf-8'))
    }

}

module.exports.walletAddress = async function (arweave, wallet) {
    return arweave.wallets.getAddress(wallet);
}
