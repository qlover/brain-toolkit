import { afterEach, describe, expect, it } from 'vitest';
import {
  injectPamenvProcessEnv,
  resetPamenvInjectCache
} from '../src/impls/PamenvInject';

describe('injectPamenvProcessEnv', () => {
  afterEach(() => {
    resetPamenvInjectCache();
    delete process.env.PAMENV_INJECT_SENTINEL;
  });

  it('does not touch process.env when disabled', async () => {
    process.env.PAMENV_INJECT_SENTINEL = 'keep';
    await injectPamenvProcessEnv({
      slug: 'brain-oauth',
      env: 'local',
      enabled: false
    });
    expect(process.env.PAMENV_INJECT_SENTINEL).toBe('keep');
  });
});
