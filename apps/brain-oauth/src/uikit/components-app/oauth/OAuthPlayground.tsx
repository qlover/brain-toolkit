'use client';

import {
  ArrowPathIcon,
  CheckCircleIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { usePageI18nMapping } from '@qlover/next-kit/client';
import {
  generatePkceVerifier,
  computePkceS256Challenge
} from '@qlover/oauth-wrapper/core';
import { clsx } from 'clsx';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppUserGateway } from '@/impls/AppUserGateway';
import { BrainAvatar } from '@/uikit/components/brain/BrainAvatar';
import { BrainButton } from '@/uikit/components/brain/BrainButton';
import {
  BrainField,
  BrainSelectField
} from '@/uikit/components/brain/BrainField';
import { BrainSwitch } from '@/uikit/components/brain/BrainSwitch';
import { LocaleLink } from '@/uikit/components/LocaleLink';
import {
  OAuthMachineError,
  readAppApiJson,
  readOAuthMachineJson
} from '@/uikit/components-app/developer/apps/readAppApiJson';
import { useIOC } from '@/uikit/hook/useIOC';
import { useUserAuth } from '@/uikit/hook/useUserAuth';
import {
  buildAuthorizeUrl,
  parseOAuthCallbackUrl,
  randomStateValue,
  type OAuthCallbackParams
} from '@/uikit/utils/oauthPlaygroundUtils';
import {
  API_OAUTH_INVALID_REQUEST,
  API_OAUTH_INVALID_SCOPE,
  API_OAUTH_UNSUPPORTED_RESPONSE_TYPE,
  API_REDIRECT_URL
} from '@config/i18n-identifier/api';
import type { OAuthPlaygroundI18nInterface } from '@config/i18n-mapping/oauthPlaygroundI18n';
import { I } from '@config/ioc-identifiter';
import {
  ROUTE_DEVELOPER_APPS,
  ROUTE_OAUTH_TOKEN,
  ROUTE_OAUTH_USERINFO
} from '@config/route';
import type { DialogHandler } from '@qlover/next-kit/client';
import type {
  OAuthClientDetail,
  OAuthClientListItem,
  OAuthAuthorizePageData
} from '@qlover/oauth-wrapper';
import type { ReactNode } from 'react';

type ValidateResult =
  | { valid: true; data: OAuthAuthorizePageData }
  | { valid: false; error: { errorKey: string; message: string } };

type TokenBody = { access_token?: string } & Record<string, unknown>;

const RFC_CODE = /^[a-z_]+$/;

function describeErrorCode(
  tt: OAuthPlaygroundI18nInterface,
  code: string | undefined,
  message: string
): string {
  switch (code) {
    case 'invalid_request':
    case API_OAUTH_INVALID_REQUEST:
      return tt.errInvalidRequest;
    case 'invalid_client':
      return tt.errInvalidClient;
    case 'invalid_grant':
      return tt.errInvalidGrant;
    case 'unauthorized_client':
      return message.includes('redirect_uri')
        ? tt.errRedirect
        : tt.errUnauthorizedClient;
    case API_REDIRECT_URL:
      return tt.errRedirect;
    case 'invalid_scope':
    case API_OAUTH_INVALID_SCOPE:
      return tt.errInvalidScope;
    case 'invalid_token':
      return tt.errInvalidToken;
    case 'unsupported_response_type':
    case 'unsupported_grant_type':
    case API_OAUTH_UNSUPPORTED_RESPONSE_TYPE:
      return tt.errUnsupported;
    case 'access_denied':
      return tt.errAccessDenied;
    case 'server_error':
    case 'temporarily_unavailable':
      return tt.errServer;
    default:
      return tt.errUnknown;
  }
}

function errorCodeOf(error: unknown): string | undefined {
  if (error instanceof OAuthMachineError) return error.code;
  if (error instanceof Error && RFC_CODE.test(error.message)) {
    return error.message;
  }
  return undefined;
}

/** Pretty JSON with keys in bold, like the docs code blocks. */
function JsonCode({ value }: { value: unknown }) {
  const parts = JSON.stringify(value, null, 2).split(
    /("(?:[^"\\]|\\.)*")(?=:)/
  );
  return (
    <pre data-testid="JsonCode" className="brain-code-block wrap">
      {parts.map((part, index) =>
        index % 2 === 1 ? <b key={index}>{part}</b> : part
      )}
    </pre>
  );
}

function PlaygroundStep({
  no,
  current,
  title,
  summary,
  changeLabel,
  onChange,
  children
}: {
  no: number;
  current: number;
  title: string;
  summary?: string;
  changeLabel: string;
  onChange?: () => void;
  children: ReactNode;
}) {
  const done = no < current;
  const active = no === current;

  return (
    <section
      data-testid={`PlaygroundStep-${no}`}
      className={clsx(
        'brain-card flat brain-step',
        done && 'done',
        no > current && 'locked'
      )}
    >
      <div className="brain-step-head">
        <span className={clsx('brain-step-no', active && 'on', done && 'done')}>
          {done ? <CheckIcon /> : no}
        </span>
        <h2>{title}</h2>
        {done && onChange && (
          <button type="button" className="brain-link" onClick={onChange}>
            <PencilSquareIcon />
            {changeLabel}
          </button>
        )}
      </div>
      {done && summary && <div className="brain-step-summary">{summary}</div>}
      {active && <div className="brain-step-body">{children}</div>}
    </section>
  );
}

export function OAuthPlayground() {
  const tt = usePageI18nMapping<OAuthPlaygroundI18nInterface>();
  const locale = useLocale();
  const { success, user } = useUserAuth();
  const userGateway = useIOC(AppUserGateway);
  const dialogHandler = useIOC(I.DialogHandler) as DialogHandler;

  const [clients, setClients] = useState<OAuthClientListItem[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientId, setClientId] = useState<string>();
  const [clientDetail, setClientDetail] = useState<OAuthClientDetail | null>(
    null
  );
  const [redirectUri, setRedirectUri] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [state, setState] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [pkceOptionalEnabled, setPkceOptionalEnabled] = useState(false);
  const [pkceVerifier, setPkceVerifier] = useState('');
  const [pkceChallenge, setPkceChallenge] = useState('');

  const [validateResult, setValidateResult] = useState<ValidateResult | null>(
    null
  );
  const [validating, setValidating] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [callback, setCallback] = useState<OAuthCallbackParams | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenBody, setTokenBody] = useState<TokenBody | null>(null);
  const [userinfoLoading, setUserinfoLoading] = useState(false);
  const [userinfoBody, setUserinfoBody] = useState<unknown>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const zh = locale.startsWith('zh');
  const formatError = useCallback(
    (prefix: string, text: string, code?: string) => {
      const shownCode = code && RFC_CODE.test(code) ? code : undefined;
      const suffix = shownCode
        ? zh
          ? `（${shownCode}）`
          : ` (${shownCode})`
        : '';
      return `${prefix}${zh ? '：' : ': '}${text}${suffix}`;
    },
    [zh]
  );
  const reportError = useCallback(
    (prefix: string, error: unknown) => {
      const code = errorCodeOf(error);
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(
        formatError(prefix, describeErrorCode(tt, code, message), code)
      );
    },
    [formatError, tt]
  );

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pkceRequired = clientDetail != null && !clientDetail.confidential;
  const pkceActive = pkceRequired || pkceOptionalEnabled;

  const resetFrom = useCallback((step: 1 | 2 | 3) => {
    if (step <= 1) setValidateResult(null);
    if (step <= 2) setCallback(null);
    setTokenBody(null);
    setUserinfoBody(null);
  }, []);

  const regeneratePkce = useCallback(async () => {
    const verifier = generatePkceVerifier(64);
    const challenge = await computePkceS256Challenge(verifier);
    setPkceVerifier(verifier);
    setPkceChallenge(challenge);
  }, []);

  useEffect(() => {
    if (!success) return;
    let cancelled = false;
    void (async () => {
      setClientsLoading(true);
      try {
        const list = await readAppApiJson<OAuthClientListItem[]>(
          await fetch('/api/clients', { credentials: 'include' })
        );
        if (cancelled) return;
        setClients(list);
        setClientId((prev) => prev ?? list[0]?.client_id);
      } catch (error) {
        if (!cancelled) reportError(tt.errLoadClients, error);
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [success, reportError, tt.errLoadClients]);

  useEffect(() => {
    if (!clientId || !success) {
      setClientDetail(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const detail = await readAppApiJson<OAuthClientDetail>(
          await fetch(`/api/clients/${encodeURIComponent(clientId)}`, {
            credentials: 'include'
          })
        );
        if (cancelled) return;
        setClientDetail(detail);
        setRedirectUri(detail.redirect_uris[0] ?? '');
        setSelectedScopes([...detail.scopes]);
        setPkceOptionalEnabled(false);
        resetFrom(1);
        if (detail.confidential) {
          setPkceVerifier('');
          setPkceChallenge('');
        } else {
          void regeneratePkce();
        }
      } catch (error) {
        if (!cancelled) reportError(tt.errLoadClients, error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    clientId,
    success,
    regeneratePkce,
    reportError,
    resetFrom,
    tt.errLoadClients
  ]);

  const authorizeUrl = useMemo(() => {
    if (!clientId || !redirectUri) return '';
    return buildAuthorizeUrl(origin, locale, {
      clientId,
      redirectUri,
      scopes: selectedScopes,
      state: state || undefined,
      codeChallenge: pkceActive ? pkceChallenge : undefined,
      codeChallengeMethod: pkceActive ? 'S256' : undefined
    });
  }, [
    clientId,
    redirectUri,
    selectedScopes,
    state,
    origin,
    locale,
    pkceActive,
    pkceChallenge
  ]);

  const scopeParam = selectedScopes.join(' ');
  const pkceParams: {
    code_challenge?: string;
    code_challenge_method?: 'S256';
  } =
    pkceActive && pkceChallenge
      ? { code_challenge: pkceChallenge, code_challenge_method: 'S256' }
      : {};

  const validateParams = async () => {
    if (!clientId || !redirectUri) return;
    setValidating(true);
    setErrorMessage(null);
    resetFrom(1);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri
    });
    if (scopeParam) params.set('scope', scopeParam);
    if (state.trim()) params.set('state', state.trim());
    if (pkceParams.code_challenge) {
      params.set('code_challenge', pkceParams.code_challenge);
      params.set('code_challenge_method', 'S256');
    }

    try {
      const result = await readAppApiJson<ValidateResult>(
        await fetch(`/api/oauth/playground/validate?${params.toString()}`, {
          credentials: 'include'
        })
      );
      if (result.valid) {
        setValidateResult(result);
      } else {
        const { errorKey, message } = result.error;
        setErrorMessage(
          formatError(
            tt.errValidate,
            describeErrorCode(tt, errorKey, message),
            errorKey
          )
        );
      }
    } catch (error) {
      reportError(tt.errValidate, error);
    } finally {
      setValidating(false);
    }
  };

  const submitConsent = async (action: 'allow' | 'deny') => {
    if (!clientId || !redirectUri) return;
    setConsentLoading(true);
    setErrorMessage(null);
    resetFrom(2);
    try {
      const redirectUrl = await userGateway.submitOAuthConsent({
        action,
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopeParam || undefined,
        state: state.trim() || undefined,
        ...pkceParams
      });
      setCallback(parseOAuthCallbackUrl(redirectUrl));
    } catch (error) {
      reportError(tt.errConsent, error);
    } finally {
      setConsentLoading(false);
    }
  };

  const exchangeToken = async () => {
    if (!callback?.code || !clientId || !redirectUri) return;
    setTokenLoading(true);
    setErrorMessage(null);
    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: callback.code,
        redirect_uri: redirectUri,
        client_id: clientId
      });
      if (pkceActive) {
        body.set('code_verifier', pkceVerifier.trim());
      } else {
        body.set('client_secret', clientSecret.trim());
      }
      const res = await fetch(ROUTE_OAUTH_TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      });
      setTokenBody(await readOAuthMachineJson<TokenBody>(res));
    } catch (error) {
      reportError(tt.errToken, error);
    } finally {
      setTokenLoading(false);
    }
  };

  const fetchUserinfo = async () => {
    if (!tokenBody?.access_token) return;
    setUserinfoLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(ROUTE_OAUTH_USERINFO, {
        headers: { Authorization: `Bearer ${tokenBody.access_token}` }
      });
      setUserinfoBody(await readOAuthMachineJson(res));
    } catch (error) {
      reportError(tt.errUserinfo, error);
    } finally {
      setUserinfoLoading(false);
    }
  };

  const copyAuthorizeUrl = async () => {
    try {
      await navigator.clipboard.writeText(authorizeUrl);
      dialogHandler.success(tt.copied);
    } catch {
      // clipboard permission denied; nothing useful to report
    }
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
    resetFrom(1);
  };

  const current = !validateResult?.valid
    ? 1
    : !callback
      ? 2
      : !tokenBody
        ? 3
        : 4;
  const denied = Boolean(callback?.error);
  const displayName = user?.name || user?.email || user?.phone || '';
  const clientSummary = clientDetail
    ? [
        clientDetail.client_name,
        clientDetail.confidential ? tt.confidential : tt.public,
        pkceActive ? 'PKCE' : null
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <div data-testid="OAuthPlayground" className="brain-content brain-pg">
      <h1 className="brain-title">{tt.title}</h1>
      <p className="brain-desc">{tt.desc}</p>

      {errorMessage && (
        <div className="brain-note danger brain-pg-error" role="alert">
          <ExclamationTriangleIcon />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            aria-label={tt.close}
            title={tt.close}
            onClick={() => setErrorMessage(null)}
          >
            <XMarkIcon />
          </button>
        </div>
      )}

      {user && (
        <div className="brain-inner-card brain-pg-account">
          <div className="brain-who">
            <BrainAvatar name={displayName} size="sm" />
            <div>
              <div className="brain-name">{user.email || displayName}</div>
              <div className="brain-sub">{tt.accountSub}</div>
            </div>
          </div>
          <span className="brain-pill ok">{tt.signedIn}</span>
        </div>
      )}

      <div className="brain-pg-steps">
        <PlaygroundStep
          no={1}
          current={current}
          title={tt.stepClient}
          summary={clientSummary}
          changeLabel={tt.change}
          onChange={() => resetFrom(1)}
        >
          {!clientsLoading && clients.length === 0 ? (
            <div className="brain-note">
              <InformationCircleIcon />
              <span className="flex-1">{tt.noClients}</span>
              <LocaleLink
                href={ROUTE_DEVELOPER_APPS}
                title={tt.goConsole}
                className="brain-link"
              >
                {tt.goConsole}
              </LocaleLink>
            </div>
          ) : (
            <>
              <div className="brain-pg-row">
                <BrainSelectField
                  id="playground-client"
                  label={tt.clientLabel}
                  disabled={clientsLoading}
                  value={clientId ?? ''}
                  onChange={(e) => setClientId(e.target.value)}
                >
                  {clients.map((c) => (
                    <option
                      data-testid="OAuthPlayground"
                      key={c.client_id}
                      value={c.client_id}
                    >
                      {c.client_name} ({c.client_id})
                    </option>
                  ))}
                </BrainSelectField>
                <BrainSelectField
                  id="playground-redirect"
                  label="redirect_uri"
                  value={redirectUri}
                  onChange={(e) => {
                    setRedirectUri(e.target.value);
                    resetFrom(1);
                  }}
                >
                  {clientDetail?.redirect_uris.map((uri) => (
                    <option data-testid="OAuthPlayground" key={uri} value={uri}>
                      {uri}
                    </option>
                  ))}
                </BrainSelectField>
              </div>

              <div className="brain-pg-block">
                <span className="brain-pg-label">scope</span>
                <div className="brain-chips">
                  {clientDetail?.scopes.map((scope) => {
                    const on = selectedScopes.includes(scope);
                    return (
                      <button
                        data-testid="OAuthPlayground"
                        key={scope}
                        type="button"
                        className="brain-chip toggle mono"
                        aria-pressed={on}
                        onClick={() => toggleScope(scope)}
                      >
                        {on && <CheckIcon />}
                        {scope}
                      </button>
                    );
                  })}
                </div>
              </div>

              <BrainField
                id="playground-state"
                label="state"
                value={state}
                placeholder={tt.optional}
                onChange={(e) => {
                  setState(e.target.value);
                  resetFrom(1);
                }}
                action={
                  <button
                    type="button"
                    className="brain-field-action"
                    onClick={() => {
                      setState(randomStateValue());
                      resetFrom(1);
                    }}
                  >
                    {tt.random}
                  </button>
                }
              />

              {clientDetail && (
                <div className="brain-inner-card brain-pg-pkce">
                  <div className="brain-row">
                    <span className="brain-pg-pkce-title">
                      PKCE
                      {pkceRequired && (
                        <span className="brain-pill purple sm">
                          {tt.pkceRequired}
                        </span>
                      )}
                    </span>
                    {!pkceRequired && (
                      <label className="brain-pg-switch">
                        <span className="brain-sub">{tt.pkceOptional}</span>
                        <BrainSwitch
                          checked={pkceOptionalEnabled}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            setPkceOptionalEnabled(enabled);
                            resetFrom(1);
                            if (enabled) {
                              void regeneratePkce();
                            } else {
                              setPkceVerifier('');
                              setPkceChallenge('');
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {pkceActive && (
                    <>
                      <div className="brain-pg-kv">
                        <span>code_verifier</span>
                        <span className="brain-code">{pkceVerifier}</span>
                        <span>code_challenge</span>
                        <span className="brain-code">{pkceChallenge}</span>
                      </div>
                      <button
                        type="button"
                        className="brain-link"
                        onClick={() => {
                          void regeneratePkce();
                          resetFrom(1);
                        }}
                      >
                        <ArrowPathIcon />
                        {tt.regen}
                      </button>
                    </>
                  )}
                </div>
              )}

              <BrainButton
                size="sm"
                auto
                loading={validating}
                disabled={!clientDetail || (pkceActive && !pkceChallenge)}
                onClick={() => void validateParams()}
              >
                {tt.validate}
              </BrainButton>
            </>
          )}
        </PlaygroundStep>

        <PlaygroundStep
          no={2}
          current={current}
          title={tt.stepConsent}
          summary={denied ? tt.summaryDenied : tt.summaryAllowed}
          changeLabel={tt.change}
          onChange={() => resetFrom(2)}
        >
          <div className="brain-note brain-pg-block">
            <CheckCircleIcon />
            <span>{tt.validOk}</span>
          </div>
          <span className="brain-pg-label">{tt.authUrl}</span>
          <div className="brain-doc-code brain-pg-block">
            <button
              type="button"
              className="brain-doc-code-copy"
              aria-label={tt.copy}
              title={tt.copy}
              onClick={() => void copyAuthorizeUrl()}
            >
              <ClipboardDocumentIcon />
            </button>
            <pre className="brain-code-block wrap brain-pg-url">
              {authorizeUrl}
            </pre>
          </div>
          <div className="brain-inner-card brain-pg-consent">
            <BrainAvatar
              name={clientDetail?.client_name}
              src={clientDetail?.logo_uri}
              size="sm"
            />
            <div>
              <div className="brain-name">{clientDetail?.client_name}</div>
              <div className="brain-sub">{tt.consentSub}</div>
            </div>
            <div className="brain-chips">
              {selectedScopes.map((scope) => (
                <span
                  data-testid="OAuthPlayground"
                  key={scope}
                  className="brain-chip toggle mono"
                >
                  {scope}
                </span>
              ))}
            </div>
          </div>
          <div className="brain-pg-actions">
            <BrainButton
              variant="ghost"
              size="sm"
              auto
              disabled={consentLoading}
              onClick={() => void submitConsent('deny')}
            >
              {tt.deny}
            </BrainButton>
            <BrainButton
              size="sm"
              auto
              loading={consentLoading}
              onClick={() => void submitConsent('allow')}
            >
              {tt.allow}
            </BrainButton>
          </div>
        </PlaygroundStep>

        <PlaygroundStep
          no={3}
          current={current}
          title={tt.stepToken}
          summary={tt.summaryToken}
          changeLabel={tt.change}
        >
          <span className="brain-pg-label">{tt.callback}</span>
          <div className="brain-pg-block">
            <JsonCode value={callback} />
          </div>
          {denied ? (
            <div className="brain-note danger">
              <ExclamationTriangleIcon />
              <span>{tt.deniedNote}</span>
            </div>
          ) : (
            <>
              {pkceActive ? (
                <div className="brain-note brain-pg-block">
                  <InformationCircleIcon />
                  <span>{tt.verifierNote}</span>
                </div>
              ) : (
                <BrainField
                  id="playground-secret"
                  label="client_secret"
                  type="password"
                  autoComplete="off"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              )}
              <BrainButton
                size="sm"
                auto
                loading={tokenLoading}
                disabled={pkceActive ? !pkceVerifier : !clientSecret.trim()}
                onClick={() => void exchangeToken()}
              >
                {tt.exchange}
              </BrainButton>
            </>
          )}
        </PlaygroundStep>

        <PlaygroundStep
          no={4}
          current={current}
          title={tt.stepUserinfo}
          changeLabel={tt.change}
        >
          <span className="brain-pg-label">{tt.tokenResp}</span>
          <div className="brain-pg-block">
            <JsonCode value={tokenBody} />
          </div>
          <BrainButton
            size="sm"
            auto
            loading={userinfoLoading}
            disabled={!tokenBody?.access_token}
            onClick={() => void fetchUserinfo()}
          >
            {tt.fetchUser}
          </BrainButton>
          {userinfoBody != null && (
            <div className="brain-pg-result">
              <span className="brain-pg-label">{tt.userResp}</span>
              <JsonCode value={userinfoBody} />
              <div className="brain-note">
                <CheckCircleIcon />
                <span>{tt.allDone}</span>
              </div>
            </div>
          )}
        </PlaygroundStep>
      </div>

      <div className="brain-note warn brain-pg-foot">
        <InformationCircleIcon />
        <span>{tt.footNote}</span>
      </div>
    </div>
  );
}
