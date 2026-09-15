'use client';

import { useStore } from '@qlover/next-kit/client';
import {
  PermissionKey,
  type PamPermissionKey
} from '@shared/auth/permissionKeys';
import { I } from '@config/ioc-identifiter';
import type { PamSessionCapabilitiesStateInterface } from '@interfaces/PamSessionCapabilitiesInterface';
import { useIOC } from './useIOC';
import { useUserAuth } from './useUserAuth';

const permissionsSelector = (
  state: PamSessionCapabilitiesStateInterface
): string[] => state.permissions;

function useSessionPermissionKeys(): {
  permissions: string[];
  success: boolean;
  loading: boolean;
} {
  const userService = useIOC(I.UserServiceInterface);
  const { success, loading } = useUserAuth();
  const permissions = useStore(
    userService.getCapabilitiesStore(),
    permissionsSelector
  );
  return { permissions, success, loading };
}

export { useSessionPermissionKeys };

/**
 * UI gate by permission_key (sole identity).
 *
 * @example
 * const { allowed } = useCan(PermissionKey.pam_project_create);
 */
export function useCan(
  permissionKey: PamPermissionKey | readonly PamPermissionKey[]
): {
  allowed: boolean;
  loading: boolean;
} {
  const { permissions, success, loading } = useSessionPermissionKeys();
  const keys =
    typeof permissionKey === 'string' ? [permissionKey] : [...permissionKey];
  const allowed = success && keys.some((key) => permissions.includes(key));

  return { allowed, loading };
}

/** @deprecated Prefer {@link useCan} */
export function useHasPermission(permissionKey: string): {
  allowed: boolean;
  loading: boolean;
} {
  const { permissions, success, loading } = useSessionPermissionKeys();
  return {
    allowed: success && permissions.includes(permissionKey),
    loading
  };
}

export { PermissionKey };
