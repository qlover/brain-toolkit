import { ExecutorError } from '@qlover/fe-corekit';
import { cookies } from 'next/headers';
import { inject, injectable } from '@shared/container';
import { API_NOT_AUTHORIZED } from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import { UserSchema } from '@schemas/UserSchema';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { brainSessionToUserSchema } from '../utils/brainSessionUtils';
import { BrainSessionService } from './BrainSessionService';
import type { ServerAuthInterface } from '../interfaces/ServerAuthInterface';

@injectable()
export class ServerAuth implements ServerAuthInterface {
  constructor(
    @inject(BrainSessionService) protected brainSession: BrainSessionService,
    @inject(I.AppConfig) protected config: SeedServerConfigInterface
  ) {}

  /**
   * @override
   * Session is established by {@link BrainSessionService.setSession} during Brain login.
   */
  public async setAuth(_credential_token: string): Promise<void> {
    // no-op: brain_oauth_session is the single source of truth
  }

  /**
   * @override
   */
  public async hasAuth(): Promise<boolean> {
    return this.brainSession.hasSession();
  }

  /**
   * @override
   */
  public async getAuth(): Promise<string> {
    const session = await this.brainSession.getSession();
    return session?.brainToken ?? '';
  }

  /**
   * @override
   */
  public async clear(): Promise<void> {
    await this.brainSession.clearSession();

    const legacyKey = this.config.userTokenKey;
    if (legacyKey) {
      const cookieStore = await cookies();
      cookieStore.delete(legacyKey);
    }
  }

  /**
   * @override
   */
  public async throwIfNotAuth(): Promise<void> {
    if (!(await this.hasAuth())) {
      throw new ExecutorError(API_NOT_AUTHORIZED, 'Not authorized');
    }
  }

  /**
   * @override
   */
  public async getUser(): Promise<UserSchema | null> {
    const session = await this.brainSession.getSession();
    if (!session) {
      return null;
    }

    return brainSessionToUserSchema(session, this.config.adminUserIds);
  }
}
