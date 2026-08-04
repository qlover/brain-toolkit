import type {
  PAMEnvWriteable,
  PAMVariable
} from '@schemas/PAMEnvironmentSchema';
import {
  PAMProjectEnvKey,
  PAMPublicType,
  type PAMProjectCreate,
  type PAMProjectDetail
} from '@schemas/PAMProjectSchema';
import { PAMEnvVariableRedactUtil } from './PAMEnvVariableRedactUtil';

/**
 * Builds fork create payloads from a readable source project.
 *
 * Significance: Keeps fork cloning pure and free of I/O.
 * Core idea: Copy metadata + env structure; never copy sensitive values.
 * Main function: Map source detail into {@link PAMProjectCreate}.
 * Main purpose: Safe project derivation without sharing secrets.
 *
 * @example
 * const body = PAMProjectForkUtil.buildCreatePayload(source, {
 *   slug: 'demo-fork',
 *   name: 'Demo (fork)'
 * });
 */
export class PAMProjectForkUtil {
  /**
   * Default fork slug derived from the source slug.
   *
   * @param sourceSlug - Source project slug
   * @returns Candidate slug ending with `-fork`
   */
  public static defaultSlug(sourceSlug: string): string {
    const trimmed = sourceSlug.trim();
    if (trimmed.endsWith('-fork')) {
      return trimmed;
    }
    return `${trimmed}-fork`;
  }

  /**
   * Default display name for a forked project.
   *
   * @param sourceName - Source project name
   * @returns Name with a fork suffix
   */
  public static defaultName(sourceName: string): string {
    const trimmed = sourceName.trim();
    if (trimmed.endsWith('(fork)')) {
      return trimmed;
    }
    return `${trimmed} (fork)`;
  }

  /**
   * Yields slug candidates when the preferred slug is taken.
   *
   * @param preferredSlug - First choice slug
   * @param maxAttempts - Maximum candidates including the preferred slug
   * @returns Ordered unique slug candidates
   */
  public static slugCandidates(
    preferredSlug: string,
    maxAttempts: number = 32
  ): string[] {
    const base = preferredSlug.trim() || 'fork';
    const candidates: string[] = [base];
    for (let index = 2; index <= maxAttempts; index += 1) {
      candidates.push(`${base}-${index}`);
    }
    return candidates;
  }

  /**
   * Strips ids and clears sensitive values for create-compatible envs.
   *
   * @param environments - Source environments (may include ids / secrets)
   * @returns Environments safe to insert under a new project
   */
  public static cloneEnvironmentsForFork(
    environments: PAMEnvWriteable[] | undefined
  ): NonNullable<PAMProjectCreate['environments']> {
    if (!environments || environments.length === 0) {
      return [];
    }

    const redacted = PAMEnvVariableRedactUtil.redactEnvironments(environments);

    return redacted.map((environment: PAMEnvWriteable) => ({
      name: environment.name,
      url: environment.url,
      variables: this.stripVariableIds(environment.variables)
    }));
  }

  /**
   * Builds a private create payload from a readable source project.
   *
   * @param source - Source project detail (environments optional)
   * @param options - Resolved slug and name for the fork
   * @returns Payload for {@link PAMServiceInterface.createProject}
   */
  public static buildCreatePayload(
    source: PAMProjectDetail,
    options: { readonly slug: string; readonly name: string }
  ): PAMProjectCreate {
    return {
      slug: options.slug,
      name: options.name,
      description: source.description ?? '',
      stack: source.stack ?? '',
      repo_url: source.repo_url ?? '',
      category: source.category,
      is_public: PAMPublicType.private,
      [PAMProjectEnvKey]: this.cloneEnvironmentsForFork(
        source[PAMProjectEnvKey]
      )
    };
  }

  /**
   * Drops variable ids so the fork gets fresh identities.
   *
   * @param variables - Variables after redaction
   * @returns Variables without `id`
   */
  protected static stripVariableIds(
    variables: PAMVariable[] | undefined
  ): PAMVariable[] | undefined {
    if (variables === undefined) {
      return undefined;
    }

    return variables.map((variable: PAMVariable): PAMVariable => {
      const { id: _ignored, ...rest } = variable;
      return rest;
    });
  }
}
