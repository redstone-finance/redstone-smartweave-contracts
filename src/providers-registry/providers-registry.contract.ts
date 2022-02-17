import { adminSetFunctions, ProvidersRegistryAction, ProvidersRegistryResult, ProvidersRegistryState } from './types';
import { ContractAdmin } from '../common/ContractAdmin';
import { Validators } from '../common/Validators';
import { registerProvider } from './actions/write/registerProvider';
import { removeProvider } from './actions/write/removeProvider';
import { addProviderManifest } from './actions/write/addProviderManifest';
import { addProviderAdmin } from './actions/write/addProviderAdmin';
import { updateProviderProfile } from './actions/write/updateProviderProfile';
import { updateAvailableTokens } from './actions/write/updateAvailableTokens';
import { switchTrace } from './actions/write/switchTrace';
import { addContractAdmins } from './actions/write/addContractAdmins';
import { switchReadonly } from './actions/write/switchReadonly';
import { providerData } from './actions/read/providerData';
import { providersData } from './actions/read/providersData';
import { activeManifest } from './actions/read/activeManifest';
import { availableTokens } from './actions/read/availableTokens';

declare type ContractResult = { state: ProvidersRegistryState } | { result: ProvidersRegistryResult }
declare const ContractError;

/**
 * This contract is responsible for keeping track of all providers (and their configuration) that
 * are deployed using Redstone Node server (https://github.com/redstone-finance/redstone-node)
 */
export async function handle(state: ProvidersRegistryState, action: ProvidersRegistryAction): Promise<ContractResult> {

  const caller = action.caller;
  Validators.checkWalletAddress(caller);

  const input = action.input;

  const contractAdmin = ContractAdmin.checkAndCreate(
    caller, input.function, state.contractAdmins, adminSetFunctions.slice(), state.readonly);

  if (state.providers === undefined) {
    state.providers = {};
  }

  if (state.availableTokens === undefined) {
    state.availableTokens = {};
  }

  switch (input.function) {
    case 'registerProvider':
      return await registerProvider(state, action);
    case 'removeProvider':
      return await removeProvider(state, action);
    case 'addProviderManifest':
      return await addProviderManifest(state, action);
    case 'addProviderAdmin':
      return await addProviderAdmin(state, action);
    case 'updateProviderProfile':
      return await updateProviderProfile(state, action);
    case 'updateAvailableTokens':
      return await updateAvailableTokens(state, action);
    case 'switchTrace':
      return await switchTrace(state, action);
    case 'addContractAdmins':
      return await addContractAdmins(state, action, contractAdmin);
    case 'switchReadonly':
      return await switchReadonly(state, action);
    case 'providerData':
      return await providerData(state, action);
    case 'providersData':
      return await providersData(state, action);
    case 'activeManifest':
      return await activeManifest(state, action);
    case 'availableTokens':
      return await availableTokens(state, action)
    default:
      throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);
  }

}
