import { AddProviderAdminData, ProvidersRegistryAction, ProvidersRegistryState } from '../../types';
import { checkPrivileges, checkProviderExists, checkProviderId } from '../_commons';

declare const ContractError;
declare const SmartWeave;

export const addProviderAdmin = async (
  state: ProvidersRegistryState,
  { caller, input: { data } }: ProvidersRegistryAction,
) => {
  const addProviderAdminData = data as AddProviderAdminData;
  checkProviderId(addProviderAdminData.providerId);
  checkProviderExists(addProviderAdminData.providerId, state.providers);
  checkPrivileges(caller, addProviderAdminData.providerId, state.providers);

  // note: this is safe, as adminsPool array is initialized when provider is added
  state.providers[addProviderAdminData.providerId].adminsPool.push(...addProviderAdminData.admins);

  return { state };
};
