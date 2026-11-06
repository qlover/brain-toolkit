import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PamCliConfig } from '../src/config/PamCliConfig';
import { PamCliAuthStore } from '../src/impls/PamCliAuthStore';

describe('CI memory ticket env', () => {
  const previousToken = process.env[PamCliConfig.ENV_TOKEN];
  const previousBase = process.env[PamCliConfig.ENV_BASE_URL];
  let tempDir = '';

  afterEach(async () => {
    if (previousToken === undefined) {
      delete process.env[PamCliConfig.ENV_TOKEN];
    } else {
      process.env[PamCliConfig.ENV_TOKEN] = previousToken;
    }
    if (previousBase === undefined) {
      delete process.env[PamCliConfig.ENV_BASE_URL];
    } else {
      process.env[PamCliConfig.ENV_BASE_URL] = previousBase;
    }
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = '';
    }
  });

  it('prefers PAMENV_TOKEN over empty vault', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'pamenv-ci-'));
    process.env[PamCliConfig.ENV_TOKEN] = 'ci-memory-token';
    process.env[PamCliConfig.ENV_BASE_URL] = 'https://pam.ci.example';
    const store = new PamCliAuthStore({
      preferLocal: true,
      workingDir: tempDir
    });
    await expect(store.getToken()).resolves.toBe('ci-memory-token');
    await expect(store.getBaseUrl()).resolves.toBe('https://pam.ci.example');
  });
});
