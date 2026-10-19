import { mkdtemp, rm, writeFile, mkdir, access, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PamCliI18n } from '../../src/i18n/PamCliI18n';
import { PamCliAuthStore } from '../../src/impls/PamCliAuthStore';
import { PamCliApiClient } from '../../src/impls/PamCliApiClient';
import { PamCliSyncStore } from '../../src/impls/PamCliSyncStore';
import { PamCliMockPamServer } from './PamCliMockPamServer';

async function ensureTestI18n(): Promise<void> {
  PamCliI18n.setLocale('en');
  await PamCliI18n.ensureLoaded('en');
}

export type PamCliIntegrationContextType = {
  readonly cwd: string;
  readonly baseUrl: string;
  readonly authStore: PamCliAuthStore;
  readonly syncStore: PamCliSyncStore;
  readonly apiClient: PamCliApiClient;
  readonly mock: PamCliMockPamServer;
  cleanup: () => Promise<void>;
};

/**
 * Temporary cwd + local `.pam` + mock PAM origin for contract tests.
 */
export async function createPamCliIntegrationContext(options?: {
  readonly token?: string | null;
  readonly email?: string;
}): Promise<PamCliIntegrationContextType> {
  await ensureTestI18n();
  const cwd = await mkdtemp(join(tmpdir(), 'pamenv-it-'));
  const mock = new PamCliMockPamServer();
  const baseUrl = await mock.start();

  await mkdir(join(cwd, '.pam'), { recursive: true });
  const preferLocal = true;
  const authStore = new PamCliAuthStore({
    preferLocal,
    workingDir: cwd,
    urlOverride: baseUrl
  });
  await authStore.setBaseUrl(baseUrl);
  if (options?.token !== null) {
    await authStore.setToken(
      options?.token ?? 'test-token',
      options?.email ?? 'ci@example.com'
    );
  }

  const syncStore = new PamCliSyncStore({
    preferLocal,
    workingDir: cwd
  });
  const apiClient = new PamCliApiClient(authStore);

  return {
    cwd,
    baseUrl,
    authStore,
    syncStore,
    apiClient,
    mock,
    cleanup: async () => {
      await mock.stop();
      await rm(cwd, { recursive: true, force: true });
    }
  };
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function writeWorldReadable(
  filePath: string,
  content: string
): Promise<void> {
  await writeFile(filePath, content, 'utf8');
  if (process.platform !== 'win32') {
    await chmod(filePath, 0o644);
  }
}

/**
 * Fixture dotenv / local file that pamenv may later rewrite (needs 0600 on POSIX).
 */
export async function writeOwnerOnlyFile(
  filePath: string,
  content: string
): Promise<void> {
  await writeFile(filePath, content, {
    encoding: 'utf8',
    mode: 0o600
  });
  if (process.platform !== 'win32') {
    await chmod(filePath, 0o600);
  }
}
