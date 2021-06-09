const {interactRead} = require("smartweave");
const Arweave = require("./_helpers");

async function main() {
  const {jwk, arweave, contractId} = Arweave.init();
  const caller = arweave.wallets.jwkToAddress(jwk);


  const providerData = {
    function: "provider-data",
    data: {
      providerId: caller
    }
  }

  const currentManifest = {
    function: "activeManifest",
    data: {
      providerId: caller
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
