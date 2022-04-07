const fs = require("fs");
const path = require("path");
module.exports.contractTxIdProd = fs.readFileSync(path.join(__dirname, 'contract-tx-id-prod.txt'), "utf-8").trim();