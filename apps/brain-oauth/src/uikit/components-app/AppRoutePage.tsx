export { AppRoutePageApp as AppRoutePage } from './AppRoutePageApp';
export { AppRoutePagePages } from './AppRoutePagePages';
import type { HTMLAttributes, ReactNode } from 'react';

export interface AppRoutePageTT {
  title: string;
  adminTitle: string;
  developerTitle?: string;
  /** Optional subtitle shown next to the app title (e.g. developer console). */
  headerSubtitle?: string;
}

export type AppRoutePageRouterKind = 'app' | 'pages';

export interface AppRoutePageProps extends HTMLAttributes<HTMLDivElement> {
  /** App Router (default) or Pages Router — loads a separate bundle for each. */
  routerKind?: AppRoutePageRouterKind;
  showAdminButton?: boolean;
  showDeveloperButton?: boolean;
  showHeaderLogo?: boolean;
  mainProps?: HTMLAttributes<HTMLElement>;
  showAuthButton?: boolean;
  /** Show text label on logout control (home header). */
  authButtonShowLogoutLabel?: boolean;
  /** Show docs/about/developer links in header (default true). Auth pages should set false. */
  showHeaderNav?: boolean;
  headerClassName?: string;
  headerHref?: string;
  headerNav?: ReactNode;
  /** Optional class for the header title text (e.g. brand color on console pages). */
  headerTitleClassName?: string;
  /**
   * See `RoutePageLayoutProps.headerVariant`. In `brain` mode the auth slot is
   * `BrainAuthActions` and there is no default nav (pass `headerNav`).
   */
  headerVariant?: 'default' | 'brain';
  /** `brain` header: console pill for signed-in users. */
  authShowConsole?: boolean;
  /** `brain` header: admin backend pill for Brain admins (default true). */
  authShowAdmin?: boolean;
  tt: AppRoutePageTT;
}
