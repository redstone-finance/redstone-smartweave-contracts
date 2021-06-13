const {interactWrite} = require("smartweave");
const helpers = require("./_helpers");
const registry = require("./contracts-registry.api");
const manifests = require("./manifests.api");

// redstone: I-5rWUehEv-MjdK9gFw09RxfSLQX9DIHxG614Wf8qo0
// redstone rapid: zYqPZuALSPa_f5Agvf8g2JHv94cqMn9aBtnH7GFHbuA
// redstone stocks: Yba8IVc_01bFxutKNJAZ7CmTD5AVi2GcWXf1NajPAsc

const redStoneMainProvider = {
  "provider": {
    "adminsPool": [
      "I-5rWUehEv-MjdK9gFw09RxfSLQX9DIHxG614Wf8qo0",
      "zYqPZuALSPa_f5Agvf8g2JHv94cqMn9aBtnH7GFHbuA",
      "Yba8IVc_01bFxutKNJAZ7CmTD5AVi2GcWXf1NajPAsc"
    ],
    "profile": {
      "name": "RedStone",
      "description": "Main RedStone Provider with all available tokens.",
      "url": "https://redstone.finance/",
      "imgUrl": "https://redstone.finance/assets/img/redstone-logo-full.svg"
    }
  },
  "jwkAddress": "I-5rWUehEv-MjdK9gFw09RxfSLQX9DIHxG614Wf8qo0",
  "jwkFile": "./.secrets/redstone-jwk.json"
};

const redStoneStocksProvider = {
  "provider": {
    "adminsPool": [
      "I-5rWUehEv-MjdK9gFw09RxfSLQX9DIHxG614Wf8qo0",
      "zYqPZuALSPa_f5Agvf8g2JHv94cqMn9aBtnH7GFHbuA",
      "Yba8IVc_01bFxutKNJAZ7CmTD5AVi2GcWXf1NajPAsc"
    ],
    "profile": {
      "name": "RedStone Stocks",
      "description": "Stocks, ETFs, Livestocks, Metals, Energies...",
      "url": "https://redstone.finance/",
      "imgUrl": "https://redstone.finance/assets/img/redstone-logo-full.svg"
    }
  },
  "jwkAddress": "zYqPZuALSPa_f5Agvf8g2JHv94cqMn9aBtnH7GFHbuA",
  "jwkFile": "./.secrets/redstone-stocks-jwk.json"
};

const redStoneRapidProvider = {
  "provider": {
    "adminsPool": [
      "I-5rWUehEv-MjdK9gFw09RxfSLQX9DIHxG614Wf8qo0",
      "zYqPZuALSPa_f5Agvf8g2JHv94cqMn9aBtnH7GFHbuA",
      "Yba8IVc_01bFxutKNJAZ7CmTD5AVi2GcWXf1NajPAsc"
    ],
    "profile": {
      "name": "RedStone Rapid",
      "description": "Most popular tokens with frequent updates",
      "url": "https://redstone.finance/",
      "imgUrl": "https://redstone.finance/assets/img/redstone-logo-full.svg"
    }
  },
  "jwkAddress": "Yba8IVc_01bFxutKNJAZ7CmTD5AVi2GcWXf1NajPAsc",
  "jwkFile": "./.secrets/redstone-rapid-jwk.json"

};

const providerToConfig = {
  "redstone": redStoneMainProvider,
  "redstone-stocks": redStoneStocksProvider,
  "redstone-rapid": redStoneRapidProvider
};

module.exports = {
  deploy: async (onTestWeave = true) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);

    const transactionId = await helpers.createContract(
      "./dist/providers-registry/providers-registry.contract.js",
      `./dist/providers-registry/initial-state${onTestWeave ? '-test' : ''}.json`,
      onTestWeave
    );

    return await registry.register(onTestWeave, "providers-registry", transactionId, "initial deploy");
  },

  register: async (providerName, manifestTxId = null, onTestWeave = true) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);

    const providerConfig = JSON.parse(JSON.stringify(providerToConfig[providerName]));
    if (providerConfig === undefined) {
      throw new Error(`Unknown provider ${providerName}`);
    }

    if (manifestTxId !== null) {
      console.log("adding with manifest ", manifestTxId)
      providerConfig.provider.manifests = [
        {
          changeMessage: "initial manifest",
          lockedHours: 0,
          manifestTxId: manifestTxId
        }
      ];
    }

    const {jwk, arweave, testWeave} = await helpers.initArweave(onTestWeave, onTestWeave ? null : providerConfig.jwkFile);

    const providersRegistryContractId = await registry.currentContractTxId("providers-registry", onTestWeave);

    console.info("Registering provider on ", providerConfig.provider, providersRegistryContractId);

    const writeTxId = await interactWrite(
      arweave,
      jwk,
      providersRegistryContractId,
      {
        function: "registerProvider",
        data: {
          provider: providerConfig.provider
        }
      }
    );

    if (onTestWeave) {
      console.log("Mining...");
      await testWeave.mine();
    } else {
      console.log("Waiting for block mining...");
      await helpers.waitForConfirmation(writeTxId, arweave);
    }

    return writeTxId;
  },

  addManifest: async (manifestPath, comment, lockedHours = 0, onTestWeave = true) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);

    const {jwk, arweave, testWeave} = await helpers.initArweave(onTestWeave);

    const jwkAddress = await arweave.wallets.jwkToAddress(jwk);

    const providersRegistryContractId = await registry.currentContractTxId("providers-registry", onTestWeave);

    const manifestTxId = await manifests.deploy(manifestPath, onTestWeave);

    console.info("Adding manifest", {manifestTxId, jwkAddress});

    const writeTxId = await interactWrite(
      arweave,
      jwk,
      providersRegistryContractId,
      {
        function: "addProviderManifest",
        data: {
          providerId: jwkAddress,
          manifestData: {
            changeMessage: comment,
            lockedHours: lockedHours,
            manifestTxId: manifestTxId
          }
        }
      }
    );

    if (onTestWeave) {
      console.log("Mining...");
      await testWeave.mine();
    } else {
      console.log("Waiting for block mining...");
      await helpers.waitForConfirmation(writeTxId, arweave);
    }

    return writeTxId;

  }

}

require('make-runnable');
