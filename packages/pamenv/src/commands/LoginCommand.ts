import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { input, password } from '@inquirer/prompts';
import { PamCliConfig } from '../config/PamCliConfig';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';

const execFileAsync = promisify(execFile);

/**
 * Interactive `pamenv login` command.
 *
 * Significance: Establishes CLI bearer credentials.
 * Core idea: Browser device-code by default; password as fallback.
 * Main function: Persist token to `~/.pam/config.json`.
 * Main purpose: Auth UX aligned with common CLI tools (gh, etc.).
 */
export class LoginCommand {
  constructor(
    protected readonly authStore: PamCliAuthStoreInterface,
    protected readonly apiClient: PamCliApiClientInterface
  ) {}

  /**
   * Runs login. Browser flow is default; use `password: true` for email/password.
   *
   * @param options - Optional overrides
   */
  public async run(options?: {
    readonly url?: string;
    readonly email?: string;
    readonly password?: string | boolean;
    readonly browser?: boolean;
  }): Promise<void> {
    const current = await this.authStore.getConfig();
    const baseUrl =
      options?.url?.trim() ||
      (await input({
        message: 'PAM base URL',
        default: current.baseUrl || PamCliConfig.DEFAULT_BASE_URL
      }));

    await this.authStore.setBaseUrl(baseUrl);

    const usePassword =
      options?.password === true ||
      typeof options?.password === 'string' ||
      Boolean(options?.email) ||
      options?.browser === false;

    if (usePassword) {
      await this.runPasswordLogin(baseUrl, options);
      return;
    }

    await this.runBrowserLogin(baseUrl);
  }

  protected async runPasswordLogin(
    baseUrl: string,
    options?: {
      readonly email?: string;
      readonly password?: string | boolean;
    }
  ): Promise<void> {
    const current = await this.authStore.getConfig();
    const email =
      options?.email?.trim() ||
      (await input({
        message: 'Email',
        default: current.email || undefined
      }));
    const pwd =
      typeof options?.password === 'string'
        ? options.password
        : await password({
            message: 'Password',
            mask: '*'
          });

    if (!email.trim() || !pwd) {
      throw new Error('Email and password are required');
    }

    const result = await this.apiClient.createCliToken(baseUrl, email, pwd);
    await this.persistLogin(result.token, result.email, result.expiresAt);
  }

  protected async runBrowserLogin(baseUrl: string): Promise<void> {
    const device = await this.apiClient.createDeviceCode(baseUrl);

    console.log('');
    console.log('Open the URL below in your browser to authorize pamenv:');
    console.log(`  ${device.verification_uri_complete}`);
    console.log('');
    console.log(`User code: ${device.user_code}`);
    console.log('Waiting for authorization...');

    try {
      await this.openBrowser(device.verification_uri_complete);
    } catch {
      console.log('(Could not open browser automatically — open the URL manually.)');
    }

    const deadline = Date.now() + device.expires_in * 1000;
    const intervalMs = Math.max(device.interval, 1) * 1000;

    while (Date.now() < deadline) {
      await this.sleep(intervalMs);
      const polled = await this.apiClient.pollDeviceToken(
        baseUrl,
        device.device_code
      );

      if (polled.status === 'pending') {
        process.stdout.write('.');
        continue;
      }

      if (polled.status === 'denied') {
        throw new Error('Authorization denied in browser');
      }

      if (polled.status === 'expired') {
        throw new Error('Device code expired. Run `pamenv login` again.');
      }

      if (polled.status === 'approved') {
        console.log('');
        await this.persistLogin(
          polled.token,
          polled.email,
          polled.expiresAt
        );
        return;
      }
    }

    throw new Error('Timed out waiting for browser authorization');
  }

  protected async persistLogin(
    token: string,
    email: string,
    expiresAt: string
  ): Promise<void> {
    await this.authStore.setToken(token, email);
    console.log(`Logged in as ${email}`);
    console.log(`Token expires at ${expiresAt}`);
    console.log(`Config saved to ${PamCliConfig.getConfigPath()}`);
  }

  protected async openBrowser(url: string): Promise<void> {
    const platform = process.platform;
    if (platform === 'darwin') {
      await execFileAsync('open', [url]);
      return;
    }
    if (platform === 'win32') {
      await execFileAsync('cmd', ['/c', 'start', '', url]);
      return;
    }
    await execFileAsync('xdg-open', [url]);
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
