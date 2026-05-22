import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';

export type BrainSessionPayload = {
  userId: number;
  email: string;
  name: string;
  brainToken: string;
};

const COOKIE_NAME = 'brain_oauth_session';

/**
 * HttpOnly session cookie for Brain-authenticated users during OAuth authorize.
 *
 * @example
 * await session.setSession({ userId: 3495, brainToken: '...' });
 * const payload = await session.getSession();
 */
@injectable()
export class BrainSessionService {
  constructor(@inject(I.AppConfig) protected config: SeedServerConfigInterface) {}

  public async setSession(payload: BrainSessionPayload): Promise<void> {
    const secret = this.requireSecret();
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });
  }

  public async hasSession(): Promise<boolean> {
    return (await this.getSession()) != null;
  }

  public async getSession(): Promise<BrainSessionPayload | null> {
    const secret = this.requireSecret();
    const cookieStore = await cookies();
    const raw = cookieStore.get(COOKIE_NAME)?.value;
    if (!raw) {
      return null;
    }
    try {
      return jwt.verify(raw, secret) as BrainSessionPayload;
    } catch {
      return null;
    }
  }

  public async clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  }

  protected requireSecret(): string {
    if (!this.config.sessionSecret) {
      throw new Error('SESSION_SECRET is required for Brain OAuth session');
    }
    return this.config.sessionSecret;
  }
}
