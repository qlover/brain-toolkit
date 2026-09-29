import { ExecutorError } from '@qlover/fe-corekit/executor';
import { PasswordEncrypt, SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { toBusinessEmail } from '@shared/utils/pamUserIdentity';
import type { LocaleType } from '@config/i18n';
import {
  API_CHANGE_PASSWORD_INVALID,
  API_PASSWORD_RESET_DISABLED,
  API_PASSWORD_RESET_RATE_LIMITED,
  API_PASSWORD_RESET_TOKEN_INVALID
} from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import { PAM_SITE_SETTING_KEYS } from '@config/pamSiteSettings';
import {
  localePage,
  ROUTE_AUTH_FORGOT_PASSWORD,
  ROUTE_AUTH_RESET_PASSWORD
} from '@config/route';
import { isValidPassword } from '@schemas/PamUserSchema';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { PamMailLogsRepo } from '@server/repositorys/PamMailLogsRepo';
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  PamPasswordResetTokensRepo,
  type PamPasswordResetTokenRow
} from '@server/repositorys/PamPasswordResetTokensRepo';
import { PamUsersRepo } from '@server/repositorys/PamUsersRepo';
import { MailService } from '@server/services/mail/MailService';
import {
  renderPasswordChangedMail,
  renderPasswordResetMail
} from '@server/services/mail/mailTemplates';
import { MemoryKvCacheService } from '@server/services/MemoryKvCacheService';
import { PamSessionRevokeService } from '@server/services/PamSessionRevokeService';
import { SiteSettingsService } from '@server/services/SiteSettingsService';
import { resolveSupabaseLoginPassword } from '@server/utils/supabaseLoginPassword';
import type { EncryptorInterface } from '@qlover/fe-corekit/encrypt';
import type { LoggerInterface } from '@qlover/logger';

const RESET_TOKEN_TTL_MINUTES = 30;
const IP_COOLDOWN_MS = 60_000;
const EMAIL_WINDOW_MS = 60 * 60_000;
const EMAIL_MAX_PER_WINDOW = 5;

type RequestMeta = {
  readonly locale: LocaleType;
  readonly clientIp?: string | null;
  readonly userAgent?: string | null;
};

/**
 * Forgot-password by emailed link (independent from Supabase recovery mails).
 * A successful reset revokes every session of the user.
 */
@injectable()
export class PamPasswordResetService {
  constructor(
    @inject(I.Logger) protected readonly logger: LoggerInterface,
    @inject(I.AppConfig) protected readonly config: SeedServerConfigInterface,
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(PasswordEncrypt)
    protected readonly encryptor: EncryptorInterface<string, string>,
    @inject(SiteSettingsService)
    protected readonly siteSettings: SiteSettingsService,
    @inject(MailService) protected readonly mailService: MailService,
    @inject(PamUsersRepo) protected readonly pamUsersRepo: PamUsersRepo,
    @inject(PamPasswordResetTokensRepo)
    protected readonly tokensRepo: PamPasswordResetTokensRepo,
    @inject(PamMailLogsRepo) protected readonly mailLogsRepo: PamMailLogsRepo,
    @inject(PamSessionRevokeService)
    protected readonly sessionRevoke: PamSessionRevokeService,
    @inject(MemoryKvCacheService) protected readonly kv: MemoryKvCacheService
  ) {}

  public async isEnabled(): Promise<boolean> {
    const config = await this.siteSettings.getPublicConfig();
    return config.auth.passwordResetEnabled === true;
  }

  /**
   * Always resolves the same way whether or not the email exists, so callers
   * cannot probe registered accounts.
   */
  public async requestReset(
    params: { email: string } & RequestMeta
  ): Promise<void> {
    if (!(await this.isEnabled())) {
      throw new ExecutorError(API_PASSWORD_RESET_DISABLED);
    }
    await this.assertIpCooldown(params.clientIp ?? 'unknown');

    const target = await this.findResetTarget(params.email);
    if (!target) {
      this.logger.info('Password reset requested for unknown email');
      return;
    }

    const since = new Date(Date.now() - EMAIL_WINDOW_MS).toISOString();
    const recent = await this.mailLogsRepo.countRecentByEmail(
      target.email,
      'password_reset',
      since
    );
    if (recent >= EMAIL_MAX_PER_WINDOW) {
      this.logger.warn('Password reset email quota reached', {
        userId: target.userId
      });
      return;
    }

    const token = generatePasswordResetToken();
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000
    ).toISOString();
    await this.tokensRepo.insert({
      userId: target.userId,
      email: target.email,
      tokenHash: hashPasswordResetToken(token),
      expiresAt,
      createdIp: params.clientIp ?? null
    });

    const resetUrl = new URL(
      localePage(ROUTE_AUTH_RESET_PASSWORD, params.locale),
      this.config.siteUrl
    );
    resetUrl.searchParams.set('token', token);

    await this.mailService.sendSafely({
      to: target.email,
      template: 'password_reset',
      mail: renderPasswordResetMail({
        locale: params.locale,
        siteName: await this.mailService.getSiteName(),
        resetUrl: resetUrl.toString(),
        expiresInMinutes: RESET_TOKEN_TTL_MINUTES
      }),
      userId: target.userId,
      clientIp: params.clientIp
    });
  }

  public async verifyToken(token: string): Promise<{ valid: boolean }> {
    const row = await this.findUsableToken(token);
    return { valid: row !== null };
  }

  public async resetPassword(
    params: { token: string; newPassword: string } & RequestMeta
  ): Promise<void> {
    if (!isValidPassword(params.newPassword)) {
      throw new ExecutorError(API_CHANGE_PASSWORD_INVALID);
    }

    const row = await this.findUsableToken(params.token);
    if (!row || !(await this.tokensRepo.markUsed(row.id))) {
      throw new ExecutorError(API_PASSWORD_RESET_TOKEN_INVALID);
    }

    const admin = await this.supabaseBridge.getAdminSupabase();
    const updated = await admin.auth.admin.updateUserById(row.user_id, {
      password: resolveSupabaseLoginPassword(this.encryptor, params.newPassword)
    });
    this.supabaseBridge.throwIfError(updated);

    await this.tokensRepo.invalidateUnusedForUser(row.user_id);
    await this.sessionRevoke.revokeAll({
      userId: row.user_id,
      email: row.email
    });

    this.logger.info('PamPasswordResetService: password reset', {
      userId: row.user_id
    });

    await this.notifyPasswordChanged({
      userId: row.user_id,
      email: row.email,
      locale: params.locale,
      clientIp: params.clientIp,
      userAgent: params.userAgent
    });
  }

  /** Best effort; never throws. */
  public async notifyPasswordChanged(
    params: { userId: string; email: string } & RequestMeta
  ): Promise<void> {
    try {
      const enabled = await this.siteSettings.getBoolean(
        PAM_SITE_SETTING_KEYS.MAIL_PASSWORD_CHANGED_NOTIFY_ENABLED
      );
      if (!enabled) {
        return;
      }
      const forgotPasswordUrl = (await this.isEnabled())
        ? new URL(
            localePage(ROUTE_AUTH_FORGOT_PASSWORD, params.locale),
            this.config.siteUrl
          ).toString()
        : null;

      await this.mailService.sendSafely({
        to: params.email,
        template: 'password_changed',
        mail: renderPasswordChangedMail({
          locale: params.locale,
          siteName: await this.mailService.getSiteName(),
          changedAt: new Date(),
          ip: params.clientIp,
          userAgent: params.userAgent,
          forgotPasswordUrl
        }),
        userId: params.userId,
        clientIp: params.clientIp
      });
    } catch (error) {
      this.logger.warn('Password changed notification failed', {
        userId: params.userId,
        error
      });
    }
  }

  protected async findUsableToken(
    token: string
  ): Promise<PamPasswordResetTokenRow | null> {
    const trimmed = token.trim();
    if (!trimmed) {
      return null;
    }
    const row = await this.tokensRepo.findByHash(
      hashPasswordResetToken(trimmed)
    );
    if (!row || row.used_at) {
      return null;
    }
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      return null;
    }
    return row;
  }

  protected async findResetTarget(
    rawEmail: string
  ): Promise<{ userId: string; email: string } | null> {
    const pamUser = await this.pamUsersRepo.findByEmail(rawEmail);
    if (!pamUser || pamUser.status !== 'active') {
      return null;
    }
    const admin = await this.supabaseBridge.getAdminSupabase();
    const authUser = await admin.auth.admin.getUserById(pamUser.id);
    if (authUser.error || !authUser.data.user) {
      return null;
    }
    const email = toBusinessEmail(authUser.data.user.email);
    return email ? { userId: pamUser.id, email } : null;
  }

  protected async assertIpCooldown(clientIp: string): Promise<void> {
    const key = `pam:password-reset:ip:${clientIp.trim() || 'unknown'}`;
    const blockedUntil = await this.kv.getItem<number>(key);
    const now = Date.now();
    if (typeof blockedUntil === 'number' && now < blockedUntil) {
      const retryAfterSec = Math.max(1, Math.ceil((blockedUntil - now) / 1000));
      throw new ExecutorError(API_PASSWORD_RESET_RATE_LIMITED, {
        retryAfterSec
      });
    }
    await this.kv.setItem<number>(key, now + IP_COOLDOWN_MS, {
      ttlMs: IP_COOLDOWN_MS
    });
  }
}
