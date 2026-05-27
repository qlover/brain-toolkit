import { parseBearerAuthorization } from '@/app/userinfo/route';
import { describe, expect, it } from 'vitest';

describe('parseBearerAuthorization', () => {
  it('returns token for valid Bearer header', () => {
    expect(parseBearerAuthorization('Bearer eyJ.access')).toBe('eyJ.access');
  });

  it('is case-insensitive on Bearer scheme', () => {
    expect(parseBearerAuthorization('bearer my-token')).toBe('my-token');
  });

  it('returns undefined when header is missing', () => {
    expect(parseBearerAuthorization(null)).toBeUndefined();
  });

  it('returns undefined for non-Bearer schemes', () => {
    expect(parseBearerAuthorization('Basic abc')).toBeUndefined();
  });

  it('returns undefined for empty bearer value', () => {
    expect(parseBearerAuthorization('Bearer   ')).toBeUndefined();
  });
});
