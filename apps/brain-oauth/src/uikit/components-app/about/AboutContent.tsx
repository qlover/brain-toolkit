'use client';

import {
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  CodeBracketIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useIOC } from '@/uikit/hook/useIOC';
import type { AboutI18nInterface } from '@config/i18n-mapping/AboutI18n';
import { I } from '@config/ioc-identifiter';
import type { SeedSrcConfigInterface } from '@interfaces/SeedConfigInterface';

const REPO_URL = 'https://github.com/qlover/brain-toolkit';

const STANDARDS = [
  ['OAuth 2.0', 'RFC 6749'],
  ['Bearer Token', 'RFC 6750'],
  ['PKCE', 'RFC 7636'],
  ['Token Revocation', 'RFC 7009'],
  ['OpenAPI 3', '']
] as const;

export function AboutContent({ tt }: { tt: AboutI18nInterface }) {
  const appConfig = useIOC(I.AppConfig) as SeedSrcConfigInterface;

  const values = [
    { icon: <ShieldCheckIcon />, title: tt.value1Title, desc: tt.value1Desc },
    { icon: <BookOpenIcon />, title: tt.value2Title, desc: tt.value2Desc },
    { icon: <CodeBracketIcon />, title: tt.value3Title, desc: tt.value3Desc }
  ];

  const links = [
    {
      label: tt.linkChangelog,
      href: `${REPO_URL}/blob/master/apps/brain-oauth/CHANGELOG.md`
    },
    { label: tt.linkSource, href: `${REPO_URL}/tree/master/apps/brain-oauth` },
    { label: tt.linkFeedback, href: `${REPO_URL}/issues` }
  ];

  return (
    <div data-testid="AboutContent" className="brain-content">
      <section className="brain-about-hero">
        <h1 className="brain-title">{tt.heroTitle}</h1>
        <p>{tt.heroLead}</p>
      </section>

      <h2 className="brain-section-title">{tt.valuesTitle}</h2>
      <div className="brain-features">
        {values.map((value) => (
          <div
            data-testid="AboutValueCard"
            key={value.title}
            className="brain-card flat brain-feature"
          >
            <span className="brain-feature-icon" aria-hidden>
              {value.icon}
            </span>
            <h3>{value.title}</h3>
            <p>{value.desc}</p>
          </div>
        ))}
      </div>

      <section className="brain-about-standards">
        <h2 className="brain-section-title">{tt.standardsTitle}</h2>
        <div className="brain-chips">
          {STANDARDS.map(([name, rfc]) => (
            <span data-testid="AboutContent" key={name} className="brain-chip">
              {name}
              {rfc && <small>{rfc}</small>}
            </span>
          ))}
        </div>
      </section>

      <div className="brain-about-info">
        <div className="brain-card flat">
          <span className="brain-label">{tt.versionLabel}</span>
          <span className="brain-about-version">v{appConfig.version}</span>
        </div>
        <div className="brain-card flat">
          <span className="brain-label">{tt.linksLabel}</span>
          <div className="brain-about-links">
            {links.map((link) => (
              <a
                data-testid="AboutContent"
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
                <ArrowTopRightOnSquareIcon aria-hidden />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
