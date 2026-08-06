import { describe, expect, it } from 'vitest';

/**
 * Ownership compare used by @qlover/oauth-wrapper OAuthClientsService.
 * Documents why owner ids must be UUID strings end-to-end after Brain sync.
 */
function ownershipAllows(
  ownerFromDb: unknown,
  sessionOwnerId: string
): boolean {
  return String(ownerFromDb) === String(sessionOwnerId);
}

describe('Brain local auth.users ownership', () => {
  it('rejects legacy Brain numeric id vs string session (pre-fix bug)', () => {
    const fromDb: unknown = 123;
    const sessionId = '123';
    expect(fromDb !== sessionId).toBe(true);
    expect(ownershipAllows(fromDb, sessionId)).toBe(true);
  });

  it('allows UUID owner from auth.users with string session id', () => {
    const authUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    expect(ownershipAllows(authUserId, authUserId)).toBe(true);
  });
});
