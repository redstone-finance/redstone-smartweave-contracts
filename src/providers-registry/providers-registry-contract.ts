import {
  AddContractAdmins,
  AddProviderAdminData,
  AddProviderManifestData,
  GetProviderData,
  GetProviderManifest,
  ManifestData,
  ProvidersRegistryAction,
  ProvidersRegistryResult,
  ProvidersRegistryState,
  RegisterProviderData,
  RemoveProviderData,
} from "./types";
import {SmartWeaveGlobal} from "smartweave/lib/smartweave-global";

declare type ContractResult = { state: ProvidersRegistryState } | { result: ProvidersRegistryResult }
declare const ContractError: any;
declare const SmartWeave: SmartWeaveGlobal;

export function handle(state: ProvidersRegistryState, action: ProvidersRegistryAction): ContractResult {

  trace("[Providers Registry Contract Handle]");

  // as seen here..:https://github.com/CommunityXYZ/website/blob/0b8506a0ca1e32964fc3523d578c3e24c5236754/src/assets/scripts/utils/utils.ts#L51
  const BLOCKS_IN_HOUR = 30;
  const blockHeight = SmartWeave.block.height;

  if (state.providers === undefined) {
    state.providers = {};
  }
  const providers = state.providers;
  const input = action.input;
  const caller = verifyWalletAddress(action.caller);

  // note: just a test to verify how SDK behaves with real contracts
  trace("TIMESTAMP: ", SmartWeave.block.timestamp);
  trace("STATE", state);
  trace("ACTION", action);

  /* STATE MODIFYING ACTIONS */
  if (input.function === "register-provider") {
    const data = input.data as RegisterProviderData;
    const newProvider = data.provider;

    // note: could probably use ContractAssert function for initial checks:
    // https://github.com/ArweaveTeam/SmartWeave/blob/788a974e66494ef2ab8f876024e72bf363d4c4a4/src/contract-load.ts#L72
    // - but it doesn't seem to be documented, so I'm not sure if it's safe to use it.
    if (newProvider.profile === undefined) {
      throw new ContractError("Provider profile not defined.");
    }

    if (newProvider.profile.name === undefined) {
      throw new ContractError("Provider profile name not defined.");
    }

    if (newProvider.profile.description === undefined) {
      throw new ContractError("Provider profile description not defined.");
    }

    if (newProvider.profile.url === undefined) {
      throw new ContractError("Provider profile url not defined.");
    }

    // TODO: not sure about this...
    if (newProvider.lockedTokens !== undefined && newProvider.lockedTokens !== 0) {
      throw new ContractError("Initial stake must be zero.");
    }

    if (newProvider.manifests !== undefined) {
      throw new ContractError("Manifest should be added add with separate add-provider-manifest function.");
    }

    // initializing adminsPools array if not defined
    if (newProvider.adminsPool === undefined) {
      data.provider.adminsPool = [];
    }

    // adding caller as default admin if not found in adminsPool
    if (!newProvider.adminsPool.includes(caller)) {
      newProvider.adminsPool.push(caller);
    }

    newProvider.manifests = [];
    newProvider.registerHeight = blockHeight;
    newProvider.profile.id = `provider_${SmartWeave.transaction.id}`;

    providers[caller] = newProvider;

    trace("STATE", state);

    return {state};
  }

  if (input.function === "remove-provider") {
    const data = input.data as RemoveProviderData;
    checkProviderId(data.providerId);
    checkProviderExists(data.providerId);
    checkPrivileges(caller, data.providerId);

    delete providers[data.providerId];

    trace("STATE", state);

    return {state};
  }

  if (input.function === "add-provider-manifest") {
    const addManifestData = input.data as AddProviderManifestData;
    const manifestProviderId = addManifestData.providerId;
    checkProviderId(manifestProviderId);
    checkProviderExists(manifestProviderId);
    checkPrivileges(caller, manifestProviderId);

    const manifestData = addManifestData.manifestData;

    if (manifestData === undefined) {
      throw new ContractError("Manifest data not set.");
    }

    if (manifestData.manifest === undefined) {
      throw new ContractError("Manifest not set.");
    }

    if (manifestData.changeMessage === undefined || manifestData.changeMessage.length === 0) {
      throw new ContractError("Change message is not set.");
    }

    // TODO: manifest properties validation

    // note: this is safe, as manifests array is initialized when provider is added
    providers[manifestProviderId].manifests.push(
      {
        uploadBlockHeight: blockHeight,
        manifest: manifestData.manifest,
        changeMessage: manifestData.changeMessage,
        lockedHours: addManifestData.lockedHours || 0
      }
    );

    trace("STATE", state);

    return {state};
  }

  if (input.function === "add-provider-admin") {
    const data = input.data as AddProviderAdminData;
    checkProviderId(data.providerId);
    checkProviderExists(data.providerId);
    checkPrivileges(caller, data.providerId);

    // note: this is safe, as adminsPool array is initialized when provider is added
    providers[data.providerId].adminsPool.push(...data.admins);

    trace("STATE", state);

    return {state};
  }

  // admin-only: switch trace state
  if (input.function === "switch-trace") {
    checkIsContractAdmin(caller);
    state.trace = !state.trace;

    trace("END STATE", state);

    return {state}
  }

  if (input.function === "add-contract-admins") {
    const data = input.data as AddContractAdmins;
    if (data.admins === undefined || data.admins.length === 0) {
      throw new ContractError("New contract admins not defined");
    }
    checkIsContractAdmin(caller);
    state.contractAdmins.push(...data.admins);

    return {state }
  }


  /* STATE READ_ONLY ACTIONS */
  // admin-only: returns last uploaded providers-registry - ie. last element in the manifests array
  if (input.function === "provider-data") {
    const data = input.data as GetProviderData;
    checkProviderId(data.providerId);
    checkProviderExists(data.providerId);

    return {
      result: {
        provider: providers[data.providerId]
      }
    }
  }

  if (input.function === "active-manifest") {
    const data = input.data as GetProviderManifest;
    checkProviderId(data.providerId);
    checkProviderExists(data.providerId);

    const manifests = getManifestsForCaller(caller);
    trace("Block height: ", blockHeight);
    const manifest = manifests.slice().reverse().find((manifest) => {
      trace("Checking manifest: ", manifest);
      trace("Checking lockedBlocks: ", manifest.lockedHours * BLOCKS_IN_HOUR);
      return manifest.uploadBlockHeight + (manifest.lockedHours * BLOCKS_IN_HOUR) <= blockHeight;
    }) || manifests[0];

    trace("RESULT", manifest);

    return {result: {manifest}}
  }

  function checkIsContractAdmin(idWallet: string) {
    if (!isContractAdmin(idWallet)) {
      throw new ContractError("Only admin is allowed to call this function");
    }
  }

  function isContractAdmin(idWallet: string) {
    const wallet = verifyWalletAddress(idWallet);
    return state.contractAdmins.includes(wallet);
  }

  function verifyWalletAddress(addr: string): string {
    const address = addr.toString().trim();
    if (!/[a-z0-9_-]{43}/i.test(address)) {
      throw new ContractError('Invalid Arweave address.');
    }

    return address;
  }

  function trace(log: string, data: any = {}) {
    if (state.trace) {
      console.log(`\n=== ${log} ===\n`, JSON.stringify(data));
    }
  }

  function getManifestsForCaller(providerId: string): ManifestData[] {
    const manifests = providers[providerId].manifests;
    if (manifests === undefined || manifests.length === 0) {
      throw new ContractError(`No manifests defined for ${caller}`);
    }
    return manifests;
  }

  function checkPrivileges(caller: string, providerId: string) {
    if (!providers[providerId].adminsPool.includes(caller)) {
      throw new ContractError(`${caller} is not an admin for ${providerId}`)
    }
  }

  function checkProviderExists(providerId: string) {
    if (providers[providerId] === undefined) {
      throw new ContractError(`Provider with id ${providerId} is not registered.`);
    }
  }

  function checkProviderId(providerId: string) {
    if (isEmpty(providerId)) {
      throw new ContractError("'providerId' field is required.");
    }
  }

  function isEmpty(value: string) {
    return value === undefined || value.length === 0;
  }

  throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);
}
