import { Command } from 'commander';
import { ForkCommand } from './commands/ForkCommand';
import { InitCommand } from './commands/InitCommand';
import { LoginCommand } from './commands/LoginCommand';
import { ProjectsCommand } from './commands/ProjectsCommand';
import { PullCommand } from './commands/PullCommand';
import { PushCommand } from './commands/PushCommand';
import { PamCliApiClient } from './impls/PamCliApiClient';
import { PamCliAuthStore } from './impls/PamCliAuthStore';
import { PamCliSyncStore } from './impls/PamCliSyncStore';
import { name, version } from '../package.json';

/**
 * pamenv application entry / command registrar.
 *
 * Significance: Wires stores, API client, and commands.
 * Core idea: Commander program with injected implementations.
 * Main function: Parse argv and dispatch commands.
 * Main purpose: Provide the `pam` binary UX.
 *
 * @example
 * await new PamCliApp().run(process.argv);
 */
export class PamCliApp {
  protected readonly authStore = new PamCliAuthStore();
  protected readonly apiClient = new PamCliApiClient(this.authStore);

  /**
   * Parses argv and runs the selected command.
   *
   * @param argv - Process argv
   */
  public async run(argv: string[] = process.argv): Promise<void> {
    const program = new Command();
    program.name('pamenv').description(name).version(version);

    program
      .command('login')
      .description(
        'Login and store CLI token under ~/.pam (browser by default)'
      )
      .option('--url <url>', 'PAM base URL')
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
      }) => {
        await new LoginCommand(this.authStore, this.apiClient).run({
          url: options.url,
          email: options.email,
          browser: options.password ? false : options.browser,
          password: options.password
            ? options.passwordValue || true
            : options.passwordValue
        });
      });

    program
      .command('logout')
      .description('Revoke CLI token on server and clear local auth/sync state')
      .action(async () => {
        try {
          await this.apiClient.revokeCliToken();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          console.warn(
            `Server token revoke failed (continuing local logout): ${message}`
          );
        }
        await this.authStore.clearToken();
        await new PamCliSyncStore().clearAll();
        console.log('Logged out (server revoke + local token/sync cleared).');
      });

    program
      .command('projects')
      .description('List PAM projects')
      .argument('[keyword]', 'Optional search keyword')
      .action(async (keyword?: string) => {
        await new ProjectsCommand(this.apiClient).run(keyword);
      });

    program
      .command('init')
      .description(
        'Interactively create a PAM project from the current directory'
      )
      .option('-o, --out <dir>', 'Working directory (default: cwd)')
      .action(async (options: { out?: string }) => {
        await new InitCommand(this.apiClient).run({
          outDir: options.out
        });
      });

    program
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

    program
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
          await new PullCommand(this.apiClient).run(projectRef, {
            envName: options.env,
            outDir: options.out,
            force: options.force,
            showValues: options.showValues
          });
        }
      );

    program
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
          await new PushCommand(this.apiClient).run(projectRef, {
            envName: options.env,
            outDir: options.out,
            yes: options.yes,
            force: options.force,
            showValues: options.showValues
          });
        }
      );

    await program.parseAsync(argv);
  }
}
