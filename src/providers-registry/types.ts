import {TokenLockingContract} from "../common/common-types";

export interface ProvidersRegistryState extends TokenLockingContract
{
  /**
   * whether contract function should log debug info
   * note: only contract's admin is allowed to change this value
   */
  trace: boolean;

  /**
   * whether contract is working in read-only mode (ie. no state-changing functions are allowed).
   * this is mainly used for the purpose of migrating current contract's state to a newer version.
   * switching to readOnly prevents from changing contract state after its state has been saved as an initial input
   * for the new version.
   * note: only contract's admin is allowed to change this value
   */
  readonly: boolean;

  /**
   * wallet addresses of accounts with administrative privileges
   */
  contractAdmins: string[];

  /**
   * map from a wallet address of a provider to its data.
   */
  providers: {
    [providerAddress: string]: ProviderData;
  }
}

export interface ProviderData {
  /**
   * wallet addresses of users allowed to change this provider's data
   */
  adminsPool?: string[];

  // TODO: what about this feature - running multiple providers on one "physical" node.
  isMultiNode: boolean;

  /**
   * data that identifies this provider
   */
  profile: ProviderProfile;

  /**
   * height of the block when this provider has been registered
   */
  registerHeight?: number;

  // note: this is filled dynamically with data from token.contract state.
  stakedTokens?: number;

  /**
   * Redstone node manifests deployed for this provider
   * New manifests are added at the end of this array
   */
  manifests?: ManifestData[];
}

export interface ProviderProfile {
  id: string;
  name: string;
  description: string;
  url: string;
  imgUrl?: string;
}

export type ManifestStatus = "historical" | "active" | "locked";

export interface ManifestData {
  uploadBlockHeight?: number;
  changeMessage: string;
  lockedHours?: number;

  // manifest is stored in "data" field of a separate transaction,
  // as contract's input is stored in transaction tags - which are limited to 2048 bytes
  manifestTxId: string;

  // this field is evaluated when accessing provider data
  status?: ManifestStatus;

  // this is the content of the active. It is filled only by the "providerData" and "activeManifest" functions,
  // when "eagerManifestLoad" flag is set in the input by the caller.
  activeManifestContent?: any
}

export interface ProvidersRegistryAction {
  input: ProvidersRegistryInput;
  caller: string;
}

export interface ProvidersRegistryInput {
  function: ProvidersRegistryGetFunction | ProvidersRegistryAdminSetFunction | ProvidersRegistryNonAdminSetFunction;
  data: RegisterProviderData
    | RemoveProviderData
    | AddProviderAdminData
    | AddProviderManifestData
    | AddContractAdmins
    | SwitchTraceData
    | GetProviderManifest
    | UpdateAvailableTokensData;
}

export interface UpdateAvailableTokensData {
  providerId: string;
}

export interface RegisterProviderData {
  provider: ProviderData;
}

export interface RemoveProviderData {
  providerId: string
}

export interface GetProviderData {
  providerId: string

  // this flag says whether we should also try to get a transaction with "active" manifest's content
  eagerManifestLoad?: boolean
}

export interface GetProviderManifest {
  providerId: string,
  // this flag says whether we should also try to get a transaction with "active" manifest's content
  eagerManifestLoad?: boolean
}

export interface AddProviderAdminData {
  providerId: string,
  admins: string[]
}

export interface AddProviderManifestData {
  providerId: string,
  manifestData: ManifestData;
  lockedHours?: number;
}

export interface AddContractAdmins {
  admins: string[];
}

export interface SwitchTraceData {
}

export interface SwitchReadonlyData {
}

export interface UpdateProviderProfileData {
  providerId: string;
  profile: ProviderProfile;
}

export interface ProvidersRegistryResult {
  providers?: {
    [providerAddress: string]: ProviderData,
  };
  provider?: ProviderData;
  manifest?: ManifestData;
}

export const getFunctions = ["activeManifest", "providerData", "providersData"] as const;
export type ProvidersRegistryGetFunction = typeof getFunctions[number];

export const adminSetFunctions = ["switchTrace", "addContractAdmins", "switchReadonly"] as const;
export type ProvidersRegistryAdminSetFunction = typeof adminSetFunctions[number];

export const nonAdminSetFunctions = [
  "registerProvider",
  "removeProvider",
  "addProviderAdmin",
  "addProviderManifest",
  "updateProviderProfile",
  "updateAvailableTokens"
] as const;
export type ProvidersRegistryNonAdminSetFunction = typeof nonAdminSetFunctions[number];

