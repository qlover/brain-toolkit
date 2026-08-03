import type { PamCliEnvironmentSummaryType } from '../interfaces/PamCliTypes';

/**
 * Selects which PAM environment pull / push should operate on.
 *
 * Significance: Avoids accidental multi-env writes when `-e` is omitted.
 * Core idea: Named env when provided; otherwise the first list entry.
 * Main function: Resolve one environment from a project list.
 * Main purpose: Shared default for `pamenv pull` and `pamenv push`.
 *
 * @example
 * const env = PamCliEnvironmentSelectUtil.select(project.environments, undefined, project.slug);
 */
export class PamCliEnvironmentSelectUtil {
  /**
   * @param environments - Project environments
   * @param envName - Optional `-e` value
   * @param projectSlug - Project slug for error messages
   * @returns The single environment to use
   */
  public static select(
    environments: readonly PamCliEnvironmentSummaryType[] | undefined,
    envName: string | undefined,
    projectSlug: string
  ): PamCliEnvironmentSummaryType {
    const list = environments || [];
    if (list.length === 0) {
      throw new Error(`Project ${projectSlug} has no environments`);
    }

    const wanted = envName?.trim();
    if (wanted) {
      const found = list.find((env) => env.name === wanted);
      if (!found) {
        throw new Error(
          `Environment "${wanted}" not found on project ${projectSlug}`
        );
      }
      return found;
    }

    return list[0]!;
  }
}
