import {
  AddContractAdmins,
  AddProviderAdminData,
  AddProviderManifestData,
  adminSetFunctions,
  GetProviderData,
  GetProviderManifest, GetProviderStake,
  ManifestData, ManifestStatus, ProviderData,
  ProviderProfile,
  ProvidersRegistryAction,
  ProvidersRegistryResult,
  ProvidersRegistryState,
  RegisterProviderData,
  RemoveProviderData, StakeTokens,
  UpdateProviderProfileData, WithdrawTokens,
} from "./types";
import {ContractAdmin} from "../common/ContractAdmin";
import {Validators} from "../common/Validators";
import {Tools} from "../common/Tools";
import TransferRequest from "../common/common-types";
import {ContractInteractions} from "../common/ContractInteractions";
import {ProcessedTransferRequest, WalletTransferRequests} from "../token/types";

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
      if (newProvider.stakedTokens !== undefined && newProvider.stakedTokens !== 0) {
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

    case "stake":
      const stakeData = input.data as StakeTokens;
      checkProviderId(stakeData.providerId);
      checkProviderExists(stakeData.providerId);
      checkPrivileges(caller, stakeData.providerId);

      await checkProviderBalance(stakeData.providerId, stakeData.qty);

      // is it necessary?
      checkNoPendingRequests(stakeData.providerId);

      await addStakeTransferRequest(stakeData.providerId, stakeData.qty);

      return {state}

    case "withdraw":
      const withdrawData = input.data as WithdrawTokens;
      checkProviderId(withdrawData.providerId);
      checkProviderExists(withdrawData.providerId);
      checkPrivileges(caller, withdrawData.providerId);

      // is it necessary?
      checkNoPendingRequests(stakeData.providerId);

      // TODO - or at least check if (sum of all disputes) <= (stake - withdrawData.qty)?
      checkNoPendingDisputes(withdrawData.providerId);

      checkQtyLowerThanCurrentStake(withdrawData.providerId, withdrawData.qty);

      await addStakeTransferRequest(withdrawData.providerId, -withdrawData.qty);

      return {state}

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
      const activeManifestData = input.data as GetProviderManifest;
      checkProviderId(activeManifestData.providerId);
      checkProviderExists(activeManifestData.providerId);

      const manifests = getManifestsFor(activeManifestData.providerId);
      const manifestsWithStatus = updateManifestsStatus(manifests);
      const activeManifest = manifestsWithStatus.find((manifest) => {
        return manifest.status === "active";
      });
      if (activeManifestData.eagerManifestLoad) {
        await setManifestContent(activeManifest);
      }
      trace("RESULT", activeManifest);

      return {result: {manifest: activeManifest}};

    case "currentStake":
      const currentStakeData = input.data as GetProviderStake;
      const tokenContractState = await ContractInteractions.tokenContractState();
      const providerTransferRequests: WalletTransferRequests = tokenContractState.transferRequestsRegistry[currentStakeData.providerId];
      // TODO: check if providerTransferRequests is undefined

      const stakedTokens = Object.values(providerTransferRequests)
        .filter(properlyProcessedStakeRequests)
        .map((t) => t.qty)
        .reduce((a, b) => a + b, 0);

      trace("Current stake", stakedTokens);

      return {result: {stakedTokens}};

    default:
      throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);
  }

  /* HELPER FUNCTIONS */
  function properlyProcessedStakeRequests(transferRequest: ProcessedTransferRequest) {
    return transferRequest.status === "ok" && transferRequest.type === "stake";
  }

  async function addStakeTransferRequest(providerId: string, qty: number) {
    const thisContractTxId = await ContractInteractions.getContractTxId("providers-registry");

    const request: Omit<TransferRequest, "id"> = {
      targetId: providerId,
      qty: qty,
      caller: caller,
      timestamp: SmartWeave.block.timestamp,
      type: "stake",
      owningContractTxId: thisContractTxId,
    }

    const requestId = await ContractInteractions.generateId(JSON.stringify(request));
    Tools.initIfUndefined(state.providers[providerId], "transferRequests", {});
    const transferRequests = state.providers[providerId].transferRequests;

    if (transferRequests[requestId] !== undefined) {
      throw new ContractError(`Transfer with id = ${requestId} already exists`);
    }

    transferRequests[requestId] = {
      ...request,
      id: requestId
    }
  }


  function checkNoPendingDisputes(providerId: string) {
    // TODO: implement when disputes contract will be ready.
  }

  function checkQtyLowerThanCurrentStake(providerId: string, qty: number) {

  }

  async function checkProviderBalance(caller: string, qty: number) {
    const tokenContractState = await ContractInteractions.tokenContractState();
    const balance = tokenContractState.balances[caller];
    // TODO: consider adding some "buffer"?
    // eg. only max. 80% of available tokens can be staked?
    if (balance < qty) {
      throw new ContractError("Not enough balance.");
    }
  }

  async function setManifestContent(manifest: ManifestData): Promise<ManifestData> {
    trace("Searching for data of", manifest.manifestTxId);

    try {
      const manifestContent = await SmartWeave.unsafeClient.transactions.getData(
        manifest.manifestTxId,
        {decode: true, string: true});
      manifest.activeManifestContent = JSON.parse(manifestContent);
      manifest.activeManifestContent.txId = manifest.manifestTxId;
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

  function checkNoPendingRequests(providerId: string) {
    // read token contract state and verify if there are any non-processed requests for given providerId.
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
