import { ThemeProvider } from '@wrksz/themes/next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { ClientRootProvider } from '@/uikit/components/ClientRootProvider';
import { IOCProvider } from '@/uikit/components/IOCProvider';
import { i18nConfig } from '@config/i18n';
import '@/styles/tailwind-app.css';
import '@/styles/index.css';
import { themeConfig } from '@config/theme';
import type { PageLayoutProps } from '@interfaces/AppPageRouter';
import { getI18nMessages, getLocale } from '@server/render/pageRouteParams';
import type { Metadata } from 'next';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter'
});

/**
 * Prefer public/favicon.svg (SVG + prefers-color-scheme) over app/icon.svg so
 * Next does not rasterize away light/dark fill switching.
 */
export const metadata: Metadata = {
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml'
      }
    ]
  }
};

export function generateStaticParams() {
  return i18nConfig.supportedLngs.map((locale) => ({ locale }));
}

/**
 * App Router root layout — public / SSG-oriented surfaces under `src/app`.
 *
 * Auth: page entry for login-required routes is middleware (`LOGINED_PAGES`),
 * not a layout-level client gate. Client `useUserAuth` is local UI only.
 *
 * Notes:
 * 1. Avoid client-only mount gates in layout (e.g. useMountedClient) — they
 *    remount DOM and flicker, especially on locale switch.
 * 2. Keep IOCProvider at the top; the SPA client does not split server/client IOC.
 * 3. Wrap client-only hosts with ClientRootProvider; do not blank the whole tree
 *    with `dynamic(..., { ssr: false })` around page content.
 */
export default async function RootLayout({
  children,
  params
}: PageLayoutProps) {
  const resolvedParams = await params!;
  const locale = getLocale(resolvedParams);

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale to prevent flickering during language switch
  // Load default namespaces (common, api) - admin namespaces are loaded in admin layout
  const messages = await getI18nMessages(locale);

  return (
    <html
      data-testid="AppRoute-RootLayout"
      lang={locale}
      className={inter.variable}
      // 暂时解决主题 hydration 问题
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <IOCProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider
              themes={themeConfig.supportedThemes as unknown as string[]}
              attribute={themeConfig.domAttribute}
              defaultTheme={themeConfig.defaultTheme}
              enableSystem={themeConfig.enableSystem}
              enableColorScheme={false}
              storageKey={themeConfig.storageKey}
            >
              <ClientRootProvider>{children}</ClientRootProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
        </IOCProvider>
      </body>
    </html>
  );
}
