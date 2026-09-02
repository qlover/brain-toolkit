import type {
  AsyncStoreStateInterface,
  StoreInterface
} from '@qlover/corekit-bridge';

export type PamCapabilitiesResult = {
  platformAdmin: boolean;
};

/**
 * Client session capabilities from GET /api/user/session (UI only).
 * Server gates remain middleware + PlatformAdminPlugin.
 */
export interface PamSessionCapabilitiesStateInterface
  extends AsyncStoreStateInterface<PamCapabilitiesResult> {
  platformAdmin: boolean;
}

export interface PamSessionCapabilitiesStoreInterface {
  getCapabilitiesStore(): StoreInterface<PamSessionCapabilitiesStateInterface>;
}
