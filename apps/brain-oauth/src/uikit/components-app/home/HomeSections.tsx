import {
  ArrowRightIcon,
  BeakerIcon,
  CodeBracketIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { LocaleLink } from '@/uikit/components/LocaleLink';
import type { HomeI18nInterface } from '@config/i18n-mapping/HomeI18n';
import {
  ROUTE_DEVELOPER_APPS,
  ROUTE_DOCS_OAUTH,
  ROUTE_OAUTH_AUTHORIZE,
  ROUTE_OAUTH_REVOKE,
  ROUTE_OAUTH_TOKEN,
  ROUTE_OAUTH_USERINFO
} from '@config/route';

interface HomeSectionProps {
  tt: HomeI18nInterface;
}

function ArrowIcon() {
  return (
    <span data-testid="ArrowIcon" className="brain-btn-arrow" aria-hidden>
      <ArrowRightIcon />
    </span>
  );
}

export function HomeHero({ tt }: HomeSectionProps) {
  return (
    <section data-testid="HomeHero" className="brain-hero">
      <span className="brain-pill soft">{tt.heroBadge}</span>
      <h1>
        {tt.heroTitle1}
        <br />
        <em>{tt.heroTitle2}</em>
      </h1>
      <p>{tt.heroDesc}</p>
      <div className="brain-hero-actions">
        <LocaleLink
          href={ROUTE_DEVELOPER_APPS}
          title={tt.heroStart}
          className="brain-btn auto"
        >
          {tt.heroStart}
          <ArrowIcon />
        </LocaleLink>
        <LocaleLink
          href={ROUTE_DOCS_OAUTH}
          title={tt.heroDocs}
          className="brain-btn auto ghost"
        >
          {tt.heroDocs}
        </LocaleLink>
      </div>
    </section>
  );
}

export function HomeFeatures({ tt }: HomeSectionProps) {
  const features = [
    {
      icon: <ShieldCheckIcon />,
      title: tt.feature1Title,
      desc: tt.feature1Desc
    },
    {
      icon: <CodeBracketIcon />,
      title: tt.feature2Title,
      desc: tt.feature2Desc
    },
    {
      icon: <BeakerIcon />,
      title: tt.feature3Title,
      desc: tt.feature3Desc
    }
  ];

  return (
    <div data-testid="HomeFeatures" className="brain-features">
      {features.map((feature) => (
        <div
          data-testid="HomeFeatureCard"
          key={feature.title}
          className="brain-card flat brain-feature"
        >
          <span className="brain-feature-icon" aria-hidden>
            {feature.icon}
          </span>
          <h3>{feature.title}</h3>
          <p>{feature.desc}</p>
        </div>
      ))}
    </div>
  );
}

const ENDPOINTS = [
  [
    'GET ',
    `${ROUTE_OAUTH_AUTHORIZE}?client_id=…&redirect_uri=…&response_type=code&code_challenge=…`
  ],
  [
    'POST',
    `${ROUTE_OAUTH_TOKEN.padEnd(18)}grant_type=authorization_code&code=…&code_verifier=…`
  ],
  [
    'GET ',
    `${ROUTE_OAUTH_USERINFO.padEnd(18)}Authorization: Bearer <access_token>`
  ],
  ['POST', `${ROUTE_OAUTH_REVOKE.padEnd(18)}token=<refresh_token>`]
] as const;

export function HomeApiSnippet({ tt }: HomeSectionProps) {
  return (
    <section data-testid="HomeApiSnippet">
      <h2 className="brain-section-title">{tt.apiSnippetTitle}</h2>
      <pre className="brain-code-block">
        {ENDPOINTS.map(([method, rest], index) => (
          <span data-testid="HomeApiSnippet" key={rest}>
            {index > 0 && '\n'}
            <b>{method}</b> {rest}
          </span>
        ))}
      </pre>
    </section>
  );
}

export function HomeCta({ tt }: HomeSectionProps) {
  return (
    <div data-testid="HomeCta" className="brain-card flat brain-cta">
      <h2>{tt.ctaTitle}</h2>
      <p>{tt.ctaDesc}</p>
      <LocaleLink
        href={ROUTE_DEVELOPER_APPS}
        title={tt.ctaButton}
        className="brain-btn auto"
      >
        {tt.ctaButton}
        <ArrowIcon />
      </LocaleLink>
    </div>
  );
}
