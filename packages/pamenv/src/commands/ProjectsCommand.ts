import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_NO_PROJECTS,
  PAMENV_CLI_PROJECTS_LINE
} from '../i18n/identifier/pamenv_cli';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import { PamCliProjectAccessUtil } from '../impls/PamCliProjectAccessUtil';

/**
 * `pamenv projects` — list owned / visible PAM projects.
 */
export class ProjectsCommand {
  constructor(protected readonly apiClient: PamCliApiClientInterface) {}

  /**
   * @param keyword - Optional search keyword
   */
  public async run(keyword?: string): Promise<void> {
    const projects = await this.apiClient.listProjects(keyword);
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
