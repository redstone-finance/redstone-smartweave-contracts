import { ProvidersRegistryAction, ProvidersRegistryState } from '../../types';

export const switchTrace = async (
  state: ProvidersRegistryState,
  { caller, input: { data } }: ProvidersRegistryAction,
) => {
  state.trace = !state.trace;
  return { state };
};
