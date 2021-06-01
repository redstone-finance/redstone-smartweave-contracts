const Arweave = require("arweave/node");
const fs = require("fs");

module.exports = {
  init: () => {
    const jwk = readJSON("./.secrets/arweave-keyfile-33F0QHcb22W7LwWR1iRC8Az1ntZG09XQ03YWuw2ABqA.json")
    const arweave = Arweave.init({
      host: "arweave.net", // Hostname or IP address for a Arweave host
      port: 443,           // Port
      protocol: "https",   // Network protocol http or https
      timeout: 60000,      // Network request timeouts in milliseconds
      logging: false,      // Enable network request logging
    });

    const contractId = "4o-2xMPa45BXjGuII_LbOMQWfhE1F0qugdEUZvRlXRY";

    return {jwk, arweave, contractId};
  }

}

function readJSON(path) {
  const content = fs.readFileSync(path, "utf-8");
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`File "${path}" does not contain a valid JSON`);
  }
}