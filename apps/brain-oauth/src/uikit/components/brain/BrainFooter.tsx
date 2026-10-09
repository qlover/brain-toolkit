'use client';

import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { useIOC } from '@/uikit/hook/useIOC';
import { headerNavI18n } from '@config/i18n-mapping/headerNavI18n';
import { I } from '@config/ioc-identifiter';
import { ROUTE_DOCS_OAUTH } from '@config/route';
import type { SeedSrcConfigInterface } from '@interfaces/SeedConfigInterface';
import { LocaleLink } from '../LocaleLink';

export interface BrainFooterProps {
  showAbout?: boolean;
}

/** Copyright + version, docs (and optionally about) links for Brain pages. */
export function BrainFooter({ showAbout }: BrainFooterProps) {
  const tt = useI18nMapping(headerNavI18n);
  const appConfig = useIOC(I.AppConfig) as SeedSrcConfigInterface;

  return (
    <footer data-testid="BrainFooter" className="brain-foot">
      <span>
        © {new Date().getFullYear()} Brain
        <span className="brain-foot-version">v{appConfig.version}</span>
      </span>
      <span className="flex gap-4">
        <LocaleLink title={tt.navDocs} href={ROUTE_DOCS_OAUTH}>
          {tt.navDocs}
        </LocaleLink>
        {showAbout && (
          <LocaleLink title={tt.navAbout} href="/about">
            {tt.navAbout}
          </LocaleLink>
        )}
      </span>
    </footer>
  );
}
