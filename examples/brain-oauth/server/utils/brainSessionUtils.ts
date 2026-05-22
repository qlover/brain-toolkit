import jwt from 'jsonwebtoken';
import { UserRole, type UserSchema } from '@schemas/UserSchema';

export const BRAIN_SESSION_COOKIE = 'brain_oauth_session';

export type BrainSessionPayload = {
  userId: number;
  email: string;
  name: string;
  brainToken: string;
};

export function parseBrainSessionCookie(
  raw: string | undefined,
  secret: string | undefined
): BrainSessionPayload | null {
  if (!raw || !secret) {
    return null;
  }
  try {
    return jwt.verify(raw, secret) as BrainSessionPayload;
  } catch {
    return null;
  }
}

export function brainSessionToUserSchema(
  session: BrainSessionPayload,
  adminUserIds: number[] = []
): UserSchema {
  return {
    id: String(session.userId),
    email: session.email,
    role: adminUserIds.includes(session.userId) ? UserRole.ADMIN : UserRole.USER,
    password: '',
    credential_token: session.brainToken,
    created_at: new Date().toISOString(),
    updated_at: null
  };
}
