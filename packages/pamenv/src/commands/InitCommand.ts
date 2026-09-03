import { resolve } from 'node:path';
import { checkbox, confirm, input, select } from '@inquirer/prompts';
import { PamCliConfig } from '../config/PamCliConfig';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_ABOUT_TO_CREATE,
  PAMENV_CLI_CANCELLED,
  PAMENV_CLI_CATEGORY_CUSTOM,
  PAMENV_CLI_CATEGORY_REQUIRED,
  PAMENV_CLI_CONFIGURE_ENV_FROM,
  PAMENV_CLI_CREATED_PROJECT,
  PAMENV_CLI_CREATE_CONFIRM,
  PAMENV_CLI_DUPLICATE_ENV_NAMES,
  PAMENV_CLI_ENV_NAME_REQUIRED,
  PAMENV_CLI_ENV_URL_REQUIRED,
  PAMENV_CLI_LABEL_NONE,
  PAMENV_CLI_NEXT_PUSH,
  PAMENV_CLI_NEXT_PUSH_READS,
  PAMENV_CLI_NO_ENVS_CREATED,
  PAMENV_CLI_NO_ENVS_SELECTED,
  PAMENV_CLI_OPEN_PROJECT_DETAIL,
  PAMENV_CLI_PROJECT_EXISTS_ENVS,
  PAMENV_CLI_PROJECT_EXISTS_OWNED,
  PAMENV_CLI_PROJECT_EXISTS_PUSH_HINT,
  PAMENV_CLI_PROJECT_NAME_REQUIRED,
  PAMENV_CLI_PROMPT_CATEGORY,
  PAMENV_CLI_PROMPT_CATEGORY_CUSTOM,
  PAMENV_CLI_PROMPT_DESCRIPTION,
  PAMENV_CLI_PROMPT_ENVS_TO_CREATE,
  PAMENV_CLI_PROMPT_ENV_NAME,
  PAMENV_CLI_PROMPT_ENV_URL,
  PAMENV_CLI_PROMPT_PROJECT_NAME,
  PAMENV_CLI_PROMPT_REPO_URL,
  PAMENV_CLI_PROMPT_SLUG,
  PAMENV_CLI_SCANNING,
  PAMENV_CLI_SCAN_ENV_FILES,
  PAMENV_CLI_SCAN_ENV_FILES_NONE,
  PAMENV_CLI_SCAN_GIT,
  PAMENV_CLI_SCAN_GIT_MISSING,
  PAMENV_CLI_SCAN_HOMEPAGE,
  PAMENV_CLI_SCAN_HOMEPAGE_MISSING,
  PAMENV_CLI_SCAN_PACKAGE,
  PAMENV_CLI_SCAN_PACKAGE_MISSING,
  PAMENV_CLI_SKIP_ENVS_NO_FILES,
  PAMENV_CLI_SKIP_ENVS_NO_FILES_NO_HOME,
  PAMENV_CLI_SLUG_REQUIRED,
  PAMENV_CLI_SLUG_TAKEN,
  PAMENV_CLI_SLUG_TAKEN_RETRY
} from '../i18n/identifier/pamenv_cli';
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
import { PamCliProjectAccessUtil } from '../impls/PamCliProjectAccessUtil';
import { PamCliProjectResolveUtil } from '../impls/PamCliProjectResolveUtil';

const CATEGORY_CUSTOM_VALUE = '__custom__' as const;

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
    if (this.authStore) {
      await PamCliI18n.syncFromStore(this.authStore);
    }
    const cwd = resolve(options.outDir || process.cwd());
    await this.apiClient.listProjects();

    console.log(PamCliI18n.t(PAMENV_CLI_SCANNING, { cwd }));
    const scan = await PamCliLocalProjectScanUtil.scan(cwd);
    this.printScanSummary(scan);

    const name = await input({
      message: PamCliI18n.t(PAMENV_CLI_PROMPT_PROJECT_NAME),
      default: scan.defaultName || undefined,
      validate: (value: string): true | string => {
        if (!value.trim()) {
          return PamCliI18n.t(PAMENV_CLI_PROJECT_NAME_REQUIRED);
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
      message: PamCliI18n.t(PAMENV_CLI_PROMPT_DESCRIPTION),
      default: scan.description || ''
    });

    const category = await this.promptCategory();

    const repoUrl = await input({
      message: PamCliI18n.t(PAMENV_CLI_PROMPT_REPO_URL),
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
    console.log(PamCliI18n.t(PAMENV_CLI_ABOUT_TO_CREATE));
    console.log(`  slug:     ${payload.slug}`);
    console.log(`  name:     ${payload.name}`);
    console.log(`  category: ${payload.category}`);
    console.log(
      `  repo:     ${payload.repo_url || PamCliI18n.t(PAMENV_CLI_LABEL_NONE)}`
    );
    if ((payload.environments || []).length === 0) {
      console.log(`  envs:     ${PamCliI18n.t(PAMENV_CLI_LABEL_NONE)}`);
    } else {
      for (const env of payload.environments || []) {
        console.log(`  env:      ${env.name} → ${env.url}`);
      }
    }

    const confirmed = await confirm({
      message: PamCliI18n.t(PAMENV_CLI_CREATE_CONFIRM),
      default: true
    });
    if (!confirmed) {
      console.log(PamCliI18n.t(PAMENV_CLI_CANCELLED));
      return;
    }

    const created = await this.apiClient.createProject(payload);
    console.log(
      PamCliI18n.t(PAMENV_CLI_CREATED_PROJECT, {
        slug: created.slug,
        id: created.id
      })
    );
    await this.printProjectDetailHint(created.slug);
    if (environments.length === 0) {
      console.log(PamCliI18n.t(PAMENV_CLI_NO_ENVS_CREATED));
      return;
    }

    console.log(PamCliI18n.t(PAMENV_CLI_NEXT_PUSH));
    for (const env of environments) {
      const fileName = PamCliLocalEnvFileUtil.toFileName(env.name);
      console.log(`  pamenv push ${created.slug} -e ${env.name}`);
      console.log(
        PamCliI18n.t(PAMENV_CLI_NEXT_PUSH_READS, { fileName })
      );
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
    console.log(
      PamCliI18n.t(PAMENV_CLI_OPEN_PROJECT_DETAIL, { url: detailUrl })
    );
  }

  protected printScanSummary(scan: PamCliLocalProjectScanType): void {
    if (scan.packageName) {
      console.log(
        PamCliI18n.t(PAMENV_CLI_SCAN_PACKAGE, { value: scan.packageName })
      );
    } else {
      console.log(PamCliI18n.t(PAMENV_CLI_SCAN_PACKAGE_MISSING));
    }
    if (scan.homepageUrl) {
      console.log(
        PamCliI18n.t(PAMENV_CLI_SCAN_HOMEPAGE, { value: scan.homepageUrl })
      );
    } else {
      console.log(PamCliI18n.t(PAMENV_CLI_SCAN_HOMEPAGE_MISSING));
    }
    if (scan.repoUrl) {
      console.log(
        PamCliI18n.t(PAMENV_CLI_SCAN_GIT, { value: scan.repoUrl })
      );
    } else {
      console.log(PamCliI18n.t(PAMENV_CLI_SCAN_GIT_MISSING));
    }
    if (scan.envFiles.length > 0) {
      const listed = scan.envFiles
        .map((file) => `${file.fileName} → ${file.envName}`)
        .join(', ');
      console.log(PamCliI18n.t(PAMENV_CLI_SCAN_ENV_FILES, { value: listed }));
    } else {
      console.log(PamCliI18n.t(PAMENV_CLI_SCAN_ENV_FILES_NONE));
    }
    console.log('');
  }

  protected async promptSlug(defaultSlug: string): Promise<string> {
    const slugInput = await input({
      message: PamCliI18n.t(PAMENV_CLI_PROMPT_SLUG),
      ...(defaultSlug ? { default: defaultSlug } : {}),
      validate: (value: string): true | string => {
        const normalized = PamCliLocalProjectScanUtil.toSlug(value);
        if (!normalized) {
          return PamCliI18n.t(PAMENV_CLI_SLUG_REQUIRED);
        }
        return true;
      }
    });

    return PamCliLocalProjectScanUtil.toSlug(slugInput);
  }

  /**
   * Picks a category from API list, or prompts for a custom value.
   */
  protected async promptCategory(): Promise<string> {
    let known: string[] = [];
    try {
      known = await this.apiClient.listCategories();
    } catch {
      known = [];
    }

    if (known.length === 0) {
      return input({
        message: PamCliI18n.t(PAMENV_CLI_PROMPT_CATEGORY_CUSTOM),
        validate: (value: string): true | string => {
          if (!value.trim()) {
            return PamCliI18n.t(PAMENV_CLI_CATEGORY_REQUIRED);
          }
          return true;
        }
      }).then((value) => value.trim());
    }

    const selected = await select({
      message: PamCliI18n.t(PAMENV_CLI_PROMPT_CATEGORY),
      default: known[0],
      choices: [
        ...known.map((item) => ({ name: item, value: item })),
        {
          name: PamCliI18n.t(PAMENV_CLI_CATEGORY_CUSTOM),
          value: CATEGORY_CUSTOM_VALUE
        }
      ]
    });

    if (selected !== CATEGORY_CUSTOM_VALUE) {
      return selected;
    }

    return input({
      message: PamCliI18n.t(PAMENV_CLI_PROMPT_CATEGORY_CUSTOM),
      validate: (value: string): true | string => {
        if (!value.trim()) {
          return PamCliI18n.t(PAMENV_CLI_CATEGORY_REQUIRED);
        }
        return true;
      }
    }).then((value) => value.trim());
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

    if (PamCliProjectAccessUtil.canEdit(project)) {
      console.log(
        PamCliI18n.t(PAMENV_CLI_PROJECT_EXISTS_OWNED, { slug: project.slug })
      );
      if (envNames) {
        console.log(
          PamCliI18n.t(PAMENV_CLI_PROJECT_EXISTS_ENVS, { envs: envNames })
        );
      }
      console.log(
        PamCliI18n.t(PAMENV_CLI_PROJECT_EXISTS_PUSH_HINT, {
          slug: project.slug
        })
      );
      return;
    }

    console.log(PamCliI18n.t(PAMENV_CLI_SLUG_TAKEN, { slug: project.slug }));
    console.log(PamCliI18n.t(PAMENV_CLI_SLUG_TAKEN_RETRY));
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
        console.log(PamCliI18n.t(PAMENV_CLI_SKIP_ENVS_NO_FILES_NO_HOME));
        return [];
      }
      console.log(PamCliI18n.t(PAMENV_CLI_SKIP_ENVS_NO_FILES));
      return [];
    }

    const selectedNames = await checkbox({
      message: PamCliI18n.t(PAMENV_CLI_PROMPT_ENVS_TO_CREATE),
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
      console.log(PamCliI18n.t(PAMENV_CLI_NO_ENVS_SELECTED));
      return [];
    }

    const environments: PamCliCreateEnvironmentInputType[] = [];
    for (const defaultName of selectedNames) {
      console.log('');
      const sources = scan.envFiles
        .filter((file) => file.envName === defaultName)
        .map((file) => file.fileName)
        .join(', ');
      console.log(
        PamCliI18n.t(PAMENV_CLI_CONFIGURE_ENV_FROM, { sources })
      );

      const envName = await input({
        message: PamCliI18n.t(PAMENV_CLI_PROMPT_ENV_NAME),
        default: defaultName,
        validate: (value: string): true | string => {
          if (!value.trim()) {
            return PamCliI18n.t(PAMENV_CLI_ENV_NAME_REQUIRED);
          }
          return true;
        }
      });

      const defaultEnvUrl = PamCliLocalProjectScanUtil.defaultEnvUrl(scan);
      const envUrl = await input({
        message: PamCliI18n.t(PAMENV_CLI_PROMPT_ENV_URL),
        ...(defaultEnvUrl ? { default: defaultEnvUrl } : {}),
        validate: (value: string): true | string => {
          if (!PamCliLocalProjectScanUtil.isValidEnvUrl(value)) {
            return PamCliI18n.t(PAMENV_CLI_ENV_URL_REQUIRED);
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
      throw new Error(PamCliI18n.t(PAMENV_CLI_DUPLICATE_ENV_NAMES));
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
