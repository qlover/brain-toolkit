import {
  COMMON_ADMIN_NAV_DASHBOARD,
  COMMON_ADMIN_NAV_PHONE_OTPS,
  COMMON_ADMIN_NAV_REQUEST_LOGS,
  COMMON_ADMIN_NAV_SITE_SETTINGS,
  COMMON_ADMIN_NAV_USER_MANAGEMENT
} from '@config/i18n-identifier/common/common';
import {
  ROUTE_ADMIN_PHONE_OTPS,
  ROUTE_ADMIN_SETTINGS,
  ROUTE_REQUEST_LOGS
} from './route';

export type NavItemPaths =
  | 'admin'
  | 'admin/users'
  | 'admin/phone-otps'
  | 'admin/request-logs'
  | 'admin/settings';

export interface NavItemInterface {
  key: string;
  i18nKey: string;
  pathname: `/${NavItemPaths}`;
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
    key: 'phone-otps',
    i18nKey: COMMON_ADMIN_NAV_PHONE_OTPS,
    pathname: ROUTE_ADMIN_PHONE_OTPS
  },
  {
    key: 'request-logs',
    i18nKey: COMMON_ADMIN_NAV_REQUEST_LOGS,
    pathname: ROUTE_REQUEST_LOGS
  },
  {
    key: 'settings',
    i18nKey: COMMON_ADMIN_NAV_SITE_SETTINGS,
    pathname: ROUTE_ADMIN_SETTINGS
  }
];
