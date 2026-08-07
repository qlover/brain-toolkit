import { resolve } from 'node:path';
import { Command } from 'commander';
import { ConfigCommand } from './commands/ConfigCommand';
import { ForkCommand } from './commands/ForkCommand';
import { InitCommand } from './commands/InitCommand';
import { LocalesCommand } from './commands/LocalesCommand';
import { LoginCommand } from './commands/LoginCommand';
import { ProjectsCommand } from './commands/ProjectsCommand';
import { PullCommand } from './commands/PullCommand';
import { PushCommand } from './commands/PushCommand';
import { RemoveCommand } from './commands/RemoveCommand';
import { PamCliConfig } from './config/PamCliConfig';
import { PamCliApiClient } from './impls/PamCliApiClient';
import { PamCliApiError } from './impls/PamCliApiError';
import { PamCliAuthStore } from './impls/PamCliAuthStore';
import { PamCliLocaleCatalog } from './impls/PamCliLocaleCatalog';
import { PamCliSyncStore } from './impls/PamCliSyncStore';
import { name, version } from '../package.json';

type PamCliGlobalOptionsType = {
  readonly url?: string;
  readonly domain?: string;
  readonly local?: boolean;
};

/**
 * pamenv application entry / command registrar.
 *
 * Significance: Wires stores, API client, and commands.
 * Core idea: Commander program with injected implementations.
 * Main function: Parse argv and dispatch commands.
 * Main purpose: Provide the `pamenv` binary UX.
 *
 * @example
 * await new PamCliApp().run(process.argv);
 */
export class PamCliApp {
  protected authStore = new PamCliAuthStore();
  protected syncStore = new PamCliSyncStore();
  protected apiClient = new PamCliApiClient(this.authStore);
  protected localeCatalog = new PamCliLocaleCatalog(this.authStore);

  /**
   * Parses argv and runs the selected command.
   *
   * @param argv - Process argv
   */
  public async run(argv: string[] = process.argv): Promise<void> {
    const program = new Command();
    program.name('pamenv').description(name).version(version);

    this.addRuntimeOptions(program);

    program.hook('preAction', async (_thisCommand, actionCommand) => {
      const root = program.opts() as PamCliGlobalOptionsType;
      const leaf = actionCommand.opts() as PamCliGlobalOptionsType;
      this.applyRuntime({
        url: leaf.url || root.url,
        domain: leaf.domain || root.domain,
        local: Boolean(leaf.local || root.local)
      });
    });

    this.registerLogin(program);
    this.registerLogout(program);
    this.registerConfig(program);
    this.registerLocales(program);

    const projects = program
      .command('projects')
      .description('List PAM projects')
      .argument('[keyword]', 'Optional search keyword')
      .action(async (keyword?: string) => {
        await new ProjectsCommand(this.apiClient).run(keyword);
      });
    this.addRuntimeOptions(projects);

    const init = program
      .command('init')
      .description(
        'Interactively create a PAM project from the current directory'
      )
      .option('-o, --out <dir>', 'Working directory (default: cwd)')
      .action(async (options: { out?: string }) => {
        this.bindOutDir(options.out);
        await new InitCommand(this.apiClient, this.authStore).run({
          outDir: options.out
        });
      });
    this.addRuntimeOptions(init);

    const fork = program
      .command('fork')
      .description(
        'Fork a readable PAM project (sensitive values cleared)'
      )
      .argument('<slug|id>', 'Source project slug or project id')
      .option('--slug <slug>', 'Slug for the forked project')
      .option('--name <name>', 'Display name for the forked project')
      .option('-y, --yes', 'Use defaults / flags without confirmation')
      .action(
        async (
          projectRef: string,
          options: { slug?: string; name?: string; yes?: boolean }
        ) => {
          await new ForkCommand(this.apiClient).run(projectRef, {
            slug: options.slug,
            name: options.name,
            yes: options.yes
          });
        }
      );
    this.addRuntimeOptions(fork);

    const pull = program
      .command('pull')
      .description('Pull decrypted environments into the current directory')
      .argument('<slug|id>', 'Project slug or project id')
      .option('-e, --env <name>', 'Environment name (default: first)')
      .option('-o, --out <dir>', 'Output directory (default: cwd)')
      .option('-f, --force', 'Overwrite local file on conflict without asking')
      .option(
        '--show-values',
        'Show non-sensitive values in conflict review (default: mask all)'
      )
      .action(
        async (
          projectRef: string,
          options: {
            env?: string;
            out?: string;
            force?: boolean;
            showValues?: boolean;
          }
        ) => {
          this.bindOutDir(options.out);
          await new PullCommand(this.apiClient, this.syncStore).run(
            projectRef,
            {
              envName: options.env,
              outDir: options.out,
              force: options.force,
              showValues: options.showValues
            }
          );
        }
      );
    this.addRuntimeOptions(pull);

    const push = program
      .command('push')
      .description('Push local dotenv files back to PAM environments')
      .argument('<slug|id>', 'Project slug or project id')
      .option('-e, --env <name>', 'Environment name (default: first)')
      .option('-o, --out <dir>', 'Local directory (default: cwd)')
      .option(
        '-y, --yes',
        'Skip ordinary confirmation prompts (not sync-conflict overwrite)'
      )
      .option(
        '-f, --force',
        'Overwrite remote on sync conflict without asking (does not imply -y)'
      )
      .option(
        '--show-values',
        'Show non-sensitive values in push review (default: mask all)'
      )
      .action(
        async (
          projectRef: string,
          options: {
            env?: string;
            out?: string;
            yes?: boolean;
            force?: boolean;
            showValues?: boolean;
          }
        ) => {
          this.bindOutDir(options.out);
          await new PushCommand(
            this.apiClient,
            this.syncStore,
            this.authStore
          ).run(projectRef, {
            envName: options.env,
            outDir: options.out,
            yes: options.yes,
            force: options.force,
            showValues: options.showValues
          });
        }
      );
    this.addRuntimeOptions(push);

    const remove = program
      .command('remove')
      .description('Delete a PAM environment from a project (owner only)')
      .argument('<slug|id>', 'Project slug or project id')
      .requiredOption('-e, --env <name>', 'Environment name to delete')
      .option('-y, --yes', 'Skip confirmation prompts')
      .action(
        async (
          projectRef: string,
          options: { env?: string; yes?: boolean }
        ) => {
          await new RemoveCommand(this.apiClient, this.syncStore).run(
            projectRef,
            {
              envName: options.env,
              yes: options.yes
            }
          );
        }
      );
    this.addRuntimeOptions(remove);

    await program.parseAsync(argv);
  }

  /**
   * Formats an error for stderr, translating API `id` when locale cache exists.
   *
   * @param error - Thrown value
   */
  public async formatCliError(error: unknown): Promise<string> {
    if (error instanceof PamCliApiError) {
      await this.localeCatalog.ensureLoaded();
      return error.formatForCli((id) => this.localeCatalog.t(id));
    }
    return error instanceof Error ? error.message : String(error);
  }

  protected registerLogin(program: Command): void {
    const login = program
      .command('login')
      .description(
        'Login and store CLI token (browser by default; use --local for cwd/.pam)'
      )
      .option('--url <url>', 'PAM base URL (overrides config / --domain)')
      .option('--browser', 'Force browser device login (default)', true)
      .option('--password', 'Use email/password login instead of browser')
      .option('--email <email>', 'Account email (password login)')
      .option(
        '--password-value <password>',
        'Account password for non-interactive password login'
      )
      .action(async (options: {
        url?: string;
        email?: string;
        password?: boolean;
        passwordValue?: string;
        browser?: boolean;
        domain?: string;
      }) => {
        const url =
          options.url?.trim() ||
          this.resolveHostOverride(undefined, options.domain);
        await new LoginCommand(this.authStore, this.apiClient).run({
          url,
          email: options.email,
          browser: options.password ? false : options.browser,
          password: options.password
            ? options.passwordValue || true
            : options.passwordValue
        });
      });
    login
      .option(
        '--domain <host>',
        'Same as --url; bare host allowed (e.g. pam.localhost:3400)'
      )
      .option(
        '--local',
        'Use ./.pam config + sync under the working directory (not ~/.pam)'
      );
  }

  protected registerLogout(program: Command): void {
    const logout = program
      .command('logout')
      .description('Revoke CLI token on server and clear local auth/sync state')
      .action(async () => {
        try {
          await this.apiClient.revokeCliToken();
        } catch (error) {
          console.warn(
            `Server token revoke failed (continuing local logout):\n${await this.formatCliError(error)}`
          );
        }
        await this.authStore.clearToken();
        await this.syncStore.clearAll();
        console.log(
          `Logged out (server revoke + local token/sync cleared).\nConfig: ${this.authStore.getActiveConfigPath()}`
        );
      });
    this.addRuntimeOptions(logout);
  }

  protected registerConfig(program: Command): void {
    const config = program
      .command('config')
      .description('Get or set pamenv config (domain, locale, …)');

    const setCmd = config
      .command('set')
      .description('Set a config value')
      .argument('<key>', 'domain | url | locale')
      .argument('<value>', 'Config value')
      .action(async (key: string, value: string) => {
        await new ConfigCommand(this.authStore, this.localeCatalog).set(
          key,
          value
        );
      });
    this.addRuntimeOptions(setCmd);

    const getCmd = config
      .command('get')
      .description('Get a config value')
      .argument('<key>', 'domain | url | locale | email | path')
      .action(async (key: string) => {
        await new ConfigCommand(this.authStore, this.localeCatalog).get(key);
      });
    this.addRuntimeOptions(getCmd);

    const listCmd = config
      .command('list')
      .description('List non-secret config values')
      .action(async () => {
        await new ConfigCommand(this.authStore, this.localeCatalog).list();
      });
    this.addRuntimeOptions(listCmd);

    this.addRuntimeOptions(config);
  }

  protected registerLocales(program: Command): void {
    const locales = program
      .command('locales')
      .description('Manage cached PAM locale files for CLI error messages');

    const pull = locales
      .command('pull')
      .description('Download locale JSON from the configured PAM baseUrl')
      .action(async () => {
        await new LocalesCommand(this.authStore, this.localeCatalog).pull();
      });
    this.addRuntimeOptions(pull);
    this.addRuntimeOptions(locales);
  }

  protected addRuntimeOptions(command: Command): void {
    command
      .option('--url <url>', 'PAM base URL for this process (overrides config)')
      .option(
        '--domain <host>',
        'Same as --url; bare host allowed (e.g. pam.localhost:3400)'
      )
      .option(
        '--local',
        'Use ./.pam config + sync under the working directory (not ~/.pam)'
      );
  }

  protected applyRuntime(globals: PamCliGlobalOptionsType): void {
    if (globals.url?.trim() && globals.domain?.trim()) {
      throw new Error('Use only one of --url or --domain, not both.');
    }

    const urlOverride = this.resolveHostOverride(globals.url, globals.domain);
    const preferLocal = Boolean(globals.local);
    const workingDir = process.cwd();

    this.authStore = new PamCliAuthStore({
      preferLocal,
      workingDir,
      ...(urlOverride ? { urlOverride } : {})
    });
    this.syncStore = new PamCliSyncStore({
      preferLocal,
      workingDir
    });
    this.apiClient = new PamCliApiClient(this.authStore);
    this.localeCatalog = new PamCliLocaleCatalog(this.authStore);

    if (preferLocal) {
      console.log(
        `Using local PAM config root: ${PamCliConfig.getLocalRoot(workingDir)}`
      );
    }
  }

  protected bindOutDir(outDir?: string): void {
    if (!outDir?.trim()) {
      return;
    }
    const workingDir = resolve(outDir);
    this.authStore.setWorkingDir(workingDir);
    this.syncStore.setWorkingDir(workingDir);
  }

  protected resolveHostOverride(
    url?: string,
    domain?: string
  ): string | undefined {
    const raw = url?.trim() || domain?.trim();
    if (!raw) {
      return undefined;
    }
    return PamCliConfig.normalizeOrigin(raw);
  }
}
