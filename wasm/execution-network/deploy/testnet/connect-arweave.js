const Arweave = require("arweave");

module.exports.connectArweave = function (testnet) {
    if (testnet) {
        return Arweave.init({
            host: 'testnet.redstone.tools',
            port: 443,
            protocol: 'https'
        });
    } else {
        return Arweave.init({
            host: "arweave.net", // Hostname or IP address for a Arweave host
            port: 443,           // Port
            protocol: "https",   // Network protocol http or https
            timeout: 20000,      // Network request timeouts in milliseconds
            logging: false,      // Enable network request logging
        });
    }
}