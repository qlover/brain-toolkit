import { resolve } from 'node:path';
import { checkbox, confirm, input, select } from '@inquirer/prompts';
import { PamCliConfig } from '../config/PamCliConfig';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type {
  PamCliCreateEnvironmentInputType,
  PamCliCreateProjectInputType,
  PamCliProjectType
} from '../interfaces/PamCliTypes';
import { PamCliLocalEnvFileUtil } from '../impls/PamCliLocalEnvFileUtil';
import {
  PamCliLocalProjectScanUtil,
  type PamCliLocalProjectScanType
} from '../impls/PamCliLocalProjectScanUtil';
import { PamCliProjectResolveUtil } from '../impls/PamCliProjectResolveUtil';

const CATEGORY_BACKEND = '后端' as const;
const CATEGORY_FRONTEND = '前端' as const;

/**
 * `pamenv init` — interactive project bootstrap from the working directory.
 *
 * Significance: Creates a PAM project without the web UI (npm-init style).
 * Core idea: Scan local defaults, prompt for confirmation, create once.
 * Main function: Collect slug/name/envs, detect existing slug, POST create.
 * Main purpose: First-time link from a local repo to PAM.
 *
 * @example
 * await new InitCommand(api).run({ outDir: process.cwd() });
 */
export class InitCommand {
  constructor(
    protected readonly apiClient: PamCliApiClientInterface,
    protected readonly authStore?: PamCliAuthStoreInterface
  ) {}

  /**
   * Runs the interactive init flow.
   *
   * @param options - Optional working directory override
   */
  public async run(options: { readonly outDir?: string } = {}): Promise<void> {
    const cwd = resolve(options.outDir || process.cwd());
    await this.apiClient.listProjects();

    console.log(`Scanning ${cwd} ...`);
    const scan = await PamCliLocalProjectScanUtil.scan(cwd);
    this.printScanSummary(scan);

    const name = await input({
      message: 'project name',
      default: scan.defaultName || undefined,
      validate: (value: string): true | string => {
        if (!value.trim()) {
          return 'Project name is required';
        }
        return true;
      }
    });
    const trimmedName = name.trim();

    const slugFromName = PamCliLocalProjectScanUtil.toSlug(trimmedName);
    const slug = await this.promptSlug(slugFromName);
    const existing = await this.findExistingBySlug(slug);
    if (existing) {
      this.printExistingProject(existing);
      return;
    }

    const description = await input({
      message: 'description',
      default: scan.description || ''
    });

    const category = await select({
      message: 'category',
      default: CATEGORY_BACKEND,
      choices: [
        { name: CATEGORY_BACKEND, value: CATEGORY_BACKEND },
        { name: CATEGORY_FRONTEND, value: CATEGORY_FRONTEND }
      ]
    });

    const repoUrl = await input({
      message: 'repository url',
      default: scan.repoUrl || ''
    });

    const environments = await this.promptEnvironments(scan);

    const payload = this.buildCreatePayload({
      slug,
      name: trimmedName,
      description: description.trim(),
      category,
      repoUrl: repoUrl.trim(),
      environments
    });

    console.log('');
    console.log('About to create:');
    console.log(`  slug:     ${payload.slug}`);
    console.log(`  name:     ${payload.name}`);
    console.log(`  category: ${payload.category}`);
    console.log(`  repo:     ${payload.repo_url || '(none)'}`);
    if ((payload.environments || []).length === 0) {
      console.log('  envs:     (none)');
    } else {
      for (const env of payload.environments || []) {
        console.log(`  env:      ${env.name} → ${env.url}`);
      }
    }

    const confirmed = await confirm({
      message: 'Create this PAM project?',
      default: true
    });
    if (!confirmed) {
      console.log('Cancelled.');
      return;
    }

    const created = await this.apiClient.createProject(payload);
    console.log(`Created project "${created.slug}" (${created.id}).`);
    await this.printProjectDetailHint(created.slug);
    if (environments.length === 0) {
      console.log(
        'No environments were created. Add them in the PAM UI, or re-run init after adding .env files.'
      );
      return;
    }

    console.log('Next: push local dotenv files, for example:');
    for (const env of environments) {
      const fileName = PamCliLocalEnvFileUtil.toFileName(env.name);
      console.log(`  pamenv push ${created.slug} -e ${env.name}`);
      console.log(`    (reads ${fileName} in the project directory)`);
    }
  }

  /**
   * Prints a browser URL for the project general page when auth store is available.
   *
   * @param slug - Project slug
   */
  protected async printProjectDetailHint(slug: string): Promise<void> {
    if (!this.authStore) {
      return;
    }
    const [baseUrl, locale] = await Promise.all([
      this.authStore.getBaseUrl(),
      this.authStore.getLocale()
    ]);
    const detailUrl = PamCliConfig.buildProjectGeneralUrl(
      baseUrl,
      locale,
      slug
    );
    console.log(`You can also open ${detailUrl} to view project details.`);
  }

  protected printScanSummary(scan: PamCliLocalProjectScanType): void {
    if (scan.packageName) {
      console.log(`  package.json: ${scan.packageName}`);
    } else {
      console.log('  package.json: (not found)');
    }
    if (scan.homepageUrl) {
      console.log(`  homepage:     ${scan.homepageUrl}`);
    } else {
      console.log('  homepage:     (not found)');
    }
    if (scan.repoUrl) {
      console.log(`  git origin:   ${scan.repoUrl}`);
    } else {
      console.log('  git origin:   (not found)');
    }
    if (scan.envFiles.length > 0) {
      const listed = scan.envFiles
        .map((file) => `${file.fileName} → ${file.envName}`)
        .join(', ');
      console.log(`  env files:    ${listed}`);
    } else {
      console.log('  env files:    (none)');
    }
    console.log('');
  }

  protected async promptSlug(defaultSlug: string): Promise<string> {
    const slugInput = await input({
      message: 'project slug (globally unique)',
      ...(defaultSlug ? { default: defaultSlug } : {}),
      validate: (value: string): true | string => {
        const normalized = PamCliLocalProjectScanUtil.toSlug(value);
        if (!normalized) {
          return 'Slug is required (letters, numbers, dashes)';
        }
        return true;
      }
    });

    return PamCliLocalProjectScanUtil.toSlug(slugInput);
  }

  protected async findExistingBySlug(
    slug: string
  ): Promise<PamCliProjectType | null> {
    const searched = await this.apiClient.listProjects(slug);
    return PamCliProjectResolveUtil.findExactSlug(searched, slug) || null;
  }

  protected printExistingProject(project: PamCliProjectType): void {
    const envNames = (project.environments || [])
      .map((env) => env.name)
      .join(', ');

    if (project.is_owner) {
      console.log(`Project "${project.slug}" already exists and you own it.`);
      if (envNames) {
        console.log(`Environments: ${envNames}`);
      }
      console.log(
        `Use \`pamenv push ${project.slug} -e <env>\` to upload dotenv files.`
      );
      return;
    }

    console.log(`Slug "${project.slug}" is already taken by another project.`);
    console.log('Choose a different slug and run `pamenv init` again.');
  }

  /**
   * Builds environments only when local `.env*` files exist.
   * Without env files and without homepage URL, skips environments entirely.
   */
  protected async promptEnvironments(
    scan: PamCliLocalProjectScanType
  ): Promise<PamCliCreateEnvironmentInputType[]> {
    if (scan.envNames.length === 0) {
      if (!scan.homepageUrl) {
        console.log(
          'No .env files and no package homepage — skipping environments.'
        );
        return [];
      }
      console.log(
        'No .env files found — skipping environments (homepage alone is not enough).'
      );
      return [];
    }

    const selectedNames = await checkbox({
      message: 'environments to create',
      choices: scan.envNames.map((envName) => {
        const sources = scan.envFiles
          .filter((file) => file.envName === envName)
          .map((file) => file.fileName);
        return {
          name: `${envName} (${sources.join(', ')})`,
          value: envName,
          checked: true
        };
      })
    });

    if (selectedNames.length === 0) {
      console.log('No environments selected — creating project without envs.');
      return [];
    }

    const environments: PamCliCreateEnvironmentInputType[] = [];
    for (const defaultName of selectedNames) {
      console.log('');
      const sources = scan.envFiles
        .filter((file) => file.envName === defaultName)
        .map((file) => file.fileName)
        .join(', ');
      console.log(`Configure environment from ${sources}:`);

      const envName = await input({
        message: '  env name',
        default: defaultName,
        validate: (value: string): true | string => {
          if (!value.trim()) {
            return 'Environment name is required';
          }
          return true;
        }
      });

      const defaultEnvUrl = PamCliLocalProjectScanUtil.defaultEnvUrl(scan);
      const envUrl = await input({
        message: '  env url',
        ...(defaultEnvUrl ? { default: defaultEnvUrl } : {}),
        validate: (value: string): true | string => {
          if (!PamCliLocalProjectScanUtil.isValidEnvUrl(value)) {
            return 'A valid http(s) URL is required';
          }
          return true;
        }
      });

      environments.push({
        name: envName.trim(),
        url: PamCliLocalProjectScanUtil.normalizeHomepageUrl(envUrl),
        variables: []
      });
    }

    const names = environments.map((env) => env.name);
    if (new Set(names).size !== names.length) {
      throw new Error('Duplicate environment names after editing');
    }

    return environments;
  }

  protected buildCreatePayload(params: {
    readonly slug: string;
    readonly name: string;
    readonly description: string;
    readonly category: string;
    readonly repoUrl: string;
    readonly environments: readonly PamCliCreateEnvironmentInputType[];
  }): PamCliCreateProjectInputType {
    return {
      slug: params.slug,
      name: params.name,
      category: params.category,
      is_public: 0,
      description: params.description,
      stack: '',
      repo_url: params.repoUrl,
      ...(params.environments.length > 0
        ? { environments: [...params.environments] }
        : {})
    };
  }
}
