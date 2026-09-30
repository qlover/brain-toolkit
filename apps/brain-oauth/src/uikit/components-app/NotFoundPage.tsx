'use client';

import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { BrainFooter } from '@/uikit/components/brain/BrainFooter';
import { BrainScene } from '@/uikit/components/brain/BrainScene';
import { LocaleLink } from '@/uikit/components/LocaleLink';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { notFoundI18n } from '@config/i18n-mapping/notFoundI18n';
import { ROUTE_DOCS_OAUTH } from '@config/route';
import { AppRoutePage } from './AppRoutePage';

/** Brain-style 404: full scene, gradient "404", back home / docs. */
export function NotFoundPage() {
  const tt = useI18nMapping(notFoundI18n);

  return (
    <AppRoutePage
      data-testid="NotFound"
      tt={{ title: tt.appName, adminTitle: tt.adminTitle }}
      headerVariant="brain"
    >
      <BrainScene />

      <div className="flex flex-1 items-center justify-center px-6 pt-8 pb-16">
        <div className="brain-lost">
          <div className="brain-lost-code" aria-hidden>
            404
          </div>
          <h1 className="brain-title">{tt.title}</h1>
          <p className="brain-desc">{tt.desc}</p>
          <div className="brain-lost-actions">
            <LocaleLink href="/" title={tt.home} className="brain-btn auto">
              {tt.home}
              <span className="brain-btn-arrow" aria-hidden>
                <ArrowRightIcon />
              </span>
            </LocaleLink>
            <LocaleLink
              href={ROUTE_DOCS_OAUTH}
              title={tt.docs}
              className="brain-link"
            >
              {tt.docs}
            </LocaleLink>
          </div>
        </div>
      </div>

      <BrainFooter />
    </AppRoutePage>
  );
}
