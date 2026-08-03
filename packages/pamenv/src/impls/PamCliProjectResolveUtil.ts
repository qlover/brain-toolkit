import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCliProjectType } from '../interfaces/PamCliTypes';

const PROJECT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves a PAM project from a slug or project id reference.
 *
 * Significance: Shared matching rules for CLI project lookup.
 * Core idea: Prefer exact id, then exact slug, then slug substring.
 * Main function: Find a project in a list and detect uuid-like ids.
 * Main purpose: Let `pamenv pull` / `pamenv push` accept either slug or projectId.
 *
 * @example
 * const project = await PamCliProjectResolveUtil.resolve(apiClient, ref);
 */
export class PamCliProjectResolveUtil {
  /**
   * Returns whether the reference looks like a project uuid.
   *
   * @param ref - User-provided slug or id
   */
  public static isLikelyProjectId(ref: string): boolean {
    return PROJECT_ID_PATTERN.test(ref.trim());
  }

  /**
   * Finds a project by id (exact), slug (exact), then slug substring.
   *
   * @param projects - Candidate projects from search / list
   * @param ref - User-provided slug or id
   * @returns Matching project or undefined
   */
  public static findInList(
    projects: readonly PamCliProjectType[],
    ref: string
  ): PamCliProjectType | undefined {
    const trimmed = ref.trim();
    if (!trimmed) {
      return undefined;
    }

    return (
      projects.find((item) => item.id === trimmed) ||
      projects.find((item) => item.slug === trimmed) ||
      projects.find((item) => item.slug.includes(trimmed))
    );
  }

  /**
   * Resolves a project via search, with uuid fallback to a full list.
   *
   * @param apiClient - Authenticated PAM API client
   * @param projectRef - Slug or project id
   * @returns Matched project
   */
  public static async resolve(
    apiClient: PamCliApiClientInterface,
    projectRef: string
  ): Promise<PamCliProjectType> {
    const ref = projectRef.trim();
    if (!ref) {
      throw new Error('Project slug or id is required');
    }

    const searched = await apiClient.listProjects(ref);
    let project = this.findInList(searched, ref);

    if (!project && this.isLikelyProjectId(ref)) {
      const all = await apiClient.listProjects();
      project = all.find((item) => item.id === ref);
    }

    if (!project) {
      throw new Error(`Project not found for slug or id: ${ref}`);
    }

    return project;
  }
}
