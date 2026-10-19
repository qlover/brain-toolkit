import type { PAMVariable } from '@schemas/PAMEnvironmentSchema';
import { PAMEnvVariableNormalizeUtil } from './PAMEnvVariableNormalizeUtil';

/**
 * Merges incoming environment variables with stored ones.
 *
 * Significance: Sensitive update payloads omit values; empty must not wipe secrets.
 * Core idea: Empty sensitive `value` (or the env placeholder) keeps the stored value.
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
   * @param placeholder - This environment's sensitive placeholder; also means "keep"
   * @returns Variables ready to persist
   */
  public static mergeVariables(
    existingRaw: unknown,
    incomingRaw: unknown,
    placeholder?: string
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

      // 已敏感的不能降级，也不能改键名（调用方看不到原值）。
      // 是否敏感由用户显式标记，服务端不根据键名自动升级。
      const sensitive =
        previous?.sensitive === true || variable.sensitive === true;
      const key =
        previous?.sensitive === true && previous.key
          ? previous.key
          : variable.key;
      let value = variable.value;

      const keep =
        value.trim() === '' || (!!placeholder && value === placeholder);
      if (sensitive && keep && previous) {
        value = previous.value;
      }

      const comments =
        PAMEnvVariableNormalizeUtil.normalizeComments(variable.comments) ??
        previous?.comments;

      return {
        id: variable.id ?? previous?.id,
        key,
        value,
        sensitive,
        ...(comments !== undefined && comments.length > 0 ? { comments } : {})
      };
    });
  }
}
