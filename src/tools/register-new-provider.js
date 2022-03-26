const prompts = require("prompts");
const { interactWrite } = require("smartweave");
const helpers = require("./_helpers");
const registry = require("./contracts-registry.api");

const DEFAULTS = {
  manifestTxId: "y7ppr6m9MuP65Fiivd9CX84qcPLoYBMifUrFK3jXw2k",
  url: "https://redstone.finance/",
  logo: "https://redstone.finance/assets/img/redstone-logo-full.svg",
};

main();

async function main() {
  const providerDetails = await promptProviderDetails();
  const providerConfig = await prepareProviderConfig(providerDetails);
  return await registerProviderInContract(providerConfig);
}

async function registerProviderInContract(providerConfig) {
  const { arweave, jwk } = await helpers.initArweave(false, providerConfig.jwk);

  const providersRegistryContractId = await registry.currentContractTxId(
    "providers-registry",
    false);

  console.info(`Registering provider on contract: ${providersRegistryContractId}`);
  console.info(providerConfig.provider);

  const writeTxId = await interactWrite(
    arweave,
    jwk,
    providersRegistryContractId,
    {
      function: "registerProvider",
      data: {
        provider: providerConfig.provider
      },
    },
  );

  console.log("Waiting for block mining...");
  await helpers.waitForConfirmation(writeTxId, arweave);

  return writeTxId;
}

async function prepareProviderConfig(providerDetails) {
  const jwk = JSON.parse(providerDetails.jwkStringified);
  const { arweave } = await helpers.initArweave(false);
  const address = await arweave.wallets.jwkToAddress(jwk);

  const providerConfig = {
    provider: {
      adminsPool: [address],
      profile: {
        name: providerDetails.name,
        description: providerDetails.description,
        url: providerDetails.url,
        imgUrl: providerDetails.logo,
      },
    },
    address,
    jwk,
  };

  if (providerDetails.manifestTxId) {
    providerConfig.provider.manifests = [{
      changeMessage: "initial manifest",
      lockedHours: 0,
      manifestTxId: providerConfig.manifestTxId,
    }];
  }

  return providerConfig;
}

async function promptProviderDetails() {
  const jwkStringified = await promptString("Please enter JWK");
  const name = await promptString("Please enter provider name (e.g. RedStone Avalanche prod 1");
  const description = await promptString("Please enter provider description (e.g. Most popular tokens from the Avalanche ecosystem)");
  const url = await promptString("Please enter url", DEFAULTS.url);
  const logo = await promptString("Please enter logo url", DEFAULTS.logo);
  const manifestTxId = await promptString("Please enter initial manifest tx id", DEFAULTS.manifestTxId);

  return {
    jwkStringified,
    name,
    description,
    url,
    logo,
    manifestTxId,
  };
}

async function promptString(msg, defaultValue) {
  const response = await prompts({
    type: "text",
    name: "result",
    message: msg,
    initial: defaultValue,
  });

  return response.result;
}
