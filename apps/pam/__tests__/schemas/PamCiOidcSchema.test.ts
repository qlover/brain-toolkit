import { describe, expect, it } from 'vitest';
import {
  PamCiOidcBindingUpsertSchema,
  PamCliOidcExchangeRequestSchema
} from '@schemas/PamCiOidcSchema';

describe('PamCiOidcSchema', () => {
  it('exchange accepts github and vercel providers', () => {
    expect(
      PamCliOidcExchangeRequestSchema.parse({
        provider: 'github',
        idToken: 'tok'
      }).provider
    ).toBe('github');
    expect(
      PamCliOidcExchangeRequestSchema.parse({
        provider: 'vercel',
        idToken: 'tok'
      }).provider
    ).toBe('vercel');
  });

  it('exchange rejects unknown provider', () => {
    expect(() =>
      PamCliOidcExchangeRequestSchema.parse({
        provider: 'gitlab',
        idToken: 'tok'
      })
    ).toThrow();
  });

  it('upsert defaults provider to github', () => {
    const parsed = PamCiOidcBindingUpsertSchema.parse({
      repository: 'acme/app'
    });
    expect(parsed.provider).toBe('github');
    expect(parsed.repository).toBe('acme/app');
  });

  it('upsert accepts vercel team/project', () => {
    const parsed = PamCiOidcBindingUpsertSchema.parse({
      provider: 'vercel',
      repository: 'acme/my-app'
    });
    expect(parsed.provider).toBe('vercel');
    expect(parsed.repository).toBe('acme/my-app');
  });

  it('upsert rejects invalid resource key', () => {
    expect(() =>
      PamCiOidcBindingUpsertSchema.parse({
        provider: 'vercel',
        repository: 'no-slash'
      })
    ).toThrow();
  });
});
