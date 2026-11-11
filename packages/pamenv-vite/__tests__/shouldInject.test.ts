import { afterEach, describe, expect, it } from 'vitest';
import { resolveAutoTiming, shouldInject } from '../src/index';

describe('shouldInject / resolveAutoTiming', () => {
  const previousVercel = process.env.VERCEL;
  const previousGha = process.env.GITHUB_ACTIONS;
  const previousEnabled = process.env.PAMENV_ENABLED;

  afterEach(() => {
    if (previousVercel === undefined) {
      delete process.env.VERCEL;
    } else {
      process.env.VERCEL = previousVercel;
    }
    if (previousGha === undefined) {
      delete process.env.GITHUB_ACTIONS;
    } else {
      process.env.GITHUB_ACTIONS = previousGha;
    }
    if (previousEnabled === undefined) {
      delete process.env.PAMENV_ENABLED;
    } else {
      process.env.PAMENV_ENABLED = previousEnabled;
    }
  });

  it('local: injects serve by default, skips build', () => {
    delete process.env.VERCEL;
    delete process.env.GITHUB_ACTIONS;
    expect(resolveAutoTiming({ slug: 'x', env: 'local' }, 'serve')).toBe(true);
    expect(resolveAutoTiming({ slug: 'x', env: 'local' }, 'build')).toBe(false);
  });

  it('local: dev false skips serve', () => {
    delete process.env.VERCEL;
    delete process.env.GITHUB_ACTIONS;
    expect(
      resolveAutoTiming({ slug: 'x', env: 'local', dev: false }, 'serve')
    ).toBe(false);
  });

  it('github CI: injects build when oidc github', () => {
    delete process.env.VERCEL;
    process.env.GITHUB_ACTIONS = 'true';
    expect(
      resolveAutoTiming(
        { slug: 'x', env: 'dev', oidc: 'github' },
        'build'
      )
    ).toBe(true);
    expect(
      resolveAutoTiming(
        { slug: 'x', env: 'dev', oidc: 'github' },
        'serve'
      )
    ).toBe(false);
  });

  it('github CI: ci false skips build', () => {
    process.env.GITHUB_ACTIONS = 'true';
    expect(
      resolveAutoTiming(
        { slug: 'x', env: 'dev', oidc: 'github', ci: false },
        'build'
      )
    ).toBe(false);
  });

  it('PAMENV_ENABLED=0 forces off', () => {
    delete process.env.GITHUB_ACTIONS;
    process.env.PAMENV_ENABLED = '0';
    expect(
      shouldInject({ slug: 'x', env: 'local' }, { command: 'serve' })
    ).toBe(false);
  });

  it('enabled false forces off', () => {
    delete process.env.PAMENV_ENABLED;
    expect(
      shouldInject(
        { slug: 'x', env: 'local', enabled: false },
        { command: 'serve' }
      )
    ).toBe(false);
  });
});
