import { describe, expect, it } from 'vitest';
import {
  buildRuntimeCorsConfig,
  DEFAULT_CORS_METHODS,
  envCorsRules
} from '../src/server/siteSettings/runtimeCors';
import {
  isCorsRuleArray,
  safeParseCorsValue,
  SiteSettingRegistry
} from '../src/shared/siteSettings/siteSettings';

describe('SiteSettingRegistry', () => {
  const registry = new SiteSettingRegistry([
    {
      key: 'api.cors_rules',
      label: 'CORS',
      description: '',
      isSensitive: false,
      defaultValue: []
    },
    { key: 'mail.from', label: 'From', description: '', isSensitive: false }
  ] as const);

  it('recognises registered keys only', () => {
    expect(registry.isKey('api.cors_rules')).toBe(true);
    expect(registry.isKey('unknown')).toBe(false);
  });

  it('seeds rows with defaults (empty string when unset)', () => {
    expect(registry.seedRows().map((row) => row.value)).toEqual([[], '']);
  });
});

describe('CORS value helpers', () => {
  it('accepts valid rules and rejects duplicates', () => {
    const rule = {
      origin: 'https://spa.example.com',
      path: '/oauth/token',
      methods: ['POST']
    };
    expect(safeParseCorsValue([rule])).not.toBeNull();
    expect(safeParseCorsValue([rule, rule])).toBeNull();
  });

  it('rejects origins with a path', () => {
    expect(
      safeParseCorsValue([
        { origin: 'https://a.com/x', path: '*', methods: ['*'] }
      ])
    ).toBeNull();
  });

  it('isCorsRuleArray checks shape', () => {
    expect(isCorsRuleArray([{ origin: '*', path: '*', methods: [] }])).toBe(
      true
    );
    expect(isCorsRuleArray(['*'])).toBe(false);
  });
});

describe('runtime CORS config', () => {
  it('falls back to default methods', () => {
    expect(buildRuntimeCorsConfig([], []).apiCorsAllowedMethods).toEqual([
      ...DEFAULT_CORS_METHODS
    ]);
  });

  it('maps env origins to allow-all rules', () => {
    expect(envCorsRules(['https://a.com'])).toEqual([
      { origin: 'https://a.com', path: '*', methods: ['*'] }
    ]);
  });
});
