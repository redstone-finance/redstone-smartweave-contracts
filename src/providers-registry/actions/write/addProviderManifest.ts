import { AddProviderManifestData, ProvidersRegistryAction, ProvidersRegistryState } from '../../types';
import { checkPrivileges, checkProviderExists, checkProviderId } from '../_commons';
import { Validators } from '../../../common/Validators';

declare const ContractError;
declare const SmartWeave;

export const addProviderManifest = async (
  state: ProvidersRegistryState,
  { caller, input: { data } }: ProvidersRegistryAction,
) => {
  const addManifestData = data as AddProviderManifestData;
  const manifestProviderId = addManifestData.providerId;
  checkProviderId(manifestProviderId);
  checkProviderExists(manifestProviderId, state.providers);
  checkPrivileges(caller, manifestProviderId, state.providers);

  const manifestData = addManifestData.manifestData;

  if (manifestData === undefined) {
    throw new ContractError('Manifest data not set.');
  }

  if (Validators.isEmpty(manifestData.manifestTxId)) {
    throw new ContractError('ManifestTxId not set.');
  }

  if (!Validators.isTypeOf(manifestData.manifestTxId, 'string')) {
    throw new ContractError('Manifest must be sent as a transaction id string.');
  }

  // TODO: verify manifestTxId using unsafeClient?
  if (Validators.isEmpty(manifestData.changeMessage)) {
    throw new ContractError('Change message is not set.');
  }

  // note: this is safe, as manifests array is initialized when provider is added
  state.providers[manifestProviderId].manifests.push(
    {
      uploadBlockHeight: SmartWeave.block.height,
      manifestTxId: manifestData.manifestTxId,
      changeMessage: manifestData.changeMessage,
      lockedHours: addManifestData.lockedHours || 0,
    },
  );

  return { state };
}
