import type { PAMVariable } from '@schemas/PAMEnvironmentSchema';
import { PAMEnvVariableNormalizeUtil } from './PAMEnvVariableNormalizeUtil';

/**
 * Merges incoming environment variables with stored ones.
 *
 * Significance: Sensitive update payloads omit values; empty must not wipe secrets.
 * Core idea: Empty sensitive `value` keeps the existing stored value.
 * Main function: Upsert by `id` then `key`, preserving secrets when requested.
 * Main purpose: Safe write semantics for sensitive JSONB variables.
 *
 * @example
 * const next = PAMEnvVariableMergeUtil.mergeVariables(existing, incoming);
 */
export class PAMEnvVariableMergeUtil {
  /**
   * Merges incoming variables onto existing ones.
   *
   * @param existingRaw - Stored variables (array or legacy object)
   * @param incomingRaw - Request variables
   * @returns Variables ready to persist
   */
  public static mergeVariables(
    existingRaw: unknown,
    incomingRaw: unknown
  ): PAMVariable[] {
    const existing =
      PAMEnvVariableNormalizeUtil.normalizeVariables(existingRaw);
    const incoming =
      PAMEnvVariableNormalizeUtil.normalizeVariables(incomingRaw);

    const byId = new Map<string, PAMVariable>();
    const byKey = new Map<string, PAMVariable>();

    for (const variable of existing) {
      if (variable.id) {
        byId.set(variable.id, variable);
      }
      if (variable.key) {
        byKey.set(variable.key, variable);
      }
    }

    return incoming.map((variable: PAMVariable): PAMVariable => {
      const previous =
        (variable.id ? byId.get(variable.id) : undefined) ||
        byKey.get(variable.key);

      // Sensitive is immutable after first save (Vercel-like).
      const sensitive = previous
        ? previous.sensitive === true
        : variable.sensitive === true;
      let value = variable.value;

      if (sensitive && value.trim() === '' && previous) {
        value = previous.value;
      }

      const comments =
        PAMEnvVariableNormalizeUtil.normalizeComments(variable.comments) ??
        previous?.comments;

      return {
        id: variable.id ?? previous?.id,
        key: variable.key,
        value,
        sensitive,
        ...(comments !== undefined && comments.length > 0 ? { comments } : {})
      };
    });
  }
}
