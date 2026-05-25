import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';
import { useLocaleRoutes } from '@config/common';
import { i18nConfig } from '@config/i18n';
import {
  ROUTE_DASHBOARD_APPS,
  ROUTE_LOGIN,
  ROUTE_OAUTH_AUTHORIZE,
  ROUTE_OAUTH_PLAYGROUND,
  ROUTE_REGISTER,
  ROUTE_REQUEST_LOGS
} from '@config/route';

const locales = i18nConfig.supportedLngs;

export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,

  defaultLocale: i18nConfig.fallbackLng,

  localePrefix: useLocaleRoutes ? 'always' : 'as-needed',

  pathnames: {
    '/': {
      en: '/',
      zh: '/'
    },
    [ROUTE_LOGIN]: {
      en: '/auth/login',
      zh: '/auth/login'
    },
    [ROUTE_REGISTER]: {
      en: '/auth/register',
      zh: '/auth/register'
    },
    [ROUTE_REQUEST_LOGS]: {
      en: '/admin/request-logs',
      zh: '/admin/request-logs'
    },
    [ROUTE_DASHBOARD_APPS]: {
      en: '/dashboard/apps',
      zh: '/dashboard/apps'
    },
    [ROUTE_OAUTH_AUTHORIZE]: {
      en: '/oauth/authorize',
      zh: '/oauth/authorize'
    },
    [ROUTE_OAUTH_PLAYGROUND]: {
      en: '/oauth/playground',
      zh: '/oauth/playground'
    },
    '/about': {
      en: '/about',
      zh: '/about'
    }
  }
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
