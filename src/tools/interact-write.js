const {interactWrite} = require("smartweave");
const Arweave = require("./_helpers");

async function main() {
  const {jwk, arweave, contractId} = Arweave.init();

  const inputProvider = {
    function: "register-provider",
    data: {
      "provider": {
        "adminsPool": [],
        "profile": {
          "name": "test-provider-1",
          "description": "desc-1",
          "url": "https://test-provider-1.ok"
        },
      }
    }
  }

  function addManifest(lockedHours) {
    return {
      function: "add-provider-manifest",
      data: {
        providerId: "33F0QHcb22W7LwWR1iRC8Az1ntZG09XQ03YWuw2ABqA",
        manifestData: {
          changeMessage: "stocks manifest initial add",
          lockedHours: lockedHours,
          manifest: {
            "interval": 15000,
            "priceAggregator": "median",
            "defaultSource": ["yahoo-finance"],
            "sourceTimeout": 50000,
            "maxPriceDeviationPercent": 25,
            "tokens": {
              "TSLA": {},
            }
          }
        }
      }
    }
  }

  for (let i = 0; i < 120; i++) {
    const result = await interactWrite(
      arweave,
      jwk,
      contractId,
      addManifest(i)
    );
    console.log(" === RESULT ===\n", JSON.stringify(result));

  }

  /*const result = await interactWrite(
    arweave,
    jwk,
    contractId,
    inputManifest
  );*/

  console.log(" === RESULT ===\n", JSON.stringify(result));
  // 6Q854sKNIDyNoPW3gfdyE2DrFg1IZ7AWw3g-0dCyiaI
}

main();