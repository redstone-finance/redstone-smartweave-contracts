const {interactRead} = require("smartweave");
const Arweave = require("./_helpers");

async function main() {
  const {jwk, arweave, contractId} = Arweave.init();

  const providerData = {
    function: "provider-data",
    data: {
      providerId: "33F0QHcb22W7LwWR1iRC8Az1ntZG09XQ03YWuw2ABqA"
    }
  }

  const currentManifest = {
    function: "active-manifest",
    data: {
      providerId: "33F0QHcb22W7LwWR1iRC8Az1ntZG09XQ03YWuw2ABqA"
    }
  }

  try {
    const result = await interactRead(
      arweave,
      jwk,
      contractId,
      currentManifest
    );
    console.log(" === RESULT ===\n", JSON.stringify(result));
  }
  catch (e) {
    console.error(e);
  }

  //VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ
  //https://viewblock.io/arweave/address/VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ
}

main();