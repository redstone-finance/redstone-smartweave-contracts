import {SmartWeaveGlobal} from "smartweave/lib/smartweave-global";

export interface ProvidersRegistryState {
  /**
   * whether contract function should log debug info
   * note: only contract's admin is allowed to change this value
   */
  trace: boolean;

  /**
   * wallet address of an account that deployed the contract
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

  /**
   * data that identifies this provider
   */
  profile: ProviderProfile;

  /**
   * height of the block when this provider has been registered
   */
  registerHeight?: number;

  /**
   * TBA
   */
  lockedTokens?: number;

  /**
   * Redstone node manifests deployed for this provider
   * New manifests are added at the end of this array
   */
  manifests?: ManifestData[];
}

export interface ProviderProfile {
  id?: string;
  name: string;
  description: string;
  url: string;
  imgUrl?: string;
}

export interface ManifestData {
  uploadBlockHeight?: number;
  changeMessage: string;
  lockedHours?: number;
  manifest: any;
}

export interface ProvidersRegistryAction {
  input: ProvidersRegistryInput;
  caller: string;
}

export interface ProvidersRegistryInput {
  function: ProvidersRegistryGetFunction | ProvidersRegistrySetFunction;
  data: RegisterProviderData
    | RemoveProviderData
    | AddProviderAdminData
    | AddProviderManifestData
    | StakeProviderTokens
    | AddContractAdmins
    | SwitchTraceData;
}

export interface RegisterProviderData {
  provider: ProviderData;
}

export interface RemoveProviderData {
  providerId: string
}

export interface GetProviderData {
  providerId: string
}

export interface GetProviderManifest {
  providerId: string
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

export interface StakeProviderTokens {
  providerId: string,
  qty: number
}

export interface ProvidersRegistryResult {
  providers?: {
    [providerAddress: string]: ProviderData,
  };
  provider?: ProviderData;
  manifest?: ManifestData;
}

export type ProvidersRegistryGetFunction = 'active-manifest' | 'pending-manifests' | 'historical-manifests' | 'provider-data' ;
export type ProvidersRegistrySetFunction = 'register-provider'
  |'remove-provider'
  |'switch-trace'
  |'add-provider-admin'
  |'add-provider-manifest'
  |'stake-provider-tokens'
  |'add-contract-admins'
