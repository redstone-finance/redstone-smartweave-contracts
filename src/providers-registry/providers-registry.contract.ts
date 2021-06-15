import {
  AddContractAdmins,
  AddProviderAdminData,
  AddProviderManifestData,
  adminSetFunctions,
  GetProviderData,
  GetProviderManifest,
  ManifestData, ManifestStatus, ProviderData,
  ProviderProfile,
  ProvidersRegistryAction,
  ProvidersRegistryResult,
  ProvidersRegistryState,
  RegisterProviderData,
  RemoveProviderData,
  UpdateProviderProfileData,
} from "./types";
import {ContractAdmin} from "../common/ContractAdmin";
import {Validators} from "../common/Validators";
import {Tools} from "../common/Tools";

declare type ContractResult = { state: ProvidersRegistryState } | { result: ProvidersRegistryResult }
declare const ContractError;
declare const SmartWeave;

/**
 * This contract is responsible for keeping track of all providers (and their configuration) that
 * are deployed using Redstone Node server (https://github.com/redstone-finance/redstone-node)
 */
export async function handle(state: ProvidersRegistryState, action: ProvidersRegistryAction): Promise<ContractResult> {

  trace(`[ Providers Registry Contract Handle :: ${action.input.function} ]`);

  // as seen here..:https://github.com/CommunityXYZ/website/blob/0b8506a0ca1e32964fc3523d578c3e24c5236754/src/assets/scripts/utils/utils.ts#L51
  const BLOCKS_IN_HOUR = 30;

  const CURRENT_BLOCK_HEIGHT = SmartWeave.block.height;
  const caller = action.caller;
  Validators.checkWalletAddress(caller);

  const input = action.input;

  const contractAdmin = ContractAdmin.checkAndCreate(
    caller, input.function, state.contractAdmins, adminSetFunctions.slice(), state.readonly);

  if (state.providers === undefined) {
    state.providers = {};
  }
  const allProviders = state.providers;

  // note: just a test to verify how SDK behaves with real contracts
  trace("TIMESTAMP: ", SmartWeave.block.timestamp);
  trace("BLOCK HEIGHT: ", CURRENT_BLOCK_HEIGHT);
  trace("STATE", state);
  trace("ACTION", action);

  /* STATE MODIFYING ACTIONS */

  switch (input.function) {
    case "registerProvider":
      const registerProviderData = input.data as RegisterProviderData;
      const newProvider = registerProviderData.provider;

      if (allProviders[caller] !== undefined) {
        throw new ContractError(`Provider for ${caller} is already registered.`);
      }

      checkProviderProfile(newProvider.profile);

      // TODO: not sure about this...
      if (newProvider.lockedTokens !== undefined && newProvider.lockedTokens !== 0) {
        throw new ContractError("Initial stake must be zero.");
      }

      Tools.initIfUndefined(newProvider, "manifests", []);

      // initializing adminsPools array if not defined
      if (Validators.isEmpty(newProvider.adminsPool)) {
        registerProviderData.provider.adminsPool = [];
      }

      // adding caller as default admin if not found in adminsPool
      if (!newProvider.adminsPool.includes(caller)) {
        newProvider.adminsPool.push(caller);
      }

      newProvider.registerHeight = CURRENT_BLOCK_HEIGHT;
      newProvider.profile.id = `provider_${SmartWeave.transaction.id}`;

      allProviders[caller] = newProvider;

      trace("END STATE", state);

      return {state};

    case "removeProvider":
      const removeProviderData = input.data as RemoveProviderData;
      checkProviderId(removeProviderData.providerId);
      checkProviderExists(removeProviderData.providerId);
      checkPrivileges(caller, removeProviderData.providerId);

      delete allProviders[removeProviderData.providerId];

      trace("END STATE", state);

      return {state};

    case "addProviderManifest":
      const addManifestData = input.data as AddProviderManifestData;
      const manifestProviderId = addManifestData.providerId;
      checkProviderId(manifestProviderId);
      checkProviderExists(manifestProviderId);
      checkPrivileges(caller, manifestProviderId);

      const manifestData = addManifestData.manifestData;

      if (manifestData === undefined) {
        throw new ContractError("Manifest data not set.");
      }

      if (Validators.isEmpty(manifestData.manifestTxId)) {
        throw new ContractError("ManifestTxId not set.");
      }

      if (!Validators.isTypeOf(manifestData.manifestTxId, "string")) {
        throw new ContractError("Manifest must be sent as a transaction id string.")
      }

      // TODO: verify manifestTxId using unsafeClient?
      if (Validators.isEmpty(manifestData.changeMessage)) {
        throw new ContractError("Change message is not set.");
      }

      // note: this is safe, as manifests array is initialized when provider is added
      allProviders[manifestProviderId].manifests.push(
        {
          uploadBlockHeight: CURRENT_BLOCK_HEIGHT,
          manifestTxId: manifestData.manifestTxId,
          changeMessage: manifestData.changeMessage,
          lockedHours: addManifestData.lockedHours || 0
        }
      );

      trace("END STATE", state);

      return {state};

    case "addProviderAdmin":
      const addProviderAdminData = input.data as AddProviderAdminData;
      checkProviderId(addProviderAdminData.providerId);
      checkProviderExists(addProviderAdminData.providerId);
      checkPrivileges(caller, addProviderAdminData.providerId);

      // note: this is safe, as adminsPool array is initialized when provider is added
      allProviders[addProviderAdminData.providerId].adminsPool.push(...addProviderAdminData.admins);

      trace("END STATE", state);

      return {state};

    case "updateProviderProfile":
      const updateProviderProfileData = input.data as UpdateProviderProfileData;
      checkProviderId(updateProviderProfileData.providerId);
      checkProviderExists(updateProviderProfileData.providerId);
      checkPrivileges(caller, updateProviderProfileData.providerId);
      checkProviderProfile(updateProviderProfileData.profile);

      allProviders[updateProviderProfileData.providerId].profile = updateProviderProfileData.profile;

      return {state};

    case "switchTrace":
      state.trace = !state.trace;
      trace("END STATE", state);

      return {state};

    case "addContractAdmins":
      const addContractAdmins = input.data as AddContractAdmins;
      contractAdmin.addContractAdmins(addContractAdmins.admins);

      return {state};

    case "switchReadonly":
      state.readonly = !state.readonly;
      trace("END STATE", state);

      return {state};

    case "providerData":
      const getProviderData = input.data as GetProviderData;
      checkProviderId(getProviderData.providerId);
      checkProviderExists(getProviderData.providerId);

      const providerCopy = Tools.deepCopy(allProviders[getProviderData.providerId]);
      providerCopy.manifests = updateManifestsStatus(providerCopy.manifests);

      if (getProviderData.eagerManifestLoad) {
        const activeManifest: ManifestData = providerCopy.manifests.find((manifest) => {
          return manifest.status === "active";
        });
        await setManifestContent(activeManifest);
      }
      return {
        result: {provider: providerCopy}
      };

    case "providersData":
      const providersCopy: { [providerAddress: string]: ProviderData } = Tools.deepCopy(allProviders);
      Object.values(providersCopy).forEach((provider: ProviderData) => {
        provider.manifests = updateManifestsStatus(provider.manifests);
      });

      return {
        result: {providers: providersCopy}
      };

    case "activeManifest":
      const data = input.data as GetProviderManifest;
      checkProviderId(data.providerId);
      checkProviderExists(data.providerId);

      const manifests = getManifestsFor(data.providerId);
      const manifestsWithStatus = updateManifestsStatus(manifests);
      const activeManifest = manifestsWithStatus.find((manifest) => {
        return manifest.status === "active";
      });
      if (data.eagerManifestLoad) {
        await setManifestContent(activeManifest);
      }
      trace("RESULT", activeManifest);

      return {result: {manifest: activeManifest}};

    default:
      throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);
  }

  /* HELPER FUNCTIONS */
  async function setManifestContent(manifest: ManifestData): Promise<ManifestData> {
    trace("Searching for data of", manifest.manifestTxId);

    try {
      const manifestContent = await SmartWeave.unsafeClient.transactions.getData(
        manifest.manifestTxId,
        {decode: true, string: true});
      manifest.activeManifestContent = JSON.parse(manifestContent);
    } catch (e) {
      trace("Error while fetching manifest", e);
    }

    return manifest;
  }

  function updateManifestsStatus(manifests: ManifestData[]): ManifestData[] {
    let activeSet = false;
    const manifestsLength = manifests.length;
    const manifestsWithStatus = manifests.slice()
      .reverse() // reverse to easily find most-recent, non-locked manifest.
      .map((manifest, index) => {
        let status: ManifestStatus;
        if (isManifestLocked(manifest)) {
          status = "locked";
        } else {
          if (activeSet) {
            status = "historical";
          } else {
            status = "active";
            activeSet = true;
          }
        }
        // if we're checking last manifest and no manifest has "active" status set so far
        // - we're setting "active" status to the last manifest on the reversed list (ie. first added).
        if (index == manifestsLength - 1 && !activeSet) {
          status = "active";
          activeSet = true;
        }

        return {
          ...manifest,
          status
        }
      });

    // sanity-check..
    checkExactOneManifestIsActive(manifestsWithStatus);

    // un-reverse to restore original order (ie. order in which manifests where added).
    return manifestsWithStatus.reverse();
  }

  function checkExactOneManifestIsActive(manifestsWithStatus: ManifestData[]) {
    const activeManifests = manifestsWithStatus.filter((manifest) => {
      return manifest.status === "active";
    });

    if (activeManifests.length !== 1) {
      trace("Manifests with status: ", manifestsWithStatus);
      throw new ContractError("Exact one manifest should have 'active' status set.");
    }
  }

  function isManifestLocked(manifest: ManifestData) {
    trace("Checking manifest: ", manifest);
    trace("Checking lockedBlocks: ", manifest.lockedHours * BLOCKS_IN_HOUR);
    return manifest.uploadBlockHeight + (manifest.lockedHours * BLOCKS_IN_HOUR) > CURRENT_BLOCK_HEIGHT;
  }

  function trace(log: string, data: any = {}) {
    if (state.trace) {
      console.log(`\n=== ${log} ===\n`, JSON.stringify(data));
    }
  }

  function getManifestsFor(providerId: string): ManifestData[] {
    const manifests = allProviders[providerId].manifests;
    if (manifests === undefined || manifests.length === 0) {
      throw new ContractError(`No manifests defined for ${caller}`);
    }
    return manifests;
  }

  function checkPrivileges(caller: string, providerId: string) {
    if (!allProviders[providerId].adminsPool.includes(caller)) {
      throw new ContractError(`${caller} is not an admin for ${providerId}`)
    }
  }

  function checkProviderExists(providerId: string) {
    if (allProviders[providerId] === undefined) {
      throw new ContractError(`Provider with id ${providerId} is not registered.`);
    }
  }

  function checkProviderId(providerId: string) {
    if (Validators.isEmpty(providerId)) {
      throw new ContractError("'providerId' field is required.");
    }
  }

  function checkProviderProfile(profile: ProviderProfile) {
    if (profile === undefined) {
      throw new ContractError("Provider profile not defined.");
    }

    if (Validators.isEmpty(profile.name)) {
      throw new ContractError("Provider profile name not defined.");
    }

    const providersNames = Object.values(allProviders).map((provider: ProviderData) => {
      return provider.profile.name;
    });

    if (providersNames.includes(profile.name)) {
      throw new ContractError(`Provider with ${profile.name} is already registered.`);
    }

    if (Validators.isEmpty(profile.description)) {
      throw new ContractError("Provider profile description not defined.");
    }

    if (Validators.isEmpty(profile.url)) {
      throw new ContractError("Provider profile url not defined.");
    }
  }

}
