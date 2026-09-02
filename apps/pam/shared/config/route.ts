import {
  API_CLIENTS_2,
  API_CLIENTS_ROTATE_SECRET,
  API_PAM_DELETE,
  API_PAM_DETAIL,
  API_PAM_EDIT,
  API_PAM_ENVIRONMENTS,
  API_PAM_ENVIRONMENTS_DELETE,
  API_PAM_ENVIRONMENTS_EXPORT,
  API_PAM_ENVIRONMENTS_VARIABLES,
  API_PAM_FORK,
  API_PAM_TRANSFER,
  API_PAM_PREVIEW_IMAGE
} from './apiRoutes';
import { i18nConfig } from './i18n';
import type { LocaleType } from './i18n';
import type { NextURL } from 'next/dist/server/web/next-url';
import type { NextRequest } from 'next/server';

export * from './apiRoutes';

/**
 * 登录页面路由地址
 */
export const ROUTE_LOGIN = '/auth/login' as const;

/**
 * 注册页面路由地址
 */
export const ROUTE_REGISTER = '/auth/register' as const;

/**
 * Email OTP / Magic Link callback page.
 * Shows loading UI, exchanges PKCE ?code=, then POSTs to /api/callback/email-login.
 */
export const ROUTE_CALLBACK_EMAIL_LOGIN = '/callback/email-login' as const;

/**
 * Admin console home. Pages Router: `src/pages/[locale]/admin/index.tsx`.
 * Entry gate: middleware via LOGINED_PAGES (not a page-level client auth wrapper).
 */
export const ROUTE_ADMIN = '/admin' as const;

/**
 * Admin users management. Pages Router: `src/pages/[locale]/admin/users.tsx`.
 */
export const ROUTE_ADMIN_USERS = '/admin/users' as const;

/**
 * Current-user request / activity log viewer (requires auth). Pages Router: `src/pages/[locale]/admin/request-logs.tsx`.
 */
export const ROUTE_REQUEST_LOGS = '/admin/request-logs' as const;

/**
 * Admin site settings. Pages Router: `src/pages/[locale]/admin/settings.tsx`.
 */
export const ROUTE_ADMIN_SETTINGS = '/admin/settings' as const;

export const ROUTE_HOME = '/' as const;

/**
 * PAM CLI device authorization page (browser approve for `pam login`).
 */
export const ROUTE_PAMENV_DEVICE = '/pamenv/device' as const;
/** @deprecated Use {@link ROUTE_PAMENV_DEVICE} */
export const ROUTE_CLI_DEVICE = ROUTE_PAMENV_DEVICE;

/**
 * PAM project detail routes (App Router under `src/app/[locale]/projects/...`).
 * Nested paths use {@link hasSessionPath} prefix matching via {@link ROUTE_PROJECTS}.
 *
 * Dynamic segment is still named `[projectId]` in the App Router folder, but the
 * URL value is the project **slug** (UUID still accepted and redirected to slug).
 */
export const ROUTE_PROJECTS = '/projects' as const;

/** next-intl pathname template — segment value is slug (legacy UUID ok). */
export const ROUTE_PROJECT_DETAIL = '/projects/[projectId]' as const;

/** next-intl pathname template — segment value is slug (legacy UUID ok). */
export const ROUTE_PROJECT_GENERAL = '/projects/[projectId]/general' as const;

/** next-intl pathname template — segment value is slug (legacy UUID ok). */
export const ROUTE_PROJECT_ENVIRONMENTS =
  '/projects/[projectId]/environments' as const;

/** Developer console app list (PRD default post-login redirect). */
export const ROUTE_DEVELOPER_APPS = '/developer/apps' as const;

/** OAuth 2.0 authorization consent page. */
export const ROUTE_OAUTH_AUTHORIZE = '/oauth/authorize' as const;

/** In-app OAuth flow playground (developer testing). */
export const ROUTE_OAUTH_PLAYGROUND = '/oauth/playground' as const;

export const ROUTE_ABOUT = '/about' as const;

/** OAuth integration guide (public documentation). */
export const ROUTE_DOCS_OAUTH = '/docs/oauth' as const;

/** pamenv CLI usage guide (public documentation). */
export const ROUTE_DOCS_CLI = '/docs/cli' as const;

/** OAuth 2.0 token endpoint (machine-to-machine, no locale prefix). */
export const ROUTE_OAUTH_TOKEN = '/oauth/token' as const;

/** RFC 7009 token revocation endpoint (machine-to-machine, no locale prefix). */
export const ROUTE_OAUTH_REVOKE = '/oauth/revoke' as const;

/** OAuth 2.0 / OIDC userinfo endpoint (machine-to-machine, no locale prefix). */
export const ROUTE_OAUTH_USERINFO = '/oauth/userinfo' as const;

/**
 * ─── Auth 相关 API 路由常量 ───
 *
 * 与 apiRoutes.ts 中的通用 API 常量区分，
 * 专门用于 auth 回调流程中的后端接口。
 * 后续如有更多回调 API 可统一放入此区域。
 */

/** OAuth machine endpoints that skip session and locale middleware. */
export const OAUTH_MACHINE_ROUTES = [
  ROUTE_OAUTH_TOKEN,
  ROUTE_OAUTH_REVOKE,
  ROUTE_OAUTH_USERINFO,
  // 回调路由
  ROUTE_CALLBACK_EMAIL_LOGIN
] as const;

/**
 * OAuth endpoints mounted at `src/app/oauth/*` (no `[locale]` segment).
 * next-intl must not rewrite these to `/zh/oauth/token` etc.
 */
export const OAUTH_LOCALE_AGNOSTIC_ROUTES = [
  ROUTE_OAUTH_TOKEN,
  ROUTE_OAUTH_REVOKE,
  ROUTE_OAUTH_USERINFO
] as const;

/** Routes that are allowed without authentication (public routes). */
export const AUTH_ROUTES = [
  ROUTE_HOME,
  /** Public project list (detail tree still gated via {@link isLoginRequiredProjectsPath}). */
  ROUTE_PROJECTS,
  ROUTE_LOGIN,
  ROUTE_REGISTER,
  ROUTE_CALLBACK_EMAIL_LOGIN,
  ROUTE_DOCS_OAUTH,
  ROUTE_DOCS_CLI,
  ROUTE_ABOUT
] as const;

/**
 * Pages that require a valid session cookie (middleware entry gate).
 *
 * Auth layering:
 * - Middleware ({@link hasSessionPath} + OAuthSessionService) is the only
 *   page-entry gate; unauthenticated users are redirected to login.
 * - Client `useUserAuth` is for local UI only (auth buttons, admin visibility).
 * - Do not wrap these pages in a fullscreen client auth gate.
 *
 * Router split: App Router = public / SSG-oriented; Pages Router = logged-in
 * CSR consoles (admin/*, developer/apps). Keep new console routes listed here.
 */
export const LOGINED_PAGES = [
  ROUTE_ADMIN,
  ROUTE_ADMIN_USERS,
  ROUTE_REQUEST_LOGS,
  ROUTE_ADMIN_SETTINGS,
  ROUTE_DEVELOPER_APPS,
  ROUTE_OAUTH_PLAYGROUND,
  // Consent requires an app session; gate here so unauthenticated users
  // are sent to login with `?redirect=<full authorize URL>` via redirectToPath.
  ROUTE_OAUTH_AUTHORIZE,
  // pamenv browser login approve page.
  ROUTE_PAMENV_DEVICE
] as const;

/**
 * Project detail tree (`/projects/:id`, …) is gated by
 * {@link isLoginRequiredProjectsPath}. Exact `/projects` list is public
 * ({@link AUTH_ROUTES}).
 */

/**
 * Returns true if pathname is an OAuth machine endpoint (token, userinfo, etc.).
 */
export function isOAuthMachinePath(pathname: string): boolean {
  return OAUTH_MACHINE_ROUTES.some(
    (route) => pathname === route || pathname.endsWith(route)
  );
}

/**
 * Returns true if pathname is a locale-agnostic OAuth endpoint
 * (`/oauth/token`, `/oauth/revoke`, `/oauth/userinfo`).
 */
export function isOAuthLocaleAgnosticPath(pathname: string): boolean {
  return OAUTH_LOCALE_AGNOSTIC_ROUTES.some(
    (route) => pathname === route || pathname.endsWith(route)
  );
}

/** 仅未登录用户应访问的 auth 页（已登录应 redirect 走） */
export const GUEST_ONLY_AUTH_PAGES = [ROUTE_LOGIN, ROUTE_REGISTER] as const;

/**
 * Returns true if pathname is a public route (no auth required).
 * Handles locale-prefixed paths (e.g. /en/auth/login).
 */
export function isPublicPath(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => {
    if (route === ROUTE_HOME) {
      if (pathname === '/' || pathname === '') return true;
      const localeSegment = pathname.match(/^\/([^/]+)\/?$/);
      return (
        localeSegment != null &&
        i18nConfig.supportedLngs.includes(localeSegment[1] as 'en' | 'zh')
      );
    }
    if (route === ROUTE_PROJECTS) {
      const localeAlt = i18nConfig.supportedLngs.join('|');
      const withoutLocale = pathname.replace(
        new RegExp(`^\\/(${localeAlt})(?=\\/|$)`),
        ''
      );
      return (
        withoutLocale === ROUTE_PROJECTS ||
        withoutLocale === `${ROUTE_PROJECTS}/`
      );
    }
    // Use suffix match so /auth/login does not match longer auth paths incorrectly
    return pathname === route || pathname.endsWith(route);
  });
}

export function apiClientDetail<T extends string>(
  clientId: T
): `/api/clients/${T}` {
  return API_CLIENTS_2.replace(
    ':clientId',
    encodeURIComponent(clientId)
  ) as `/api/clients/${T}`;
}

export function apiClientRotateSecret(clientId: string): string {
  return API_CLIENTS_ROTATE_SECRET.replace(
    ':clientId',
    encodeURIComponent(clientId)
  );
}

/**
 * Reads a supported locale from the first path segment, else fallback.
 *
 * @param pathname - Pathname that may include a locale prefix
 */
export function localeFromPathname(pathname: string): LocaleType {
  const match = pathname.match(/^\/([^/]+)(?=\/|$)/);
  const seg = match?.[1];
  if (seg && (i18nConfig.supportedLngs as readonly string[]).includes(seg)) {
    return seg as LocaleType;
  }
  return i18nConfig.fallbackLng;
}

/**
 * Prefixes a locale-agnostic route with `/{locale}`.
 *
 * @param route - Path starting with `/` (e.g. `/auth/login`)
 * @param locale - Supported locale
 */
export function withLocalePrefix(route: string, locale: LocaleType): string {
  const path = route.startsWith('/') ? route : `/${route}`;
  return `/${locale}${path}`;
}

/**
 * Builds an absolute app path for the given locale (leading `/`).
 *
 * @param route - Locale-agnostic route (e.g. `/callback/email-login`)
 * @param locale - Supported locale
 */
export function localePage(route: string, locale: LocaleType): string {
  return withLocalePrefix(route, locale);
}

/**
 * Builds `/projects/:slug` (no trailing slash).
 *
 * @param slug - Project slug (or legacy UUID for redirects)
 * @returns Locale-agnostic project detail base path
 */
export function projectPath(slug: string): string {
  return ROUTE_PROJECT_DETAIL.replace('[projectId]', encodeURIComponent(slug));
}

/**
 * Builds `/projects/:slug/general`.
 *
 * @param slug - Project slug (or legacy UUID for redirects)
 * @returns Locale-agnostic general tab path
 */
export function projectGeneralPath(slug: string): string {
  return ROUTE_PROJECT_GENERAL.replace('[projectId]', encodeURIComponent(slug));
}

/**
 * Builds `/projects/:slug/environments`.
 *
 * @param slug - Project slug (or legacy UUID for redirects)
 * @returns Locale-agnostic environments tab path
 */
export function projectEnvironmentsPath(slug: string): string {
  return ROUTE_PROJECT_ENVIRONMENTS.replace(
    '[projectId]',
    encodeURIComponent(slug)
  );
}

/**
 * Whether pathname is under PAM project **detail** routes
 * (e.g. `/en/projects/:id/general`).
 *
 * Exact `/projects` (public list) is excluded; nested segments require login.
 *
 * @param pathname - Request pathname (may include locale prefix)
 * @returns True when the path is a project detail route
 */
export function isLoginRequiredProjectsPath(pathname: string): boolean {
  const localeAlt = i18nConfig.supportedLngs.join('|');
  const withoutLocale = pathname.replace(
    new RegExp(`^\\/(${localeAlt})(?=\\/|$)`),
    ''
  );
  return withoutLocale.startsWith(`${ROUTE_PROJECTS}/`);
}

/**
 * 是否是 oauth 认证服务的路由
 * @param pathname
 */
export function isOAuthRoutePath(pathname: string): boolean {
  return OAUTH_MACHINE_ROUTES.some(
    (route) => pathname === route || pathname.endsWith(route)
  );
}

/**
 * Whether the path is an auth callback page under `/callback/*`
 * (e.g. `/en/callback/email-login`). These pages establish session first,
 * so bootstrap must not call `/api/user/session` prematurely.
 */
export function isAuthCallbackPath(pathname: string): boolean {
  return /(?:^|\/)callback(?:\/|$)/.test(pathname);
}

/**
 * 是否需要登录才能访问的页面
 * @param pathname
 */
export function hasSessionPath(pathname: string): boolean {
  if (
    LOGINED_PAGES.some(
      (route) => pathname === route || pathname.endsWith(route)
    )
  ) {
    return true;
  }
  return isLoginRequiredProjectsPath(pathname);
}

/**
 * 是否需要携带国际化路由的路径
 *
 * 一般来说，除了 isOAuthRoutePath 的 path 其余都需要带上
 * @param pathname
 */
export function hasLocalPath(pathname: string): boolean {
  return !isOAuthRoutePath(pathname);
}

/**
 * 用于将请求重定向到某个路径，但是会携带当前 pathnmae 参数，用于重定向回来
 *
 * **默认重定向到 login 页面**
 *
 * 常见场景为访问了需要登陆的页面时没有登陆则会重定向到登陆页面，当登陆成功后可以在根据参数重定向回来
 *
 * @param request
 * @param pathnmae
 * @param targetRoute
 * @returns
 */
export function redirectToPath(
  request: NextRequest,
  pathnmae?: string,
  targetRoute: string = ROUTE_LOGIN
): NextURL {
  const pathnmae2 = pathnmae || request.nextUrl.pathname;
  const locale = localeFromPathname(pathnmae2);

  const url = request.nextUrl.clone();
  const returnPath = `${pathnmae2}${request.nextUrl.search}`;
  // Keep current UI language on the login (or target) page.
  url.pathname = withLocalePrefix(targetRoute, locale);
  url.search = `redirect=${encodeURIComponent(returnPath)}`;
  return url;
}

/**
 * 用于构建一个带 path 参数的 api 请求地址
 *
 * @example
 * ```
 * /api/user/:id/detail
 *
 * buildApiWithPath('/api/user/:id/detail', { id: '123' })
 * // => /api/user/123/detail
 *
 * buildApiWithPath('/api/pam/:projectId/environments/:envId', {
 *   projectId: 'p',
 *   envId: 'e'
 * })
 * // => /api/pam/p/environments/e
 * ```
 *
 * @param pathname
 * @param vars
 * @returns
 */
export function buildApiWithPath(
  pathname: string,
  vars: Record<string, string>
): string {
  // Longer keys first so `:projectId` is not partially matched by `:id`.
  const keys = Object.keys(vars).sort((a, b) => b.length - a.length);

  return keys.reduce((path, key) => {
    const pathKey = key.startsWith(':') ? key : `:${key}`;
    return path.replaceAll(pathKey, vars[key]);
  }, pathname);
}

/**
 * @see {@link API_PAM_DETAIL}
 * @param id
 * @returns
 */
export function buildApiPamDetail(id: string): string {
  return buildApiWithPath(API_PAM_DETAIL, { id });
}

export function buildApiPamEdit(id: string): string {
  return buildApiWithPath(API_PAM_EDIT, { id });
}

export function buildApiPamDetele(id: string): string {
  return buildApiWithPath(API_PAM_DELETE, { id });
}

/**
 * @see {@link API_PAM_FORK}
 * @param id - Source project id
 * @returns `/api/pam/fork/:id`
 */
export function buildApiPamFork(id: string): string {
  return buildApiWithPath(API_PAM_FORK, { id });
}

/**
 * @see {@link API_PAM_TRANSFER}
 * @param id - Project id
 * @returns `/api/pam/transfer/:id`
 */
export function buildApiPamTransfer(id: string): string {
  return buildApiWithPath(API_PAM_TRANSFER, { id });
}

/**
 * @see {@link API_PAM_PREVIEW_IMAGE}
 * @param id - Project id
 * @returns `/api/pam/preview-image/:id`
 */
export function buildApiPamPreviewImage(id: string): string {
  return buildApiWithPath(API_PAM_PREVIEW_IMAGE, { id });
}

/**
 * @see {@link API_PAM_ENVIRONMENTS}
 * @param projectId - Project id
 * @returns `/api/pam/:projectId/environments`
 */
export function buildApiPamEnvironments(projectId: string): string {
  return buildApiWithPath(API_PAM_ENVIRONMENTS, { projectId });
}

/**
 * @see {@link API_PAM_ENVIRONMENTS_DELETE}
 * @param projectId - Project id
 * @param envId - Environment id
 * @returns `/api/pam/:projectId/environments/:envId/delete`
 */
export function buildApiPamEnvironmentDelete(
  projectId: string,
  envId: string
): string {
  return buildApiWithPath(API_PAM_ENVIRONMENTS_DELETE, { projectId, envId });
}

/**
 * @see {@link API_PAM_ENVIRONMENTS_VARIABLES}
 * @param projectId - Project id
 * @param envId - Environment id
 * @returns `/api/pam/:projectId/environments/:envId/variables`
 */
export function buildApiPamEnvironmentVariables(
  projectId: string,
  envId: string
): string {
  return buildApiWithPath(API_PAM_ENVIRONMENTS_VARIABLES, {
    projectId,
    envId
  });
}

/**
 * @see {@link API_PAM_ENVIRONMENTS_EXPORT}
 * @param projectId - Project id
 * @param envId - Environment id
 * @returns `/api/pam/:projectId/environments/:envId/export`
 */
export function buildApiPamEnvironmentExport(
  projectId: string,
  envId: string
): string {
  return buildApiWithPath(API_PAM_ENVIRONMENTS_EXPORT, {
    projectId,
    envId
  });
}

export function isAuthGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_AUTH_PAGES.some(
    (route) => pathname === route || pathname.endsWith(route)
  );
}
