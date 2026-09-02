import { ExecutorError } from '@qlover/fe-corekit/executor';
import { UserRole, type UserSchema } from '@qlover/next-kit/common';
import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import {
  API_OTP_CODE_INVALID,
  API_OTP_SEND_RATE_LIMITED
} from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import { PAM_SITE_SETTING_KEYS } from '@config/pamSiteSettings';
import type { PamPhoneOtpAdminItem } from '@schemas/PamPhoneOtpSchema';
import type { PamPhoneOtpProvider } from '@schemas/PamPhoneOtpSchema';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import {
  generatePhoneOtpCode,
  hashPhoneOtpCode,
  PamPhoneOtpsRepo,
  safeEqualOtp
} from '@server/repositorys/PamPhoneOtpsRepo';
import { PamUsersRepo } from '@server/repositorys/PamUsersRepo';
import { OAuthSessionService } from '@server/services/OAuthSessionService';
import { OTP_SEND_COOLDOWN_MS } from '@server/services/OtpSendRateLimitService';
import { PamUserService } from '@server/services/PamUserService';
import { AliyunPhoneOtpProvider } from '@server/services/phoneOtp/AliyunPhoneOtpProvider';
import { MemoryPhoneOtpProvider } from '@server/services/phoneOtp/MemoryPhoneOtpProvider';
import type { PhoneOtpProviderInterface } from '@server/services/phoneOtp/PhoneOtpProviderInterface';
import { SiteSettingsService } from '@server/services/SiteSettingsService';
import type { LoggerInterface } from '@qlover/logger';
import type { SignOtpResult, OAuthSessionPayload } from '@qlover/oauth-wrapper';

const OTP_TTL_MS = 5 * 60_000;

function phoneFallbackEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits ? `${digits}@phone.pam.local` : 'unknown@phone.pam.local';
}

function normalizePhoneE164(raw: string): string {
  const trimmed = raw.trim().replace(/[\s-]/g, '');
  if (!trimmed) {
    return '';
  }
  if (trimmed.startsWith('+')) {
    return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (/^1\d{10}$/.test(digits)) {
    return `+86${digits}`;
  }
  if (digits.startsWith('86') && digits.length >= 12) {
    return `+${digits}`;
  }
  return digits ? `+${digits}` : '';
}

@injectable()
export class PhoneOtpService {
  constructor(
    @inject(I.Logger) protected readonly logger: LoggerInterface,
    @inject(I.AppConfig) protected readonly config: SeedServerConfigInterface,
    @inject(PamPhoneOtpsRepo) protected readonly otpsRepo: PamPhoneOtpsRepo,
    @inject(PamUsersRepo) protected readonly pamUsersRepo: PamUsersRepo,
    @inject(PamUserService) protected readonly pamUserService: PamUserService,
    @inject(SiteSettingsService)
    protected readonly siteSettings: SiteSettingsService,
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(MemoryPhoneOtpProvider)
    protected readonly memoryProvider: MemoryPhoneOtpProvider,
    @inject(AliyunPhoneOtpProvider)
    protected readonly aliyunProvider: AliyunPhoneOtpProvider
  ) {}

  public async send(params: {
    phone: string;
    clientIp?: string;
  }): Promise<SignOtpResult> {
    const phone = normalizePhoneE164(params.phone);
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      throw new ExecutorError(API_OTP_CODE_INVALID, 'Invalid phone');
    }

    await this.assertPhoneCooldown(phone);

    const provider = await this.resolveProvider();
    const code = generatePhoneOtpCode(6);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await this.otpsRepo.revokePendingByPhone(phone);

    await provider.send({ phone, code, expiresAt });

    await this.otpsRepo.insert({
      phone,
      codeHash: hashPhoneOtpCode(code),
      codePlain: provider.exposePlainCode() ? code : null,
      provider: provider.name,
      expiresAt: expiresAt.toISOString(),
      createdIp: params.clientIp ?? null
    });

    this.logger.info('Phone OTP issued', {
      phone,
      provider: provider.name,
      expiresAt: expiresAt.toISOString()
    });

    return {
      expired: Math.floor(expiresAt.getTime() / 1000)
    };
  }

  public async verifyAndLogin(params: {
    phone: string;
    token: string;
  }): Promise<SignOtpResult> {
    const phone = normalizePhoneE164(params.phone);
    const token = params.token.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone) || !/^\d{4,8}$/.test(token)) {
      throw new ExecutorError(API_OTP_CODE_INVALID);
    }

    const pending = await this.otpsRepo.findLatestPending(phone);
    if (!pending) {
      throw new ExecutorError(API_OTP_CODE_INVALID);
    }

    if (new Date(pending.expires_at).getTime() <= Date.now()) {
      await this.otpsRepo.markExpired(pending.id);
      throw new ExecutorError(API_OTP_CODE_INVALID);
    }

    const ok =
      safeEqualOtp(pending.code_hash, hashPhoneOtpCode(token)) ||
      (pending.code_plain != null && safeEqualOtp(pending.code_plain, token));

    if (!ok) {
      const attempts = pending.attempts + 1;
      await this.otpsRepo.incrementAttempts(
        pending.id,
        attempts,
        pending.max_attempts
      );
      throw new ExecutorError(API_OTP_CODE_INVALID);
    }

    await this.otpsRepo.markVerified(pending.id);

    const user = await this.ensureAuthUserForPhone(phone);
    await this.pamUserService.ensurePamUser({
      id: user.id,
      email: user.email,
      phone
    });

    const sessionService = new OAuthSessionService(this.config);
    const sessionPayload: OAuthSessionPayload & { user?: UserSchema } = {
      userId: user.id,
      providerRefreshToken: '',
      user
    };
    await sessionService.setSession(sessionPayload);

    return {
      expired: Math.floor(Date.now() / 1000) + 7 * 24 * 3600
    };
  }

  public async listForAdmin(params: {
    limit?: number;
    phone?: string;
  }): Promise<PamPhoneOtpAdminItem[]> {
    return this.otpsRepo.listRecent(params);
  }

  protected async resolveProvider(): Promise<PhoneOtpProviderInterface> {
    const raw = (
      await this.siteSettings.getString(
        PAM_SITE_SETTING_KEYS.AUTH_PHONE_OTP_PROVIDER
      )
    )
      .trim()
      .toLowerCase();

    const name = (raw || 'memory') as PamPhoneOtpProvider;
    if (name === 'aliyun') {
      return this.aliyunProvider;
    }
    return this.memoryProvider;
  }

  protected async assertPhoneCooldown(phone: string): Promise<void> {
    const latest = await this.otpsRepo.findLatestSendAt(phone);
    if (!latest) {
      return;
    }
    const elapsed = Date.now() - new Date(latest).getTime();
    if (elapsed < OTP_SEND_COOLDOWN_MS) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((OTP_SEND_COOLDOWN_MS - elapsed) / 1000)
      );
      throw new ExecutorError(API_OTP_SEND_RATE_LIMITED, { retryAfterSec });
    }
  }

  protected async ensureAuthUserForPhone(phone: string): Promise<UserSchema> {
    const email = phoneFallbackEmail(phone);
    const existingPam = await this.pamUsersRepo.findByPhone(phone);
    if (existingPam) {
      return {
        id: existingPam.id,
        email: existingPam.email || email,
        role: UserRole.USER,
        credential_token: '',
        created_at: existingPam.created_at
      };
    }

    const admin = await this.supabaseBridge.getAdminSupabase();
    const created = await admin.auth.admin.createUser({
      email,
      phone,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { login_phone: phone }
    });

    if (created.data.user?.id) {
      return {
        id: created.data.user.id,
        email: created.data.user.email || email,
        role: UserRole.USER,
        credential_token: '',
        created_at: created.data.user.created_at
      };
    }

    // User may already exist (email/phone conflict) — scan recent pages.
    const found = await this.findAuthUserByEmailOrPhone(email, phone);
    if (found) {
      return found;
    }

    this.logger.error('ensureAuthUserForPhone failed', {
      phone,
      error: created.error
    });
    throw new Error(created.error?.message || 'Failed to create phone user');
  }

  protected async findAuthUserByEmailOrPhone(
    email: string,
    phone: string
  ): Promise<UserSchema | null> {
    const admin = await this.supabaseBridge.getAdminSupabase();
    const digits = phone.replace(/\D/g, '');

    for (let page = 1; page <= 5; page += 1) {
      const listed = await admin.auth.admin.listUsers({ page, perPage: 200 });
      const users = listed.data?.users ?? [];
      const match = users.find((user) => {
        const userPhone = (user.phone ?? '').replace(/\D/g, '');
        return user.email === email || (userPhone && userPhone === digits);
      });
      if (match?.id) {
        return {
          id: match.id,
          email: match.email || email,
          role: UserRole.USER,
          credential_token: '',
          created_at: match.created_at
        };
      }
      if (users.length < 200) {
        break;
      }
    }

    return null;
  }
}
