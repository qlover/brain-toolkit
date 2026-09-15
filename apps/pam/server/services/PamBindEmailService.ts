import { ExecutorError } from '@qlover/fe-corekit/executor';
import { UserRole } from '@qlover/next-kit/common';
import { SUPABASE_KEY, SUPABASE_URL } from '@qlover/next-kit/common';
import { SupabaseRepo } from '@qlover/next-kit/server';
import {
  createClient,
  type SupabaseClient,
  type User
} from '@supabase/supabase-js';
import { normalizeSystemRole, SystemRole } from '@shared/auth/systemRole';
import { inject, injectable } from '@shared/container';
import {
  toBusinessEmail,
  PHONE_PLACEHOLDER_EMAIL_SUFFIX
} from '@shared/utils/pamUserIdentity';
import {
  API_BIND_EMAIL_ALREADY_BOUND,
  API_BIND_EMAIL_PHONE_CONFLICT,
  API_NOT_AUTHORIZED,
  API_OTP_CODE_INVALID
} from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import type { PamUserRow } from '@schemas/PamUserSchema';
import type {
  PamBindEmailVerifyResult,
  PamSessionUser
} from '@schemas/PamUserSchema';
import type { OAuthWrapperProviderInterface } from '@server/interfaces/OAuthWrapperProviderInterface';
import { OAuthWrapperRepository } from '@server/repositorys/OAuthWrapperRepository';
import { PamCliTokenRepo } from '@server/repositorys/PamCliTokenRepo';
import { PamProjectCollaboratorsRepo } from '@server/repositorys/PamProjectCollaboratorsRepo';
import { PAMProjectRepo } from '@server/repositorys/PAMProjectRepo';
import { PamUsersRepo } from '@server/repositorys/PamUsersRepo';
import { PamSupabaseSessionMintService } from '@server/services/PamSupabaseSessionMintService';
import { PamUserService } from '@server/services/PamUserService';
import type { LoggerInterface } from '@qlover/logger';
import type { SignOtpResult } from '@qlover/oauth-wrapper';

@injectable()
export class PamBindEmailService {
  constructor(
    @inject(I.Logger) protected readonly logger: LoggerInterface,
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(PamUserService) protected readonly pamUserService: PamUserService,
    @inject(PamUsersRepo) protected readonly pamUsersRepo: PamUsersRepo,
    @inject(PAMProjectRepo) protected readonly projectRepo: PAMProjectRepo,
    @inject(PamProjectCollaboratorsRepo)
    protected readonly collaboratorsRepo: PamProjectCollaboratorsRepo,
    @inject(PamCliTokenRepo) protected readonly cliTokenRepo: PamCliTokenRepo,
    @inject(OAuthWrapperRepository)
    protected readonly oauthRepo: OAuthWrapperRepository,
    @inject(I.OAuthWrapperProviderInterface)
    protected readonly oauthProvider: OAuthWrapperProviderInterface,
    @inject(PamSupabaseSessionMintService)
    protected readonly sessionMint: PamSupabaseSessionMintService
  ) {}

  public async send(params: {
    currentUserId: string;
    email: string;
  }): Promise<SignOtpResult> {
    const email = params.email.trim().toLowerCase();
    const current = await this.pamUserService.ensurePamUser({
      id: params.currentUserId,
      email: null
    });

    const currentBusiness = toBusinessEmail(current.email);
    if (currentBusiness && currentBusiness.toLowerCase() !== email) {
      throw new ExecutorError(API_BIND_EMAIL_ALREADY_BOUND);
    }

    const supabase = await this.supabaseBridge.getSupabase();
    const result = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });
    this.supabaseBridge.throwIfError(result);

    return {
      expired: Math.floor(Date.now() / 1000) + 3600
    };
  }

  public async verify(params: {
    currentUserId: string;
    email: string;
    token: string;
  }): Promise<PamBindEmailVerifyResult> {
    const email = params.email.trim().toLowerCase();
    const token = params.token.trim();
    if (!email || !token) {
      throw new ExecutorError(API_OTP_CODE_INVALID);
    }

    const current = await this.pamUserService.findById(params.currentUserId);
    if (!current) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const currentBusiness = toBusinessEmail(current.email);
    if (currentBusiness && currentBusiness.toLowerCase() !== email) {
      throw new ExecutorError(API_BIND_EMAIL_ALREADY_BOUND);
    }

    const otpUser = await this.verifyEmailOtp(email, token);
    const existing = await this.pamUserService.findByEmail(email);

    if (existing && existing.id !== params.currentUserId) {
      const sessionUser = await this.mergePhoneUserIntoEmailUser({
        phoneUser: current,
        emailUser: existing,
        email,
        verifiedAuthUserId: otpUser.id
      });
      return { merged: true, user: sessionUser };
    }

    const sessionUser = await this.bindEmailToCurrentUser({
      current,
      email,
      otpUser
    });
    return { merged: false, user: sessionUser };
  }

  protected async verifyEmailOtp(email: string, token: string): Promise<User> {
    const authClient = this.createEphemeralAuthClient();
    const verified = await authClient.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    if (verified.error || !verified.data.user?.id) {
      throw new ExecutorError(API_OTP_CODE_INVALID);
    }
    return verified.data.user;
  }

  protected createEphemeralAuthClient(): SupabaseClient {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_KEY are required');
    }
    return createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }

  protected async bindEmailToCurrentUser(params: {
    current: PamUserRow;
    email: string;
    otpUser: User;
  }): Promise<PamSessionUser> {
    const { current, email, otpUser } = params;
    const admin = await this.supabaseBridge.getAdminSupabase();

    if (otpUser.id !== current.id) {
      // Free the email on the temporary OTP auth user, then attach to current.
      const discardEmail = `discard.${otpUser.id.replace(/-/g, '')}${PHONE_PLACEHOLDER_EMAIL_SUFFIX}`;
      const cleared = await admin.auth.admin.updateUserById(otpUser.id, {
        email: discardEmail,
        email_confirm: true
      });
      this.supabaseBridge.throwIfError(cleared);

      const updated = await admin.auth.admin.updateUserById(current.id, {
        email,
        email_confirm: true
      });
      this.supabaseBridge.throwIfError(updated);

      await this.pamUsersRepo.deleteById(otpUser.id).catch(() => undefined);
      const deleted = await admin.auth.admin.deleteUser(otpUser.id);
      if (deleted.error) {
        this.logger.warn('PamBindEmailService: failed deleting temp otp user', {
          otpUserId: otpUser.id,
          error: deleted.error
        });
      }
    } else {
      const updated = await admin.auth.admin.updateUserById(current.id, {
        email,
        email_confirm: true
      });
      this.supabaseBridge.throwIfError(updated);
    }

    const pam = await this.pamUsersRepo.updateEmailAndPhone({
      userId: current.id,
      email
    });

    await this.reloginAsUser({
      userId: current.id,
      email
    });

    return this.toSessionUser(pam);
  }

  protected async mergePhoneUserIntoEmailUser(params: {
    phoneUser: PamUserRow;
    emailUser: PamUserRow;
    email: string;
    verifiedAuthUserId: string;
  }): Promise<PamSessionUser> {
    const { phoneUser: A, emailUser: B, email, verifiedAuthUserId } = params;

    if (verifiedAuthUserId !== B.id) {
      throw new ExecutorError(API_OTP_CODE_INVALID);
    }

    const phone = A.phone?.trim() || null;
    const bPhone = B.phone?.trim() || null;
    if (bPhone && phone && bPhone !== phone) {
      throw new ExecutorError(API_BIND_EMAIL_PHONE_CONFLICT);
    }

    // Migrate owned resources A → B before deleting A.
    await this.projectRepo.reassignOwnerProjects(A.id, B.id);
    await this.collaboratorsRepo.reassignUserId(A.id, B.id);
    await this.cliTokenRepo.reassignUserId(A.id, B.id);
    await this.oauthRepo.reassignClientOwner(A.id, B.id);
    await this.oauthRepo.reassignRefreshTokensUserId(A.id, B.id);
    await this.oauthRepo.deleteUserCredentials(A.id);

    if (
      normalizeSystemRole(A.system_role) === SystemRole.Admin &&
      normalizeSystemRole(B.system_role) !== SystemRole.Admin
    ) {
      await this.pamUsersRepo.setPlatformAdmin(B.id, true, B.id);
    }

    // Clear phone on A first (unique index), then attach to B.
    if (phone) {
      await this.pamUsersRepo.updateEmailAndPhone({
        userId: A.id,
        phone: null
      });
    }

    const pamB = await this.pamUsersRepo.updateEmailAndPhone({
      userId: B.id,
      email,
      phone: phone ?? bPhone,
      displayName: B.display_name ?? A.display_name ?? null
    });

    const admin = await this.supabaseBridge.getAdminSupabase();
    if (phone) {
      const phoneUpdate = await admin.auth.admin.updateUserById(B.id, {
        phone,
        phone_confirm: true
      });
      if (phoneUpdate.error) {
        this.logger.warn('PamBindEmailService: failed attaching phone to B', {
          error: phoneUpdate.error,
          userId: B.id
        });
      }
    }

    await this.pamUsersRepo.deleteById(A.id);
    const deleted = await admin.auth.admin.deleteUser(A.id);
    if (deleted.error) {
      this.logger.error('PamBindEmailService: failed deleting phone user A', {
        error: deleted.error,
        userId: A.id
      });
      throw new Error(deleted.error.message);
    }

    await this.reloginAsUser({
      userId: B.id,
      email
    });

    return this.toSessionUser(pamB);
  }

  protected async reloginAsUser(params: {
    userId: string;
    email: string;
  }): Promise<void> {
    const session = await this.sessionMint.mintSessionForAuthUser({
      userId: params.userId,
      email: params.email
    });
    if (!this.oauthProvider.loginWithSession) {
      throw new Error('OAuth provider does not support loginWithSession');
    }
    await this.oauthProvider.loginWithSession(session);
  }

  protected toSessionUser(pam: PamUserRow): PamSessionUser {
    return {
      id: pam.id,
      email: pam.email?.trim() ?? '',
      phone: pam.phone ?? null,
      display_name: pam.display_name ?? null,
      role: UserRole.USER,
      credential_token: '',
      created_at: pam.created_at
    };
  }
}
