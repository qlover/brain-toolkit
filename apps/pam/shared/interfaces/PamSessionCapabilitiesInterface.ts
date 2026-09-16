import type {
  AsyncStoreStateInterface,
  StoreInterface
} from '@qlover/corekit-bridge';

export type PamCapabilitiesResult = {
  platformAdmin: boolean;
  permissions: string[];
};

/**
 * Client session flags derived from flat session user
 * (`system_role` + `permissions`). Server gates remain middleware / plugins.
 */
export interface PamSessionCapabilitiesStateInterface
  extends AsyncStoreStateInterface<PamCapabilitiesResult> {
  platformAdmin: boolean;
  permissions: string[];
}

export interface PamSessionCapabilitiesStoreInterface {
  getCapabilitiesStore(): StoreInterface<PamSessionCapabilitiesStateInterface>;
}
