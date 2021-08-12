import { AddContractAdmins, ProvidersRegistryAction, ProvidersRegistryState } from '../../types';
import { ContractAdmin } from '../../../common/ContractAdmin';

export const addContractAdmins = async (
  state: ProvidersRegistryState,
  { caller, input: { data } }: ProvidersRegistryAction,
  contractAdmin: ContractAdmin
) => {
  const addContractAdmins = data as AddContractAdmins;
  contractAdmin.addContractAdmins(addContractAdmins.admins);

  return { state };
};
