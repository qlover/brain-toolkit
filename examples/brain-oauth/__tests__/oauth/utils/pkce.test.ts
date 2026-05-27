import { describe, expect, it } from 'vitest';
import {
  computeS256CodeChallenge,
  isValidCodeChallenge,
  isValidCodeVerifier,
  verifyPkceS256
} from '@server/oauth/utils/pkce';

describe('pkce', () => {
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

  it('validates verifier and challenge charset/length', () => {
    expect(isValidCodeVerifier(verifier)).toBe(true);
    expect(isValidCodeVerifier('short')).toBe(false);
    expect(isValidCodeChallenge(verifier)).toBe(true);
  });

  it('computes S256 challenge (RFC 7636 appendix B)', () => {
    const challenge = computeS256CodeChallenge(verifier);
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
    expect(verifyPkceS256(verifier, challenge)).toBe(true);
    expect(
      verifyPkceS256(
        verifier,
        'wrong-challenge-value-that-is-still-valid-charset-ok'
      )
    ).toBe(false);
  });
});
