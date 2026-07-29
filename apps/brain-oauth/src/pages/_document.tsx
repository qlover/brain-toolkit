import Document, { Html, Head, Main, NextScript } from 'next/document';
import { getPagesThemeInitScript } from '@/uikit/utils/PagesThemeInitScriptUtil';

/**
 * Pages Router document shell.
 * App Router picks up `src/app/icon.svg` automatically; Pages needs an explicit
 * favicon link against `public/` so consoles (developer/apps, admin/*) match.
 *
 * Theme init script + `suppressHydrationWarning`: apply stored `data-theme`
 * before first paint so App→Pages navigations do not flash the default theme.
 */
export default class MyDocument extends Document {
  public override render(): React.ReactElement {
    return (
      <Html suppressHydrationWarning>
        <Head>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <script
            dangerouslySetInnerHTML={{
              __html: getPagesThemeInitScript()
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
