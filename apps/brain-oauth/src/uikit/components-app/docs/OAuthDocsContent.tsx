'use client';

import {
  BeakerIcon,
  BookOpenIcon,
  ClipboardDocumentIcon,
  InformationCircleIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { usePageI18nMapping } from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { BrainTabs } from '@/uikit/components/brain/BrainTabs';
import { LocaleLink } from '@/uikit/components/LocaleLink';
import { useIOC } from '@/uikit/hook/useIOC';
import type { OAuthDocsI18nInterface } from '@config/i18n-mapping/oauthDocsI18n';
import { I } from '@config/ioc-identifiter';
import {
  API_REFERENCE,
  ROUTE_DEVELOPER_APPS,
  ROUTE_OAUTH_AUTHORIZE,
  ROUTE_OAUTH_PLAYGROUND,
  ROUTE_OAUTH_REVOKE,
  ROUTE_OAUTH_TOKEN,
  ROUTE_OAUTH_USERINFO
} from '@config/route';
import type { DialogHandler } from '@qlover/next-kit/client';
import type { ReactNode } from 'react';

const SECTION_IDS = [
  'overview',
  'flow',
  'endpoints',
  'authorize',
  'token',
  'pkce',
  'userinfo',
  'errors'
] as const;

type SectionId = (typeof SECTION_IDS)[number];

/** `**bold**` highlights keywords, `%%text%%` is a comment left out of the copied text. */
const CODE_TOKEN = /(\*\*[^*]+\*\*|%%[^%]+%%)/;

function renderCode(source: string): ReactNode[] {
  return source.split(CODE_TOKEN).map((part, index) => {
    if (part.startsWith('**')) {
      return (
        <b data-testid="renderCode" key={index}>
          {part.slice(2, -2)}
        </b>
      );
    }
    if (part.startsWith('%%')) {
      return (
        <i data-testid="renderCode" key={index}>
          {part.slice(2, -2)}
        </i>
      );
    }
    return part;
  });
}

function toCopyText(source: string): string {
  return source
    .replace(/[ \t]*%%[^%]+%%/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1');
}

function DocCode({
  lang,
  source,
  copyLabel,
  onCopy
}: {
  lang: string;
  source: string;
  copyLabel: string;
  onCopy: (text: string) => void;
}) {
  return (
    <div data-testid="DocCode" className="brain-doc-code">
      <span className="brain-doc-code-lang">{lang}</span>
      <button
        type="button"
        className="brain-doc-code-copy"
        aria-label={copyLabel}
        title={copyLabel}
        onClick={() => onCopy(toCopyText(source))}
      >
        <ClipboardDocumentIcon />
      </button>
      <pre className="brain-code-block">{renderCode(source)}</pre>
    </div>
  );
}

function DocTable({
  head,
  rows
}: {
  head: string[];
  rows: { key: string; cells: ReactNode[] }[];
}) {
  return (
    <div data-testid="DocTable" className="brain-card flat brain-doc-table">
      <div className="brain-table-wrap">
        <table className="brain-table">
          <thead>
            <tr>
              {head.map((cell) => (
                <th data-testid="DocTable" key={cell}>
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr data-testid="DocTable" key={row.key}>
                {row.cells.map((cell, index) => (
                  <td
                    data-testid="DocTable"
                    key={index}
                    className={clsx(index === row.cells.length - 1 && 'wrap')}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Method({ value }: { value: 'GET' | 'POST' }) {
  return (
    <span
      data-testid="Method"
      className={clsx('brain-method', value === 'POST' && 'post')}
    >
      {value}
    </span>
  );
}

function Mono({ children }: { children: string }) {
  return (
    <span data-testid="Mono" className="brain-mono">
      {children}
    </span>
  );
}

function useActiveSection(): [SectionId, (id: SectionId) => void] {
  const [active, setActive] = useState<SectionId>('overview');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActive(visible[0].target.id as SectionId);
        }
      },
      { rootMargin: '0px 0px -70% 0px' }
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return [active, setActive];
}

export function OAuthDocsContent() {
  const tt = usePageI18nMapping<OAuthDocsI18nInterface>();
  const dialogHandler = useIOC(I.DialogHandler) as DialogHandler;
  const [active, setActive] = useActiveSection();
  const [tokenTab, setTokenTab] = useState<'code' | 'refresh'>('code');

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      dialogHandler.success(tt.copied);
    } catch {
      // clipboard permission denied; nothing useful to report
    }
  };

  const codeProps = { copyLabel: tt.copy, onCopy: handleCopy };

  const sectionTitles: Record<SectionId, string> = {
    overview: tt.sectionOverview,
    flow: tt.sectionFlow,
    endpoints: tt.sectionEndpoints,
    authorize: tt.sectionAuthorize,
    token: tt.sectionToken,
    pkce: tt.sectionPkce,
    userinfo: tt.sectionUserinfo,
    errors: tt.sectionErrors
  };

  const flow = [
    [tt.flow1, tt.flow1Desc],
    [tt.flow2, tt.flow2Desc],
    [tt.flow3, tt.flow3Desc],
    [tt.flow4, tt.flow4Desc],
    [tt.flow5, tt.flow5Desc]
  ];

  const required = <span className="brain-pill sm ok">{tt.required}</span>;
  const optional = <span className="brain-pill sm soft">{tt.optional}</span>;

  return (
    <div data-testid="OAuthDocsContent" className="brain-content">
      <h1 className="brain-title">{tt.title}</h1>
      <p className="brain-desc">{tt.desc}</p>

      <div className="brain-doc-quick">
        <LocaleLink
          href={ROUTE_OAUTH_PLAYGROUND}
          title={tt.quickPlayground}
          className="brain-card flat"
        >
          <BeakerIcon />
          <span>{tt.quickPlayground}</span>
          <small>{tt.quickPlaygroundSub}</small>
        </LocaleLink>
        <a
          href={API_REFERENCE}
          target="_blank"
          rel="noopener noreferrer"
          className="brain-card flat"
        >
          <BookOpenIcon />
          <span>{tt.quickOpenapi}</span>
          <small>{tt.quickOpenapiSub}</small>
        </a>
        <LocaleLink
          href={ROUTE_DEVELOPER_APPS}
          title={tt.quickConsole}
          className="brain-card flat"
        >
          <KeyIcon />
          <span>{tt.quickConsole}</span>
          <small>{tt.quickConsoleSub}</small>
        </LocaleLink>
      </div>

      <div className="brain-doc">
        <nav className="brain-doc-toc" aria-label={tt.toc}>
          <span className="brain-label">{tt.toc}</span>
          {SECTION_IDS.map((id) => (
            <a
              data-testid="OAuthDocsContent"
              key={id}
              href={`#${id}`}
              aria-current={active === id ? 'true' : undefined}
              onClick={(event) => {
                event.preventDefault();
                setActive(id);
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {sectionTitles[id]}
            </a>
          ))}
        </nav>

        <article className="brain-doc-body">
          <section id="overview">
            <h2>{tt.sectionOverview}</h2>
            <p>{tt.overviewText}</p>
            <div className="brain-doc-types">
              <div className="brain-inner-card">
                <span className="brain-pill purple">{tt.confidential}</span>
                <p>{tt.confidentialText}</p>
              </div>
              <div className="brain-inner-card">
                <span className="brain-pill purple">{tt.public}</span>
                <p>{tt.publicText}</p>
              </div>
            </div>
          </section>

          <section id="flow">
            <h2>{tt.sectionFlow}</h2>
            <ol className="brain-doc-flow">
              {flow.map(([title, desc], index) => (
                <li data-testid="OAuthDocsContent" key={title}>
                  <span className="brain-step-no on">{index + 1}</span>
                  <span>
                    <b>{title}</b>
                    {desc}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section id="endpoints">
            <h2>{tt.sectionEndpoints}</h2>
            <DocTable
              head={[tt.thMethod, tt.thPath, tt.thCaller, tt.thNote]}
              rows={[
                {
                  key: 'authorize',
                  cells: [
                    <Method key="m" value="GET" />,
                    <Mono key="p">{ROUTE_OAUTH_AUTHORIZE}</Mono>,
                    tt.callerBrowser,
                    tt.endpointAuthorize
                  ]
                },
                {
                  key: 'token',
                  cells: [
                    <Method key="m" value="POST" />,
                    <Mono key="p">{ROUTE_OAUTH_TOKEN}</Mono>,
                    tt.callerServer,
                    tt.endpointToken
                  ]
                },
                {
                  key: 'revoke',
                  cells: [
                    <Method key="m" value="POST" />,
                    <Mono key="p">{ROUTE_OAUTH_REVOKE}</Mono>,
                    tt.callerServer,
                    tt.endpointRevoke
                  ]
                },
                {
                  key: 'userinfo',
                  cells: [
                    <Method key="m" value="GET" />,
                    <Mono key="p">{ROUTE_OAUTH_USERINFO}</Mono>,
                    tt.callerServer,
                    tt.endpointUserinfo
                  ]
                }
              ]}
            />
          </section>

          <section id="authorize">
            <h2>{tt.sectionAuthorize}</h2>
            <p>{tt.authorizeText}</p>
            <DocTable
              head={[tt.thParam, tt.thRequired, tt.thNote]}
              rows={[
                ['response_type', required, tt.paramResponseType],
                ['client_id', required, tt.paramClientId],
                ['redirect_uri', required, tt.paramRedirect],
                ['scope', optional, tt.paramScope],
                ['state', optional, tt.paramState],
                [
                  'code_challenge',
                  <span key="pill" className="brain-pill sm purple">
                    {tt.pkceOnly}
                  </span>,
                  tt.paramChallenge
                ]
              ].map(([name, pill, note]) => ({
                key: name as string,
                cells: [<Mono key="n">{name as string}</Mono>, pill, note]
              }))}
            />
            <DocCode
              lang="HTTP"
              source={`**GET** ${ROUTE_OAUTH_AUTHORIZE}
  ?response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback
  &scope=openid%20profile
  &state=RANDOM_STATE
  &code_challenge=CHALLENGE
  &code_challenge_method=S256`}
              {...codeProps}
            />
          </section>

          <section id="token">
            <h2>{tt.sectionToken}</h2>
            <p>{tt.tokenText}</p>
            <BrainTabs
              items={[
                { key: 'code', label: tt.tabCode },
                { key: 'refresh', label: tt.tabRefresh }
              ]}
              value={tokenTab}
              onChange={setTokenTab}
            />
            {tokenTab === 'code' ? (
              <DocCode
                lang="HTTP"
                source={`**POST** ${ROUTE_OAUTH_TOKEN}
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTH_CODE
&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET   %%${tt.commentSecret}%%
&code_verifier=VERIFIER             %%${tt.commentVerifier}%%`}
                {...codeProps}
              />
            ) : (
              <DocCode
                lang="HTTP"
                source={`**POST** ${ROUTE_OAUTH_TOKEN}
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=REFRESH_TOKEN
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET`}
                {...codeProps}
              />
            )}
            <h3>{tt.response}</h3>
            <DocCode
              lang="JSON"
              source={`{
  **"access_token"**: "eyJhbGciOi...",
  **"token_type"**: "Bearer",
  **"expires_in"**: 3600,
  **"refresh_token"**: "def50200...",
  **"scope"**: "openid profile"
}`}
              {...codeProps}
            />
          </section>

          <section id="pkce">
            <h2>{tt.sectionPkce}</h2>
            <p>{tt.pkceText}</p>
            <DocCode
              lang="JavaScript"
              source={`**const** base64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');

**const** verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
**const** challenge = base64url(
  await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
);`}
              {...codeProps}
            />
            <div className="brain-note">
              <InformationCircleIcon />
              <span>{tt.pkceNote}</span>
            </div>
          </section>

          <section id="userinfo">
            <h2>{tt.sectionUserinfo}</h2>
            <p>{tt.userinfoText}</p>
            <DocCode
              lang="HTTP"
              source={`**GET** ${ROUTE_OAUTH_USERINFO}
Authorization: Bearer ACCESS_TOKEN

{
  **"sub"**: "u_8f3k2p",
  **"email"**: "renjie@brain.im",
  **"name"**: "Renjie",
  **"roles"**: ["user"]
}`}
              {...codeProps}
            />
          </section>

          <section id="errors">
            <h2>{tt.sectionErrors}</h2>
            <p>{tt.errorsText}</p>
            <DocTable
              head={[tt.thCode, tt.thWhere, tt.thNote]}
              rows={[
                ['invalid_request', tt.whereAll, tt.errorInvalidRequest],
                [
                  'unauthorized_client',
                  tt.whereAuthorize,
                  tt.errorUnauthorized
                ],
                ['access_denied', tt.whereAuthorize, tt.errorDenied],
                ['invalid_scope', tt.whereAuthorize, tt.errorScope],
                ['invalid_client', tt.whereToken, tt.errorClient],
                ['invalid_grant', tt.whereToken, tt.errorGrant],
                ['invalid_token', tt.whereUserinfo, tt.errorToken]
              ].map(([code, where, note]) => ({
                key: code,
                cells: [<Mono key="c">{code}</Mono>, where, note]
              }))}
            />
          </section>
        </article>
      </div>
    </div>
  );
}
