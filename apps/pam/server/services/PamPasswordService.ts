import { ExecutorError } from '@qlover/fe-corekit/executor';
import { PasswordEncrypt, SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { createEphemeralAuthClient } from '@shared/supabase/server';
import { toBusinessEmail } from '@shared/utils/pamUserIdentity';
import {
  API_CHANGE_PASSWORD_CURRENT_INCORRECT,
  API_CHANGE_PASSWORD_EMAIL_REQUIRED,
  API_CHANGE_PASSWORD_INVALID,
  API_CHANGE_PASSWORD_SAME,
  API_NOT_AUTHORIZED
} from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import { isValidPassword } from '@schemas/PamUserSchema';
import { resolveSupabaseLoginPassword } from '@server/utils/supabaseLoginPassword';
import type { EncryptorInterface } from '@qlover/fe-corekit/encrypt';
import type { LoggerInterface } from '@qlover/logger';

@injectable()
export class PamPasswordService {
  constructor(
    @inject(I.Logger) protected readonly logger: LoggerInterface,
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(PasswordEncrypt)
    protected readonly encryptor: EncryptorInterface<string, string>
  ) {}

  /**
   * Verify the current password against Supabase Auth, then set the new one.
   * Other sessions are left untouched.
   *
   * @returns The account email the password belongs to
   */
  public async changePassword(params: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<{ email: string }> {
    const { userId, currentPassword, newPassword } = params;
    if (!isValidPassword(newPassword)) {
      throw new ExecutorError(API_CHANGE_PASSWORD_INVALID);
    }
    if (newPassword === currentPassword) {
      throw new ExecutorError(API_CHANGE_PASSWORD_SAME);
    }

    const admin = await this.supabaseBridge.getAdminSupabase();
    const authUser = await admin.auth.admin.getUserById(userId);
    if (authUser.error || !authUser.data.user) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }
    const email = toBusinessEmail(authUser.data.user.email);
    if (!email) {
      throw new ExecutorError(API_CHANGE_PASSWORD_EMAIL_REQUIRED);
    }

    await this.verifyCurrentPassword(userId, email, currentPassword);

    const updated = await admin.auth.admin.updateUserById(userId, {
      password: resolveSupabaseLoginPassword(this.encryptor, newPassword)
    });
    this.supabaseBridge.throwIfError(updated);
    this.logger.info('PamPasswordService: password changed', { userId });
    return { email };
  }

  protected async verifyCurrentPassword(
    userId: string,
    email: string,
    password: string
  ): Promise<void> {
    const authClient = createEphemeralAuthClient();
    const signedIn = await authClient.auth.signInWithPassword({
      email,
      password: resolveSupabaseLoginPassword(this.encryptor, password)
    });
    if (signedIn.error || signedIn.data.user?.id !== userId) {
      throw new ExecutorError(API_CHANGE_PASSWORD_CURRENT_INCORRECT);
    }
    // Drop the throwaway session created just for verification.
    await authClient.auth.signOut({ scope: 'local' }).catch(() => undefined);
  }
}
