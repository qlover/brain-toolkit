import { PermissionKey } from '@shared/auth/permissionKeys';
import {
  COMMON_ADMIN_NAV_DASHBOARD,
  COMMON_ADMIN_NAV_LOCALES,
  COMMON_ADMIN_NAV_MEMORY_KV,
  COMMON_ADMIN_NAV_PERMISSIONS,
  COMMON_ADMIN_NAV_PHONE_OTPS,
  COMMON_ADMIN_NAV_REQUEST_LOGS,
  COMMON_ADMIN_NAV_ROLES,
  COMMON_ADMIN_NAV_SITE_SETTINGS,
  COMMON_ADMIN_NAV_USER_MANAGEMENT
} from '@config/i18n-identifier/common/common';
import {
  ROUTE_ADMIN_LOCALES,
  ROUTE_ADMIN_MEMORY_KV,
  ROUTE_ADMIN_PERMISSIONS,
  ROUTE_ADMIN_PHONE_OTPS,
  ROUTE_ADMIN_ROLES,
  ROUTE_ADMIN_SETTINGS,
  ROUTE_REQUEST_LOGS
} from './route';

export type NavItemPaths =
  | 'admin'
  | 'admin/users'
  | 'admin/roles'
  | 'admin/permissions'
  | 'admin/phone-otps'
  | 'admin/memory-kv'
  | 'admin/request-logs'
  | 'admin/settings'
  | 'admin/locales';

export interface NavItemInterface {
  key: string;
  i18nKey: string;
  pathname: `/${NavItemPaths}`;
  /** When set, sidebar shows the item only if session has this permission_key. */
  permissionKey?: string;
}

export const defaultNavItems: NavItemInterface[] = [
  {
    key: 'dashboard',
    i18nKey: COMMON_ADMIN_NAV_DASHBOARD,
    pathname: '/admin'
  },
  {
    key: 'users',
    i18nKey: COMMON_ADMIN_NAV_USER_MANAGEMENT,
    pathname: '/admin/users'
  },
  {
    key: 'roles',
    i18nKey: COMMON_ADMIN_NAV_ROLES,
    pathname: ROUTE_ADMIN_ROLES
  },
  {
    key: 'permissions',
    i18nKey: COMMON_ADMIN_NAV_PERMISSIONS,
    pathname: ROUTE_ADMIN_PERMISSIONS,
    permissionKey: PermissionKey.admin_permissions_read
  },
  {
    key: 'phone-otps',
    i18nKey: COMMON_ADMIN_NAV_PHONE_OTPS,
    pathname: ROUTE_ADMIN_PHONE_OTPS
  },
  {
    key: 'memory-kv',
    i18nKey: COMMON_ADMIN_NAV_MEMORY_KV,
    pathname: ROUTE_ADMIN_MEMORY_KV,
    permissionKey: PermissionKey.admin_memory_kv_read
  },
  {
    key: 'request-logs',
    i18nKey: COMMON_ADMIN_NAV_REQUEST_LOGS,
    pathname: ROUTE_REQUEST_LOGS
  },
  {
    key: 'locales',
    i18nKey: COMMON_ADMIN_NAV_LOCALES,
    pathname: ROUTE_ADMIN_LOCALES,
    permissionKey: PermissionKey.admin_locales_read
  },
  {
    key: 'settings',
    i18nKey: COMMON_ADMIN_NAV_SITE_SETTINGS,
    pathname: ROUTE_ADMIN_SETTINGS
  }
];
