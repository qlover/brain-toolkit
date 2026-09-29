'use client';

import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { headerNavI18n } from '@config/i18n-mapping/headerNavI18n';
import { ROUTE_DOCS_OAUTH } from '@config/route';
import { LocaleLink } from '../LocaleLink';

export interface BrainFooterProps {
  showAbout?: boolean;
}

/** Copyright + docs (and optionally about) links for Brain pages. */
export function BrainFooter({ showAbout }: BrainFooterProps) {
  const tt = useI18nMapping(headerNavI18n);

  return (
    <footer data-testid="BrainFooter" className="brain-foot">
      <span>© {new Date().getFullYear()} Brain</span>
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
