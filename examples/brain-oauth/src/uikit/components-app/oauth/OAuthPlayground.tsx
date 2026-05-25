'use client';

import {
  CheckCircleOutlined,
  CopyOutlined,
  ExperimentOutlined,
  LoadingOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Alert, Button, Card, Checkbox, Input, Select, Steps, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocale } from '@/i18n/routing';
import { usePageI18nMapping } from '@/uikit/context/PageI18nContext';
import { useUserAuth } from '@/uikit/hook/useUserAuth';
import { useIOC } from '@/uikit/hook/useIOC';
import { OAuthConsentGateway } from '@/impls/OAuthConsentGateway';
import type { OAuthPlaygroundI18nInterface } from '@config/i18n-mapping/oauthPlaygroundI18n';
import type {
  OAuthClientDetail,
  OAuthClientListItem
} from '@schemas/oauth/OAuthAuthorizeSchema';
import type { OAuthAuthorizePageData } from '@server/services/OAuthAuthorizeService';
import { ROUTE_LOGIN, ROUTE_OAUTH_TOKEN, ROUTE_USERINFO } from '@config/route';
import { readAppApiJson } from '@/pages/[locale]/developer/apps/readAppApiJson';
import {
  buildAuthorizeUrl,
  parseOAuthCallbackUrl,
  randomStateValue,
  type OAuthCallbackParams
} from '@/uikit/utils/oauthPlaygroundUtils';

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-elevated border border-primary-border p-3 text-xs text-primary-text">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

type ValidateResult =
  | { valid: true; data: OAuthAuthorizePageData }
  | { valid: false; error: { errorKey: string; message: string } };

export function OAuthPlayground() {
  const tt = usePageI18nMapping<OAuthPlaygroundI18nInterface>();
  const locale = useLocale();
  const { success, loading: authLoading, user } = useUserAuth();
  const consentGateway = useIOC(OAuthConsentGateway);

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

  const [validateResult, setValidateResult] = useState<ValidateResult | null>(
    null
  );
  const [validating, setValidating] = useState(false);

  const [consentLoading, setConsentLoading] = useState(false);
  const [callback, setCallback] = useState<OAuthCallbackParams | null>(null);
  const [redirectPreview, setRedirectPreview] = useState<string | null>(null);

  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenResponse, setTokenResponse] = useState<unknown>(null);

  const [userinfoLoading, setUserinfoLoading] = useState(false);
  const [userinfoResponse, setUserinfoResponse] = useState<unknown>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const loadClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      const list = await readAppApiJson<OAuthClientListItem[]>(
        await fetch('/api/clients', { credentials: 'include' })
      );
      setClients(list);
      if (list.length > 0 && !clientId) {
        setClientId(list[0].client_id);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setClientsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (success) {
      void loadClients();
    }
  }, [success, loadClients]);

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
        setValidateResult(null);
        setCallback(null);
        setTokenResponse(null);
        setUserinfoResponse(null);
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Failed to load client'
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId, success]);

  const authorizeUrl = useMemo(() => {
    if (!clientId || !redirectUri) return '';
    return buildAuthorizeUrl(origin, locale, {
      clientId,
      redirectUri,
      scopes: selectedScopes,
      state: state || undefined
    });
  }, [clientId, redirectUri, selectedScopes, state, origin, locale]);

  const scopeParam = selectedScopes.join(' ');

  const validateParams = useCallback(async () => {
    if (!clientId || !redirectUri) return;
    setValidating(true);
    setErrorMessage(null);
    setValidateResult(null);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri
    });
    if (scopeParam) params.set('scope', scopeParam);
    if (state.trim()) params.set('state', state.trim());

    try {
      const result = await readAppApiJson<ValidateResult>(
        await fetch(`/api/oauth/playground/validate?${params.toString()}`, {
          credentials: 'include'
        })
      );
      setValidateResult(result);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setValidating(false);
    }
  }, [clientId, redirectUri, scopeParam, state]);

  const submitConsent = useCallback(
    async (action: 'allow' | 'deny') => {
      if (!clientId || !redirectUri) return;
      setConsentLoading(true);
      setErrorMessage(null);
      setCallback(null);
      setRedirectPreview(null);
      setTokenResponse(null);
      setUserinfoResponse(null);

      try {
        const redirectUrl = await consentGateway.submit({
          action,
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: scopeParam || undefined,
          state: state.trim() || undefined
        });
        setRedirectPreview(redirectUrl);
        setCallback(parseOAuthCallbackUrl(redirectUrl));
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Consent submission failed'
        );
      } finally {
        setConsentLoading(false);
      }
    },
    [clientId, redirectUri, scopeParam, state, consentGateway]
  );

  const exchangeToken = useCallback(async () => {
    if (!callback?.code || !clientId || !redirectUri || !clientSecret.trim()) {
      setErrorMessage('Authorization code and client_secret are required');
      return;
    }
    setTokenLoading(true);
    setErrorMessage(null);
    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: callback.code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret.trim()
      });
      const res = await fetch(ROUTE_OAUTH_TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      });
      const json = await res.json();
      setTokenResponse({ status: res.status, body: json });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Token exchange failed');
    } finally {
      setTokenLoading(false);
    }
  }, [callback, clientId, redirectUri, clientSecret]);

  const fetchUserinfo = useCallback(async () => {
    const accessToken =
      tokenResponse &&
      typeof tokenResponse === 'object' &&
      tokenResponse !== null &&
      'body' in tokenResponse &&
      typeof (tokenResponse as { body: unknown }).body === 'object' &&
      (tokenResponse as { body: { access_token?: string } }).body?.access_token;

    if (!accessToken) {
      setErrorMessage('No access_token in token response');
      return;
    }

    setUserinfoLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(ROUTE_USERINFO, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const json = await res.json();
      setUserinfoResponse({ status: res.status, body: json });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Userinfo failed');
    } finally {
      setUserinfoLoading(false);
    }
  }, [tokenResponse]);

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const currentStep = useMemo(() => {
    if (userinfoResponse) return 4;
    if (tokenResponse) return 3;
    if (callback) return 2;
    if (validateResult?.valid) return 1;
    return 0;
  }, [validateResult, callback, tokenResponse, userinfoResponse]);

  const stepItems = [
    { title: tt.stepSession },
    { title: tt.stepClient },
    { title: tt.stepAuthorize },
    { title: tt.stepToken },
    { title: tt.stepUserinfo }
  ];

  return (
    <div
      data-testid="OAuthPlayground"
      className="max-w-4xl mx-auto w-full px-4 py-8 space-y-6"
    >
      <div className="flex items-start gap-3">
        <ExperimentOutlined className="text-2xl text-brand mt-1" />
        <div>
          <Typography.Title level={3} className="!mb-1 !text-primary-text">
            {tt.title}
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 text-secondary-text">
            {tt.intro}
          </Typography.Paragraph>
        </div>
      </div>

      <Steps current={currentStep} items={stepItems} size="small" />

      {errorMessage && (
        <Alert type="error" showIcon message={errorMessage} closable onClose={() => setErrorMessage(null)} />
      )}

      <Card title={tt.stepSession} size="small">
        {authLoading ? (
          <LoadingOutlined spin />
        ) : success && user ? (
          <p className="text-primary-text">
            <CheckCircleOutlined className="text-green-500 mr-2" />
            {tt.signedInAs}{' '}
            <strong>{user.email ?? user.name}</strong>
          </p>
        ) : (
          <Alert
            type="warning"
            showIcon
            message={tt.loginRequired}
            action={
              <Link href={ROUTE_LOGIN}>
                <Button size="small" type="primary">
                  {tt.goLogin}
                </Button>
              </Link>
            }
          />
        )}
      </Card>

      <Card
        title={tt.stepClient}
        size="small"
        extra={
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => void loadClients()}
            disabled={!success || clientsLoading}
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-secondary-text mb-1">
              {tt.clientLabel}
            </label>
            <Select
              className="w-full"
              loading={clientsLoading}
              disabled={!success}
              value={clientId}
              onChange={setClientId}
              options={clients.map((c) => ({
                value: c.client_id,
                label: `${c.client_name} (${c.client_id})`
              }))}
              placeholder="Select a registered client"
            />
          </div>

          {clientDetail && (
            <>
              <div>
                <label className="block text-sm text-secondary-text mb-1">
                  {tt.redirectLabel}
                </label>
                <Select
                  className="w-full"
                  value={redirectUri}
                  onChange={setRedirectUri}
                  options={clientDetail.redirect_uris.map((uri) => ({
                    value: uri,
                    label: uri
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm text-secondary-text mb-1">
                  {tt.scopeLabel}
                </label>
                <Checkbox.Group
                  className="flex flex-col gap-1"
                  value={selectedScopes}
                  onChange={(values) => setSelectedScopes(values as string[])}
                  options={clientDetail.scopes.map((scope) => ({
                    label: scope,
                    value: scope
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm text-secondary-text mb-1">
                  {tt.stateLabel}
                </label>
                <div className="flex gap-2">
                  <Input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="optional"
                  />
                  <Button onClick={() => setState(randomStateValue())}>
                    {tt.randomState}
                  </Button>
                </div>
              </div>

              <Button
                type="default"
                loading={validating}
                disabled={!success}
                onClick={() => void validateParams()}
              >
                {tt.validate}
              </Button>

              {validateResult?.valid && (
                <Alert type="success" showIcon message={tt.validOk} />
              )}
              {validateResult && !validateResult.valid && (
                <Alert
                  type="error"
                  showIcon
                  message={validateResult.error.message}
                  description={validateResult.error.errorKey}
                />
              )}

              {authorizeUrl && (
                <div>
                  <label className="block text-sm text-secondary-text mb-1">
                    {tt.authorizeUrl}
                  </label>
                  <div className="flex gap-2">
                    <Input.TextArea
                      value={authorizeUrl}
                      readOnly
                      autoSize={{ minRows: 2, maxRows: 4 }}
                    />
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => void copyText(authorizeUrl)}
                      title={tt.copy}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <Card title={tt.stepAuthorize} size="small">
        <p className="text-sm text-secondary-text mb-3">
          {validateResult?.valid
            ? `${tt.stepAuthorize}: ${validateResult.data.clientName}`
            : tt.validate}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="primary"
            disabled={!success || !validateResult?.valid || consentLoading}
            loading={consentLoading}
            onClick={() => void submitConsent('allow')}
          >
            {tt.allow}
          </Button>
          <Button
            disabled={!success || !validateResult?.valid || consentLoading}
            loading={consentLoading}
            onClick={() => void submitConsent('deny')}
          >
            {tt.deny}
          </Button>
        </div>

        {redirectPreview && (
          <div className="mt-4">
            <Typography.Text type="secondary">{tt.callback}</Typography.Text>
            <Input.TextArea
              className="mt-1 font-mono text-xs"
              value={redirectPreview}
              readOnly
              autoSize={{ minRows: 2, maxRows: 3 }}
            />
            {callback && <JsonBlock value={callback} />}
          </div>
        )}
      </Card>

      <Card title={tt.stepToken} size="small">
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-secondary-text mb-1">
              {tt.secretLabel}
            </label>
            <Input.Password
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="client_secret"
              autoComplete="off"
            />
          </div>
          <Button
            type="primary"
            disabled={!callback?.code || !clientSecret.trim()}
            loading={tokenLoading}
            onClick={() => void exchangeToken()}
          >
            {tt.exchange}
          </Button>
          {tokenResponse != null && (
            <>
              <Typography.Text type="secondary">{tt.response}</Typography.Text>
              <JsonBlock value={tokenResponse} />
            </>
          )}
        </div>
      </Card>

      <Card title={tt.stepUserinfo} size="small">
        <Button
          type="primary"
          disabled={
            !tokenResponse ||
            !(
              typeof tokenResponse === 'object' &&
              tokenResponse !== null &&
              'body' in tokenResponse &&
              (tokenResponse as { body: { access_token?: string } }).body
                ?.access_token
            )
          }
          loading={userinfoLoading}
          onClick={() => void fetchUserinfo()}
        >
          {tt.fetchUserinfo}
        </Button>
        {userinfoResponse != null && (
          <>
            <Typography.Text type="secondary" className="block mt-3">
              {tt.response}
            </Typography.Text>
            <JsonBlock value={userinfoResponse} />
          </>
        )}
      </Card>
    </div>
  );
}
