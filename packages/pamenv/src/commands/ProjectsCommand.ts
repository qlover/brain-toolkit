import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_NO_PROJECTS,
  PAMENV_CLI_PROJECTS_LINE
} from '../i18n/identifier/pamenv_cli';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCliListProjectsOptionsType } from '../interfaces/PamCliTypes';
import { PamCliProjectAccessUtil } from '../impls/PamCliProjectAccessUtil';

export type PamCliProjectsCommandOptionsType = PamCliListProjectsOptionsType;

/**
 * `pamenv projects` — list owned / visible PAM projects (compact rows).
 */
export class ProjectsCommand {
  constructor(protected readonly apiClient: PamCliApiClientInterface) {}

  /**
   * @param keyword - Optional search keyword
   * @param options - Web-aligned filters (`mine` / `writable` are server-side)
   */
  public async run(
    keyword?: string,
    options: PamCliProjectsCommandOptionsType = {}
  ): Promise<void> {
    // Same default page size as the PAM web home list; use --page for more.
    const search: PamCliListProjectsOptionsType = {
      ...options,
      page: options.page ?? 1,
      pageSize: options.pageSize ?? 10,
      view: options.view ?? 'compact',
      ...(keyword?.trim() ? { keyword: keyword.trim() } : {})
    };

    const projects = await this.apiClient.listProjects(search);

    if (projects.length === 0) {
      console.log(PamCliI18n.t(PAMENV_CLI_NO_PROJECTS));
      return;
    }

    for (const project of projects) {
      const role = PamCliProjectAccessUtil.roleLabel(project);
      const roleSuffix = role ? ` (${role})` : '';
      const envs =
        project.environments
          ?.map((env) => env.name)
          .filter(Boolean)
          .join(', ') || '-';
      console.log(
        PamCliI18n.t(PAMENV_CLI_PROJECTS_LINE, {
          slug: project.slug,
          name: project.name,
          role: roleSuffix,
          envs,
          id: project.id
        })
      );
    }
  }
}
