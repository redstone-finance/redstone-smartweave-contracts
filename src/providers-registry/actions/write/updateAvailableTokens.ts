import { ProvidersRegistryAction, ProvidersRegistryState, UpdateAvailableTokensData } from '../../types';
import { Tools } from '../../../common/Tools';
import { ContractInteractions } from '../../../common/ContractInteractions';
import { TokenState } from '../../../token/types';
import { Deposit } from '../../../common/common-types';
import { checkPrivileges, checkProviderExists, checkProviderId } from '../_commons';

export const updateAvailableTokens = async (
  state: ProvidersRegistryState,
  { caller, input: { data } }: ProvidersRegistryAction
) => {
  const { providerId } = data as UpdateAvailableTokensData;
  checkProviderId(providerId);
  checkProviderExists(providerId, state.providers);
  checkPrivileges(caller, providerId, state.providers);

  Tools.initIfUndefined(state, 'availableTokens', {});
  Tools.initIfUndefined(state.availableTokens, providerId, {});

  const deposit = (await getDeposits())[providerId];
  const stakedTokens = calculateStakedTokens(deposit);

  // just an example implementation
  state.availableTokens[providerId] = Math.floor(0.5 * stakedTokens);

  return { state };
};

export async function getDeposits() {
  // note: remove try-catch when token contract will be deployed
  try {
    const tokenContractState = (await ContractInteractions.tokenContractState()) as TokenState;

    const contractDeposits = tokenContractState.contractDeposits['providers-registry'];
    if (contractDeposits === undefined) {
      return {};
    }
    return contractDeposits.wallets;
  } catch (e) {
    return {};
  }
}

export function calculateStakedTokens(deposit: Deposit) {
  if (deposit === undefined) {
    return 0;
  }
  return deposit.deposit - deposit.withdraw;
}
