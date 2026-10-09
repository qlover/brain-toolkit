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
import { PamCliSyncStore } from './impls/PamCliSyncStore';
import { PamCliI18n } from './i18n/PamCliI18n';
import {
  PAMENV_CLI_LOGOUT_DONE,
  PAMENV_CLI_LOGOUT_REVOKE_FAILED,
  PAMENV_CLI_URL_AND_DOMAIN_EXCLUSIVE,
  PAMENV_CLI_USING_LOCAL_ROOT
} from './i18n/identifier/pamenv_cli';
import {
  PAMENV_HELP_ARG_PROJECT,
  PAMENV_HELP_CONFIG,
  PAMENV_HELP_CONFIG_ARG_VALUE,
  PAMENV_HELP_CONFIG_GET,
  PAMENV_HELP_CONFIG_LIST,
  PAMENV_HELP_CONFIG_SET,
  PAMENV_HELP_FORK,
  PAMENV_HELP_FORK_ARG_SOURCE,
  PAMENV_HELP_FORK_OPT_NAME,
  PAMENV_HELP_FORK_OPT_SLUG,
  PAMENV_HELP_FORK_OPT_YES,
  PAMENV_HELP_HELP_COMMAND,
  PAMENV_HELP_HELP_OPTION,
  PAMENV_HELP_INIT,
  PAMENV_HELP_LOCALES,
  PAMENV_HELP_LOCALES_PULL,
  PAMENV_HELP_LOGIN,
  PAMENV_HELP_LOGIN_OPT_BROWSER,
  PAMENV_HELP_LOGIN_OPT_EMAIL,
  PAMENV_HELP_LOGIN_OPT_PASSWORD,
  PAMENV_HELP_LOGIN_OPT_PASSWORD_VALUE,
  PAMENV_HELP_LOGIN_OPT_URL,
  PAMENV_HELP_LOGOUT,
  PAMENV_HELP_OPT_DOMAIN,
  PAMENV_HELP_OPT_ENV,
  PAMENV_HELP_OPT_FILE,
  PAMENV_HELP_OPT_LOCAL,
  PAMENV_HELP_OPT_URL,
  PAMENV_HELP_OPT_WORKDIR,
  PAMENV_HELP_PROGRAM,
  PAMENV_HELP_PROJECTS,
  PAMENV_HELP_PROJECTS_ARG_KEYWORD,
  PAMENV_HELP_PULL,
  PAMENV_HELP_PULL_OPT_FORCE,
  PAMENV_HELP_PULL_OPT_OUT,
  PAMENV_HELP_PULL_OPT_SHOW_VALUES,
  PAMENV_HELP_PUSH,
  PAMENV_HELP_PUSH_OPT_FORCE,
  PAMENV_HELP_PUSH_OPT_OUT,
  PAMENV_HELP_PUSH_OPT_SHOW_VALUES,
  PAMENV_HELP_PUSH_OPT_YES,
  PAMENV_HELP_REMOVE,
  PAMENV_HELP_REMOVE_OPT_ENV,
  PAMENV_HELP_REMOVE_OPT_YES,
  PAMENV_HELP_TITLE_ARGUMENTS,
  PAMENV_HELP_TITLE_COMMANDS,
  PAMENV_HELP_TITLE_GLOBAL_OPTIONS,
  PAMENV_HELP_TITLE_OPTIONS,
  PAMENV_HELP_TITLE_USAGE,
  PAMENV_HELP_VERSION_OPTION
} from './i18n/identifier/pamenv_cli_help';
import { version } from '../package.json';

type PamCliGlobalOptionsType = {
  readonly url?: string;
  readonly domain?: string;
  readonly local?: boolean;
};

/** commander section titles → help i18n keys. */
const HELP_TITLE_KEYS: Readonly<Record<string, string>> = {
  'Usage:': PAMENV_HELP_TITLE_USAGE,
  'Arguments:': PAMENV_HELP_TITLE_ARGUMENTS,
  'Options:': PAMENV_HELP_TITLE_OPTIONS,
  'Global Options:': PAMENV_HELP_TITLE_GLOBAL_OPTIONS,
  'Commands:': PAMENV_HELP_TITLE_COMMANDS
};

const t = (key: string): string => PamCliI18n.t(key);

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

  /**
   * Parses argv and runs the selected command.
   *
   * @param argv - Process argv
   */
  public async run(argv: string[] = process.argv): Promise<void> {
    await this.loadHelpLocale(argv);

    const program = new Command();
    // Help settings are copied to subcommands on creation, so set them first.
    program
      .configureHelp({
        styleTitle: (title: string): string =>
          HELP_TITLE_KEYS[title] ? t(HELP_TITLE_KEYS[title]!) : title
      })
      .helpOption('-h, --help', t(PAMENV_HELP_HELP_OPTION))
      .helpCommand('help [command]', t(PAMENV_HELP_HELP_COMMAND));
    program
      .name('pamenv')
      .description(t(PAMENV_HELP_PROGRAM))
      .version(version, '-V, --version', t(PAMENV_HELP_VERSION_OPTION));

    this.addRuntimeOptions(program);

    program.hook('preAction', async (_thisCommand, actionCommand) => {
      const root = program.opts() as PamCliGlobalOptionsType;
      const leaf = actionCommand.opts() as PamCliGlobalOptionsType;
      this.applyRuntime({
        url: leaf.url || root.url,
        domain: leaf.domain || root.domain,
        local: Boolean(leaf.local || root.local)
      });
      await PamCliI18n.syncFromStore(this.authStore);
      if (leaf.local || root.local) {
        console.log(
          PamCliI18n.t(PAMENV_CLI_USING_LOCAL_ROOT, {
            path: PamCliConfig.getLocalRoot(process.cwd())
          })
        );
      }
    });

    this.registerLogin(program);
    this.registerLogout(program);
    this.registerConfig(program);
    this.registerLocales(program);

    const projects = program
      .command('projects')
      .description(t(PAMENV_HELP_PROJECTS))
      .argument('[keyword]', t(PAMENV_HELP_PROJECTS_ARG_KEYWORD))
      .action(async (keyword?: string) => {
        await new ProjectsCommand(this.apiClient).run(keyword);
      });
    this.addRuntimeOptions(projects);

    const init = program
      .command('init')
      .description(t(PAMENV_HELP_INIT))
      .option('-o, --out <dir>', t(PAMENV_HELP_OPT_WORKDIR))
      .action(async (options: { out?: string }) => {
        this.bindOutDir(options.out);
        await new InitCommand(this.apiClient, this.authStore).run({
          outDir: options.out
        });
      });
    this.addRuntimeOptions(init);

    const fork = program
      .command('fork')
      .description(t(PAMENV_HELP_FORK))
      .argument('<slug|id>', t(PAMENV_HELP_FORK_ARG_SOURCE))
      .option('--slug <slug>', t(PAMENV_HELP_FORK_OPT_SLUG))
      .option('--name <name>', t(PAMENV_HELP_FORK_OPT_NAME))
      .option('-y, --yes', t(PAMENV_HELP_FORK_OPT_YES))
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
      .description(t(PAMENV_HELP_PULL))
      .argument('<slug|id>', t(PAMENV_HELP_ARG_PROJECT))
      .option('-e, --env <name>', t(PAMENV_HELP_OPT_ENV))
      .option('-o, --out <dir>', t(PAMENV_HELP_PULL_OPT_OUT))
      .option('--file <path>', t(PAMENV_HELP_OPT_FILE))
      .option('-f, --force', t(PAMENV_HELP_PULL_OPT_FORCE))
      .option('--show-values', t(PAMENV_HELP_PULL_OPT_SHOW_VALUES))
      .action(
        async (
          projectRef: string,
          options: {
            env?: string;
            out?: string;
            file?: string;
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
              file: options.file,
              force: options.force,
              showValues: options.showValues
            }
          );
        }
      );
    this.addRuntimeOptions(pull);

    const push = program
      .command('push')
      .description(t(PAMENV_HELP_PUSH))
      .argument('<slug|id>', t(PAMENV_HELP_ARG_PROJECT))
      .option('-e, --env <name>', t(PAMENV_HELP_OPT_ENV))
      .option('-o, --out <dir>', t(PAMENV_HELP_PUSH_OPT_OUT))
      .option('--file <path>', t(PAMENV_HELP_OPT_FILE))
      .option('-y, --yes', t(PAMENV_HELP_PUSH_OPT_YES))
      .option('-f, --force', t(PAMENV_HELP_PUSH_OPT_FORCE))
      .option('--show-values', t(PAMENV_HELP_PUSH_OPT_SHOW_VALUES))
      .action(
        async (
          projectRef: string,
          options: {
            env?: string;
            out?: string;
            file?: string;
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
            file: options.file,
            yes: options.yes,
            force: options.force,
            showValues: options.showValues
          });
        }
      );
    this.addRuntimeOptions(push);

    const remove = program
      .command('remove')
      .description(t(PAMENV_HELP_REMOVE))
      .argument('<slug|id>', t(PAMENV_HELP_ARG_PROJECT))
      .requiredOption('-e, --env <name>', t(PAMENV_HELP_REMOVE_OPT_ENV))
      .option('-y, --yes', t(PAMENV_HELP_REMOVE_OPT_YES))
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
   * Formats an error for stderr, translating API `id` when locale catalog exists.
   *
   * @param error - Thrown value
   */
  public async formatCliError(error: unknown): Promise<string> {
    if (error instanceof PamCliApiError) {
      return error.formatForCli((id) => PamCliI18n.lookup(id));
    }
    return error instanceof Error ? error.message : String(error);
  }

  /**
   * Loads the configured locale before commands are registered so `--help`
   * (which skips `preAction`) is translated. Offline: no PAM API request.
   *
   * @param argv - Process argv (only `--local` is honoured here)
   */
  protected async loadHelpLocale(argv: readonly string[]): Promise<void> {
    try {
      const store = new PamCliAuthStore({
        preferLocal: argv.includes('--local'),
        workingDir: process.cwd()
      });
      PamCliI18n.setLocale(await store.getLocale());
    } catch {
      // Unreadable config: keep the current locale.
    }
    await PamCliI18n.ensureLoaded(PamCliI18n.getLocale());
    await PamCliI18n.ensureLoaded('en');
  }

  protected registerLogin(program: Command): void {
    const login = program
      .command('login')
      .description(t(PAMENV_HELP_LOGIN))
      .option('--url <url>', t(PAMENV_HELP_LOGIN_OPT_URL))
      .option('--browser', t(PAMENV_HELP_LOGIN_OPT_BROWSER), true)
      .option('--password', t(PAMENV_HELP_LOGIN_OPT_PASSWORD))
      .option('--email <email>', t(PAMENV_HELP_LOGIN_OPT_EMAIL))
      .option(
        '--password-value <password>',
        t(PAMENV_HELP_LOGIN_OPT_PASSWORD_VALUE)
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
      .option('--domain <host>', t(PAMENV_HELP_OPT_DOMAIN))
      .option('--local', t(PAMENV_HELP_OPT_LOCAL));
  }

  protected registerLogout(program: Command): void {
    const logout = program
      .command('logout')
      .description(t(PAMENV_HELP_LOGOUT))
      .action(async () => {
        try {
          await this.apiClient.revokeCliToken();
        } catch (error) {
          console.warn(
            PamCliI18n.t(PAMENV_CLI_LOGOUT_REVOKE_FAILED, {
              message: await this.formatCliError(error)
            })
          );
        }
        await this.authStore.clearToken();
        await this.syncStore.clearAll();
        console.log(
          PamCliI18n.t(PAMENV_CLI_LOGOUT_DONE, {
            path: this.authStore.getActiveConfigPath()
          })
        );
      });
    this.addRuntimeOptions(logout);
  }

  protected registerConfig(program: Command): void {
    const config = program
      .command('config')
      .description(t(PAMENV_HELP_CONFIG));

    const setCmd = config
      .command('set')
      .description(t(PAMENV_HELP_CONFIG_SET))
      .argument('<key>', 'domain | url | locale')
      .argument('<value>', t(PAMENV_HELP_CONFIG_ARG_VALUE))
      .action(async (key: string, value: string) => {
        await new ConfigCommand(this.authStore).set(
          key,
          value
        );
      });
    this.addRuntimeOptions(setCmd);

    const getCmd = config
      .command('get')
      .description(t(PAMENV_HELP_CONFIG_GET))
      .argument('<key>', 'domain | url | locale | email | path')
      .action(async (key: string) => {
        await new ConfigCommand(this.authStore).get(key);
      });
    this.addRuntimeOptions(getCmd);

    const listCmd = config
      .command('list')
      .description(t(PAMENV_HELP_CONFIG_LIST))
      .action(async () => {
        await new ConfigCommand(this.authStore).list();
      });
    this.addRuntimeOptions(listCmd);

    this.addRuntimeOptions(config);
  }

  protected registerLocales(program: Command): void {
    const locales = program
      .command('locales')
      .description(t(PAMENV_HELP_LOCALES));

    const pull = locales
      .command('pull')
      .description(t(PAMENV_HELP_LOCALES_PULL))
      .action(async () => {
        await new LocalesCommand(this.authStore).pull();
      });
    this.addRuntimeOptions(pull);
    this.addRuntimeOptions(locales);
  }

  protected addRuntimeOptions(command: Command): void {
    command
      .option('--url <url>', t(PAMENV_HELP_OPT_URL))
      .option('--domain <host>', t(PAMENV_HELP_OPT_DOMAIN))
      .option('--local', t(PAMENV_HELP_OPT_LOCAL));
  }

  protected applyRuntime(globals: PamCliGlobalOptionsType): void {
    if (globals.url?.trim() && globals.domain?.trim()) {
      throw new Error(PamCliI18n.t(PAMENV_CLI_URL_AND_DOMAIN_EXCLUSIVE));
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
