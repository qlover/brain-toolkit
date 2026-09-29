import type { OAuthConsentDeviceContext } from './consentDevice';
import type {
  OAuthConsentGrantRepository,
  OAuthConsentGrantRow
} from './OAuthConsentGrantRepository';

/** Default lifetime of "trust this app" on one device. */
export const OAUTH_CONSENT_GRANT_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/** Subset of oauth-wrapper `OAuthAuthorizePageData` needed to re-issue a code. */
export type OAuthTrustAuthorizeRequest = {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
};

/** Consent body accepted by oauth-wrapper `processConsent`. */
export type OAuthTrustConsentBody = {
  action: 'allow';
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
};

export interface OAuthConsentTrustLogger {
  warn(...args: unknown[]): void;
}

type TrustedAllowBody = {
  client_id: string;
  scopes: string[];
};

export function isConsentGrantActive(grant: OAuthConsentGrantRow): boolean {
  return new Date(grant.expires_at).getTime() > Date.now();
}

/** `action: 'allow'` with `trust: true` (the user ticked "trust this app"). */
export function isTrustedAllow(requestBody: unknown): boolean {
  return readTrustedAllow(requestBody) != null;
}

function readTrustedAllow(requestBody: unknown): TrustedAllowBody | null {
  if (!requestBody || typeof requestBody !== 'object') {
    return null;
  }
  const body = requestBody as Record<string, unknown>;
  if (body.action !== 'allow' || body.trust !== true) {
    return null;
  }
  const clientId =
    typeof body.client_id === 'string' ? body.client_id.trim() : '';
  if (!clientId) {
    return null;
  }
  const scope = typeof body.scope === 'string' ? body.scope : '';
  return { client_id: clientId, scopes: scope.split(/\s+/).filter(Boolean) };
}

/**
 * "Trust this app on this device": remembers consent per user + client +
 * device and re-issues codes without the consent page while it is active.
 */
export class OAuthConsentTrustService {
  constructor(
    protected readonly repo: OAuthConsentGrantRepository,
    protected readonly logger: OAuthConsentTrustLogger,
    protected readonly ttlMs: number = OAUTH_CONSENT_GRANT_TTL_MS
  ) {}

  /**
   * Call after a successful consent. No-op unless the body is a trusted
   * allow and a device id exists; failures are logged, never thrown.
   */
  public async remember(
    userId: string,
    requestBody: unknown,
    device?: OAuthConsentDeviceContext
  ): Promise<void> {
    const deviceId = device?.deviceId?.trim();
    const body = readTrustedAllow(requestBody);
    if (!userId || !deviceId || !body) {
      return;
    }

    try {
      const existing = await this.repo.find(userId, body.client_id, deviceId);
      const keptScopes =
        existing && isConsentGrantActive(existing) ? existing.scopes : [];
      await this.repo.upsert({
        user_id: userId,
        client_id: body.client_id,
        device_id: deviceId,
        scopes: Array.from(new Set([...keptScopes, ...body.scopes])),
        expires_at: new Date(Date.now() + this.ttlMs).toISOString(),
        user_agent: device?.userAgent ?? null
      });
    } catch (error) {
      this.logger.warn('Failed to remember OAuth consent grant', {
        userId,
        clientId: body.client_id,
        error
      });
    }
  }

  /**
   * Issues a code via `issue` when an active grant covers every requested
   * scope on this device; otherwise returns `null` (show the consent page).
   */
  public async tryAuto<T>(
    userId: string,
    data: OAuthTrustAuthorizeRequest,
    device: OAuthConsentDeviceContext | undefined,
    issue: (body: OAuthTrustConsentBody) => Promise<T>
  ): Promise<T | null> {
    const deviceId = device?.deviceId?.trim();
    if (!userId || !deviceId) {
      return null;
    }

    const grant = await this.repo.find(userId, data.clientId, deviceId);
    if (
      !grant ||
      !isConsentGrantActive(grant) ||
      !data.scopes.every((scope) => grant.scopes.includes(scope))
    ) {
      return null;
    }

    const result = await issue({
      action: 'allow',
      client_id: data.clientId,
      redirect_uri: data.redirectUri,
      scope: data.scopes.join(' ') || undefined,
      state: data.state,
      code_challenge: data.codeChallenge,
      code_challenge_method: data.codeChallengeMethod
    });

    try {
      await this.repo.touch(userId, data.clientId, deviceId);
    } catch (error) {
      this.logger.warn('Failed to touch OAuth consent grant', {
        userId,
        clientId: data.clientId,
        error
      });
    }
    return result;
  }
}
