import { randomUUID } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { inject, injectable } from '@shared/container';
import { PAM_SITE_SETTING_KEYS } from '@config/pamSiteSettings';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { PamCliTokenRepo } from '@server/repositorys/PamCliTokenRepo';
import { ServerConfig } from '@server/ServerConfig';
import { SiteSettingsService } from '@server/services/SiteSettingsService';
import type { UserSchema } from '@qlover/next-kit/common';
import type {
  OAuthSessionPayload,
  WithUserSession
} from '@qlover/oauth-wrapper';

/** JWT `typ` claim for PAM CLI bearer tokens. */
export const PAM_CLI_TOKEN_TYP = 'pam_cli' as const;

/** JWT `aud` claim for PAM CLI bearer tokens. */
export const PAM_CLI_TOKEN_AUD = 'pamenv' as const;

/**
 * CLI bearer token payload (compatible with session user resolution).
 */
export type PamCliTokenPayloadType = WithUserSession<
  OAuthSessionPayload,
  UserSchema
> & {
  readonly typ: typeof PAM_CLI_TOKEN_TYP;
};

export type PamCliCreateTokenMetaType = {
  readonly loginMethod?: string | null;
  readonly userAgent?: string | null;
  readonly ipAddress?: string | null;
};

/**
 * 签发 CLI token 时的可选覆盖（CI / bot 短 TTL）。
 */
export type PamCliCreateTokenOptionsType = {
  /**
   * JWT `expiresIn`（如 `15m`、`1h`）。
   * 省略时用站点设置 / `PAM_CLI_TOKEN_EXPIRES_IN`（交互默认约 30d）。
   */
  readonly expiresIn?: SignOptions['expiresIn'];
};

/** CI / bot 短票推荐 TTL（OIDC 交换 / bot 路径复用）。 */
export const PAM_CLI_CI_TOKEN_EXPIRES_IN = '15m' as const;

/**
 * Issues and verifies revocable PAM CLI bearer JWTs.
 *
 * Significance: Lets the CLI authenticate without browser cookies.
 * Core idea: Short-lived JWT (`typ`/`aud`/`jti`) registered in DB until revoke.
 * Main function: Create / verify / revoke CLI tokens.
 * Main purpose: Drive export and search from `pam-cli` with logout support.
 *
 * @example
 * const issued = await service.createToken(user);
 */
@injectable()
export class PamCliTokenService {
  protected readonly sessionSecret: string;
  protected readonly expiresIn: SignOptions['expiresIn'];
  protected readonly verifyCache = new Map<
    string,
    Promise<WithUserSession<OAuthSessionPayload, UserSchema> | null>
  >();

  constructor(
    @inject(ServerConfig)
    config: SeedServerConfigInterface,
    @inject(PamCliTokenRepo)
    protected readonly tokenRepo: PamCliTokenRepo,
    @inject(SiteSettingsService)
    protected readonly siteSettings: SiteSettingsService
  ) {
    this.sessionSecret = config.sessionSecret;
    this.expiresIn = config.pamCliTokenExpiresIn;
  }

  /**
   * Creates a CLI bearer token and registers its `jti`.
   *
   * @param user - Authenticated user schema
   * @param meta - Optional login audit fields
   * @param options - 可选 TTL 覆盖（CI / bot 短票）
   * @returns token 字符串与 ISO 过期时间
   */
  public async createToken(
    user: UserSchema,
    meta: PamCliCreateTokenMetaType = {},
    options: PamCliCreateTokenOptionsType = {}
  ): Promise<{
    token: string;
    expiresAt: string;
    jti: string;
  }> {
    const jti = randomUUID();
    const payload: PamCliTokenPayloadType = {
      typ: PAM_CLI_TOKEN_TYP,
      userId: user.id,
      user,
      providerRefreshToken: ''
    };

    const expiresIn = (options.expiresIn ||
      (await this.siteSettings.getString(
        PAM_SITE_SETTING_KEYS.AUTH_CLI_TOKEN_EXPIRES_IN
      )) ||
      this.expiresIn) as SignOptions['expiresIn'];

    const token = jwt.sign(payload, this.sessionSecret, {
      expiresIn,
      jwtid: jti,
      audience: PAM_CLI_TOKEN_AUD
    });
    const decoded = jwt.decode(token) as { exp?: number } | null;
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await this.tokenRepo.insert({
      jti,
      userId: user.id,
      expiresAt,
      loginMethod: meta.loginMethod,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress
    });

    return { token, expiresAt, jti };
  }

  /**
   * 为 CI / bot runner 签发短寿命 CLI token（默认 15m）。
   * claims 与交互登录相同；调用方不应写入 vault。
   *
   * @param user - bot 或服务账号
   * @param meta - 审计字段（建议 `loginMethod: 'ci'`）
   * @param expiresIn - TTL 覆盖（默认 {@link PAM_CLI_CI_TOKEN_EXPIRES_IN}）
   */
  public async createCiToken(
    user: UserSchema,
    meta: PamCliCreateTokenMetaType = {},
    expiresIn: SignOptions['expiresIn'] = PAM_CLI_CI_TOKEN_EXPIRES_IN
  ): Promise<{
    token: string;
    expiresAt: string;
    jti: string;
  }> {
    return this.createToken(
      user,
      { ...meta, loginMethod: meta.loginMethod ?? 'ci' },
      { expiresIn }
    );
  }

  /**
   * Verifies signature, claims, DB allowlist, and basic user presence.
   *
   * @param token - Raw bearer token
   * @returns Session payload or null when invalid / revoked
   */
  public verifyToken(
    token: string
  ): Promise<WithUserSession<OAuthSessionPayload, UserSchema> | null> {
    // Instances are request-scoped (fresh IOC per request); auth plugins and
    // session resolution call this several times per request.
    let pending = this.verifyCache.get(token);
    if (!pending) {
      pending = this.verifyTokenUncached(token);
      this.verifyCache.set(token, pending);
    }
    return pending;
  }

  protected async verifyTokenUncached(
    token: string
  ): Promise<WithUserSession<OAuthSessionPayload, UserSchema> | null> {
    try {
      const payload = jwt.verify(token, this.sessionSecret, {
        audience: PAM_CLI_TOKEN_AUD
      }) as PamCliTokenPayloadType & { jti?: string };

      if (payload.typ !== PAM_CLI_TOKEN_TYP || !payload.userId) {
        return null;
      }

      const jti = typeof payload.jti === 'string' ? payload.jti : '';
      if (!jti) {
        // Legacy tokens without jti are no longer accepted.
        return null;
      }

      if (!(await this.tokenRepo.isActive(jti))) {
        return null;
      }

      return {
        userId: payload.userId,
        user: payload.user,
        providerRefreshToken: payload.providerRefreshToken || ''
      };
    } catch {
      return null;
    }
  }

  /**
   * Revokes the bearer token's `jti` (best-effort logout).
   *
   * @param token - Raw bearer token
   * @returns True when a registry row was revoked
   */
  public async revokeBearerToken(token: string): Promise<boolean> {
    try {
      const decoded = jwt.decode(token) as {
        jti?: string;
        typ?: string;
      } | null;
      if (
        !decoded ||
        decoded.typ !== PAM_CLI_TOKEN_TYP ||
        typeof decoded.jti !== 'string' ||
        !decoded.jti
      ) {
        return false;
      }
      return this.tokenRepo.revoke(decoded.jti);
    } catch {
      return false;
    }
  }
}
