import { ExecutorError } from '@qlover/fe-corekit/executor';
import { RequestLogsRepository } from '@qlover/next-kit/server';
import { isEmpty } from 'lodash-es';
import { inject, injectable } from '@shared/container';
import {
  API_NOT_AUTHORIZED,
  API_OAUTH_WRAPPER_AUTH_FAILED,
  API_REQUEST_BODY_EMPTY
} from '@config/i18n-identifier/api';
import { ROUTE_PAMENV_DEVICE } from '@config/route';
import {
  PamCliDeviceApproveRequestSchema,
  PamCliDeviceTokenRequestSchema,
  PamCliTokenRequestSchema,
  type PamCliDeviceCodeResponse,
  type PamCliTokenResponse
} from '@schemas/PamCliSchema';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { ServerConfig } from '@server/ServerConfig';
import { OAuthUserService } from '@server/services/OAuthUserService';
import {
  PamCliDeviceCodeStore,
  PamCliDeviceStatus
} from '@server/services/PamCliDeviceCodeStore';
import { PamCliTokenService } from '@server/services/PamCliTokenService';
import type { UserSchema } from '@qlover/next-kit/common';
import type { NextRequest } from 'next/server';

/**
 * Poll error codes for CLI device login (RFC 8628-inspired).
 */
export const PamCliDevicePollError = {
  AuthorizationPending: 'authorization_pending',
  ExpiredToken: 'expired_token',
  AccessDenied: 'access_denied',
  SlowDown: 'slow_down'
} as const;

/**
 * CLI authentication controller.
 *
 * Significance: Issues PAM CLI bearer tokens for headless clients.
 * Core idea: Password login or browser device-code approve → CLI JWT.
 * Main function: Create CLI tokens and audit login events.
 * Main purpose: Power `pam login` with browser-first UX.
 *
 * @example
 * const data = await controller.createToken(request);
 */
@injectable()
export class PamCliController {
  @inject(OAuthUserService)
  protected oauthUserService!: OAuthUserService;

  @inject(PamCliTokenService)
  protected cliTokenService!: PamCliTokenService;

  @inject(RequestLogsRepository)
  protected requestLogsRepository!: RequestLogsRepository;

  @inject(ServerConfig)
  protected serverConfig!: SeedServerConfigInterface;

  /**
   * Creates a CLI bearer token from email/password credentials.
   *
   * @param request - Incoming request with `{ email, password }`
   * @returns Token payload for pam-cli
   */
  public async createToken(request: NextRequest): Promise<PamCliTokenResponse> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }

    if (isEmpty(body)) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }

    const parsed = PamCliTokenRequestSchema.parse(body);

    let user;
    try {
      user = await this.oauthUserService.login({
        email: parsed.email,
        password: parsed.password,
        loginContext: {
          userAgent: request.headers.get('user-agent'),
          ipAddress:
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            null
        }
      });
    } catch (error) {
      if (error instanceof ExecutorError) {
        throw error;
      }
      throw new ExecutorError(API_OAUTH_WRAPPER_AUTH_FAILED, error);
    }

    if (!user) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    return this.issueTokenForUser(user, request, 'password');
  }

  /**
   * Starts a browser device authorization for CLI login.
   *
   * @param request - Used to derive verification origin (local vs SITE_URL)
   * @returns Device/user codes and verification URLs
   */
  public createDeviceCode(request: NextRequest): PamCliDeviceCodeResponse {
    const record = PamCliDeviceCodeStore.create();
    const origin = this.resolvePublicOrigin(request);
    const verificationUri = `${origin}${ROUTE_PAMENV_DEVICE}`;
    const verificationUriComplete = `${verificationUri}?user_code=${encodeURIComponent(record.userCode)}`;

    return {
      device_code: record.deviceCode,
      user_code: record.userCode,
      verification_uri: verificationUri,
      verification_uri_complete: verificationUriComplete,
      expires_in: Math.floor((record.expiresAt - Date.now()) / 1000),
      interval: record.intervalSeconds
    };
  }

  /**
   * Prefers the incoming request origin so local CLI testing opens localhost.
   *
   * @param request - Incoming device-code request
   */
  protected resolvePublicOrigin(request: NextRequest): string {
    try {
      if (request.nextUrl?.origin) {
        return request.nextUrl.origin.replace(/\/+$/, '');
      }
    } catch {
      // fall through
    }
    return this.serverConfig.siteUrl.replace(/\/+$/, '');
  }

  /**
   * Approves a pending device code using the browser session user.
   *
   * @param request - Body `{ user_code }`
   */
  public async approveDeviceCode(
    request: NextRequest
  ): Promise<{ user_code: string; email?: string }> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }

    const parsed = PamCliDeviceApproveRequestSchema.parse(body);
    const user = await this.oauthUserService.getUser(true);
    if (!user) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const tokenResponse = await this.issueTokenForUser(
      user,
      request,
      'browser'
    );

    try {
      PamCliDeviceCodeStore.approve(
        parsed.user_code,
        user,
        tokenResponse,
        parsed.locale
      );
    } catch {
      throw new ExecutorError(
        API_OAUTH_WRAPPER_AUTH_FAILED,
        'Device code is invalid or expired'
      );
    }

    return {
      user_code: parsed.user_code.trim().toUpperCase(),
      email: user.email
    };
  }

  /**
   * CLI polls for an approved device authorization.
   *
   * @param request - Body `{ device_code }`
   * @returns Token when approved; throws pending/expired errors otherwise
   */
  public async pollDeviceToken(
    request: NextRequest
  ): Promise<PamCliTokenResponse> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }

    const parsed = PamCliDeviceTokenRequestSchema.parse(body);
    const record = PamCliDeviceCodeStore.getByDeviceCode(parsed.device_code);

    if (!record) {
      throw new ExecutorError(PamCliDevicePollError.ExpiredToken);
    }

    if (record.status === PamCliDeviceStatus.Pending) {
      throw new ExecutorError(PamCliDevicePollError.AuthorizationPending);
    }

    if (record.status === PamCliDeviceStatus.Denied) {
      throw new ExecutorError(PamCliDevicePollError.AccessDenied);
    }

    const token = PamCliDeviceCodeStore.consumeApproved(parsed.device_code);
    if (!token) {
      throw new ExecutorError(PamCliDevicePollError.ExpiredToken);
    }

    return token;
  }

  protected async issueTokenForUser(
    user: UserSchema,
    request: NextRequest,
    loginMethod: string
  ): Promise<PamCliTokenResponse> {
    const issued = await this.cliTokenService.createToken(user, {
      loginMethod,
      userAgent: request.headers.get('user-agent'),
      ipAddress:
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    });

    await this.requestLogsRepository.insertWithAuth({
      event_type: 'pam.cli.token',
      auth_provider: 'pam-cli',
      userAgent: request.headers.get('user-agent'),
      ipAddress:
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      login_method: loginMethod
    });

    return {
      token: issued.token,
      expiresAt: issued.expiresAt,
      user: {
        id: user.id,
        email: user.email
      }
    };
  }

  /**
   * Revokes the current CLI bearer token (`jti` allowlist).
   *
   * @param request - Must include `Authorization: Bearer …`
   */
  public async logout(request: NextRequest): Promise<{ revoked: boolean }> {
    const authorization = request.headers.get('authorization');
    if (!authorization?.toLowerCase().startsWith('bearer ')) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const token = authorization.slice('bearer '.length).trim();
    if (!token) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const session = await this.cliTokenService.verifyToken(token);
    if (!session) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    // Audit while the bearer is still active (ServerAuthPlugin / insertWithAuth).
    await this.requestLogsRepository.insertWithAuth({
      event_type: 'pam.cli.logout',
      auth_provider: 'pam-cli',
      userAgent: request.headers.get('user-agent'),
      ipAddress:
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      login_method: 'logout'
    });

    const revoked = await this.cliTokenService.revokeBearerToken(token);
    return { revoked };
  }
}
