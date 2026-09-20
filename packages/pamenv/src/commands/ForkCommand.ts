import { confirm, input } from '@inquirer/prompts';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_CANCELLED,
  PAMENV_CLI_FORKED,
  PAMENV_CLI_FORK_CONFIRM,
  PAMENV_CLI_FORK_FILL_SECRETS,
  PAMENV_CLI_FORK_NAME_REQUIRED,
  PAMENV_CLI_FORK_NO_ENVS,
  PAMENV_CLI_FORK_PROMPT_NAME,
  PAMENV_CLI_FORK_PROMPT_SLUG,
  PAMENV_CLI_FORK_SENSITIVE_CLEARED,
  PAMENV_CLI_FORK_SOURCE,
  PAMENV_CLI_PROJECT_EXISTS_ENVS,
  PAMENV_CLI_SLUG_REQUIRED
} from '../i18n/identifier/pamenv_cli';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCliForkProjectInputType } from '../interfaces/PamCliTypes';
import { PamCliLocalProjectScanUtil } from '../impls/PamCliLocalProjectScanUtil';
import { PamCliProjectResolveUtil } from '../impls/PamCliProjectResolveUtil';

export type PamCliForkOptionsType = {
  readonly slug?: string;
  readonly name?: string;
  /** Skip confirmation and use defaults / provided flags. */
  readonly yes?: boolean;
};

/**
 * `pamenv fork` — clone a readable PAM project (sensitive values stripped).
 *
 * Significance: Matches the Web fork flow for terminal users.
 * Core idea: Resolve source → confirm slug/name → POST /api/pam/fork/:id.
 * Main function: Create a private owned copy without copying secrets.
 * Main purpose: Derive a personal project from a public or owned template.
 *
 * @example
 * await new ForkCommand(api).run('demo-app', { yes: true });
 */
export class ForkCommand {
  constructor(protected readonly apiClient: PamCliApiClientInterface) {}

  /**
   * @param projectRef - Source project slug or id
   * @param options - Optional slug/name overrides and skip-confirm
   */
  public async run(
    projectRef: string,
    options: PamCliForkOptionsType = {}
  ): Promise<void> {
    const source = await PamCliProjectResolveUtil.resolve(
      this.apiClient,
      projectRef
    );

    const defaultSlug = this.defaultForkSlug(source.slug);
    const defaultName = this.defaultForkName(source.name);

    let slug = options.slug?.trim() || '';
    let name = options.name?.trim() || '';

    if (!options.yes) {
      console.log(
        PamCliI18n.t(PAMENV_CLI_FORK_SOURCE, {
          slug: source.slug,
          name: source.name
        })
      );
      console.log(PamCliI18n.t(PAMENV_CLI_FORK_SENSITIVE_CLEARED));

      if (!slug) {
        slug = await input({
          message: PamCliI18n.t(PAMENV_CLI_FORK_PROMPT_SLUG),
          default: defaultSlug,
          validate: (value: string): true | string => {
            const normalized = PamCliLocalProjectScanUtil.toSlug(value);
            if (!normalized) {
              return PamCliI18n.t(PAMENV_CLI_SLUG_REQUIRED);
            }
            return true;
          }
        });
        slug = PamCliLocalProjectScanUtil.toSlug(slug);
      }

      if (!name) {
        name = await input({
          message: PamCliI18n.t(PAMENV_CLI_FORK_PROMPT_NAME),
          default: defaultName,
          validate: (value: string): true | string => {
            if (!value.trim()) {
              return PamCliI18n.t(PAMENV_CLI_FORK_NAME_REQUIRED);
            }
            return true;
          }
        });
        name = name.trim();
      }

      const ok = await confirm({
        message: PamCliI18n.t(PAMENV_CLI_FORK_CONFIRM, { slug, name }),
        default: true
      });
      if (!ok) {
        console.log(PamCliI18n.t(PAMENV_CLI_CANCELLED));
        return;
      }
    } else {
      slug = slug || defaultSlug;
      name = name || defaultName;
    }

    const payload: PamCliForkProjectInputType = {
      slug,
      name
    };

    const created = await this.apiClient.forkProject(source.id, payload);
    const envNames =
      created.environments?.map((env) => env.name).filter(Boolean) || [];

    console.log(
      PamCliI18n.t(PAMENV_CLI_FORKED, {
        source: source.slug,
        slug: created.slug,
        id: created.id
      })
    );
    if (envNames.length > 0) {
      console.log(
        PamCliI18n.t(PAMENV_CLI_PROJECT_EXISTS_ENVS, {
          envs: envNames.join(', ')
        })
      );
      console.log(PamCliI18n.t(PAMENV_CLI_FORK_FILL_SECRETS));
      console.log(`  pamenv push ${created.slug} -e ${envNames[0]}`);
    } else {
      console.log(PamCliI18n.t(PAMENV_CLI_FORK_NO_ENVS));
    }
  }

  protected defaultForkSlug(sourceSlug: string): string {
    const trimmed = sourceSlug.trim();
    if (trimmed.endsWith('-fork')) {
      return trimmed;
    }
    return `${trimmed}-fork`;
  }

  protected defaultForkName(sourceName: string): string {
    const trimmed = sourceName.trim();
    if (trimmed.endsWith('(fork)')) {
      return trimmed;
    }
    return `${trimmed} (fork)`;
  }
}
