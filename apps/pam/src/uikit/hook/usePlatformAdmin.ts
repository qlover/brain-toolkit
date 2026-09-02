'use client';

import { useStore } from '@qlover/next-kit/client';
import { I } from '@config/ioc-identifiter';
import type { PamSessionCapabilitiesStateInterface } from '@interfaces/PamSessionCapabilitiesInterface';
import { useIOC } from './useIOC';
import { useUserAuth } from './useUserAuth';

const platformAdminSelector = (
  state: PamSessionCapabilitiesStateInterface
): boolean => state.platformAdmin;

/**
 * Platform admin flag from session bootstrap (UI affordances only).
 * Page/API gates are middleware + PlatformAdminPlugin.
 */
export function usePlatformAdmin() {
  const userService = useIOC(I.UserServiceInterface);
  const { success, loading } = useUserAuth();
  const platformAdmin = useStore(
    userService.getCapabilitiesStore(),
    platformAdminSelector
  );

  return {
    platformAdmin: success && platformAdmin,
    loading
  };
}
