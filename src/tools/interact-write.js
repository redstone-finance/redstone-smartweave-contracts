const {interactWrite} = require("smartweave");
const Arweave = require("./_helpers");

async function main() {
  const {jwk, arweave, contractId} = Arweave.init();

  const inputProvider = {
    function: "registerProvider",
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

  const inputTrace = {
    function: "switchTrace",
    data: {
    }
  }

  function addManifest(lockedHours) {
    return {
      function: "add-provider-manifest",
      data: {
        providerId: "6rM3NxALJNckIQx9Mq60EP_zv6cWi2K2pD2rGNm26uc",
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

  /*for (let i = 0; i < 120; i++) {
    const result = await interactWrite(
      arweave,
      jwk,
      contractId,
      addManifest(i)
    );
    console.log(" === RESULT ===\n", JSON.stringify(result));

  }
*/
  const result = await interactWrite(
    arweave,
    jwk,
    contractId,
    inputTrace
  );

  console.log(" === RESULT ===\n", JSON.stringify(result));
  // 6Q854sKNIDyNoPW3gfdyE2DrFg1IZ7AWw3g-0dCyiaI
}

main();
