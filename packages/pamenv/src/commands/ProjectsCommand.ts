import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';

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
      console.log('No projects found.');
      return;
    }

    for (const project of projects) {
      const owner = project.is_owner ? ' (owner)' : '';
      const envs =
        project.environments
          ?.map((env) => env.name)
          .filter(Boolean)
          .join(', ') || '-';
      console.log(
        `${project.slug}\t${project.name}${owner}\tenvs: ${envs}\tid: ${project.id}`
      );
    }
  }
}
