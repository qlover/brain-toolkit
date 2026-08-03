import type { PAMVariable } from '@schemas/PAMEnvironmentSchema';

/**
 * Normalizes environment variable payloads from JSONB / API shapes.
 *
 * Significance: Historical rows may store `{}` while the form uses arrays.
 * Core idea: Always work with `{ id?, key, value, sensitive, comments? }[]`.
 * Main function: Convert unknown JSONB into a typed variable array.
 * Main purpose: Stable input for redact/merge logic.
 *
 * @example
 * const vars = PAMEnvVariableNormalizeUtil.normalizeVariables(raw);
 */
export class PAMEnvVariableNormalizeUtil {
  /**
   * Normalizes a raw variables payload into a PAMVariable array.
   *
   * @param raw - JSONB value from DB or request body
   * @returns Normalized variable list
   */
  public static normalizeVariables(raw: unknown): PAMVariable[] {
    if (Array.isArray(raw)) {
      return raw.map((item: unknown): PAMVariable => {
        const record =
          item && typeof item === 'object'
            ? (item as Record<string, unknown>)
            : {};
        const comments = this.normalizeComments(
          record.comments ?? record.comment
        );
        return {
          id: typeof record.id === 'string' ? record.id : undefined,
          key: typeof record.key === 'string' ? record.key : '',
          value: typeof record.value === 'string' ? record.value : '',
          sensitive: record.sensitive === true,
          ...(comments !== undefined ? { comments } : {})
        };
      });
    }

    if (raw && typeof raw === 'object') {
      return Object.entries(raw as Record<string, unknown>).map(
        ([key, value]: [string, unknown]): PAMVariable => ({
          key,
          value: typeof value === 'string' ? value : String(value ?? ''),
          sensitive: false
        })
      );
    }

    return [];
  }

  /**
   * Accepts `string[]` (preferred) or legacy single `string`.
   */
  public static normalizeComments(raw: unknown): string[] | undefined {
    if (Array.isArray(raw)) {
      const lines = raw.filter(
        (line: unknown): line is string => typeof line === 'string'
      );
      return lines.length > 0 ? lines : undefined;
    }
    if (typeof raw === 'string' && raw !== '') {
      return [raw];
    }
    return undefined;
  }
}
