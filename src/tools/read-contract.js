const {readContract} = require("smartweave");
const Arweave = require("./_helpers");

async function main() {
  const {arweave, contractId} = Arweave.init();

  try {
    const result = await readContract(
      arweave,
      contractId
    );
    console.log(" === RESULT ===\n",  JSON.stringify(result));
  }
  catch (e) {
    console.error(e);
  }

  //VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ
  //https://viewblock.io/arweave/address/VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ
}

main();
