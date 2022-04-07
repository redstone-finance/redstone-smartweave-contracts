const {SmartWeaveNodeFactory} = require("redstone-smartweave");
const {contractTxId} = require("./contract-tx-id");
const {contractTxIdProd} = require("./contract-tx-id-prod");


module.exports.connectContract = async function (arweave, wallet, testnet) {
    const contractId = testnet ? contractTxId : contractTxIdProd;

    if (testnet) {
        return SmartWeaveNodeFactory.memCached(arweave)
            .contract(contractId)
            .connect(wallet);
    } else {
        return SmartWeaveNodeFactory.memCachedBased(arweave)
            .useRedStoneGateway()
            .build()
            .contract(contractId)
            .connect(wallet);
    }
}