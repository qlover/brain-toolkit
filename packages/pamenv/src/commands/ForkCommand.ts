import { confirm, input } from '@inquirer/prompts';
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
      console.log(`Source: ${source.slug} (${source.name})`);
      console.log(
        'Sensitive variable values will be cleared on the forked project.'
      );

      if (!slug) {
        slug = await input({
          message: 'fork slug',
          default: defaultSlug,
          validate: (value: string): true | string => {
            const normalized = PamCliLocalProjectScanUtil.toSlug(value);
            if (!normalized) {
              return 'Slug is required (letters, numbers, dashes)';
            }
            return true;
          }
        });
        slug = PamCliLocalProjectScanUtil.toSlug(slug);
      }

      if (!name) {
        name = await input({
          message: 'fork name',
          default: defaultName,
          validate: (value: string): true | string => {
            if (!value.trim()) {
              return 'Name is required';
            }
            return true;
          }
        });
        name = name.trim();
      }

      const ok = await confirm({
        message: `Fork into "${slug}" / "${name}"?`,
        default: true
      });
      if (!ok) {
        console.log('Cancelled.');
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

    console.log(`Forked "${source.slug}" → "${created.slug}" (${created.id}).`);
    if (envNames.length > 0) {
      console.log(`Environments: ${envNames.join(', ')}`);
      console.log('Fill secrets then push, for example:');
      console.log(`  pamenv push ${created.slug} -e ${envNames[0]}`);
    } else {
      console.log(
        `No environments on the fork. Add some in the PAM UI or via init elsewhere.`
      );
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
