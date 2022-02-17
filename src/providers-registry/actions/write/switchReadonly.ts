import { ProvidersRegistryAction, ProvidersRegistryState } from '../../types';

export const switchReadonly = async (
  state: ProvidersRegistryState,
  { caller, input: { data } }: ProvidersRegistryAction,
) => {
  state.readonly = !state.readonly;

  return { state };
};
