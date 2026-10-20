import type { PAMVariable } from '@schemas/PAMEnvironmentSchema';
import { PAMEnvSensitivePlaceholderUtil } from './PAMEnvSensitivePlaceholderUtil';

export type PAMEnvImportStatus = 'added' | 'changed' | 'unchanged' | 'skipped';

export type PAMEnvImportEntry = {
  readonly key: string;
  readonly value: string;
  readonly comments?: string[];
  readonly status: PAMEnvImportStatus;
};

export type PAMEnvDraftIssue =
  | { readonly kind: 'key_required' }
  | { readonly kind: 'key_duplicate'; readonly key: string }
  | { readonly kind: 'sensitive_value'; readonly key: string };

export type PAMEnvVariablePatch = {
  readonly upsert: PAMVariable[];
  readonly deleteIds: string[];
};

function sameComments(a?: string[], b?: string[]): boolean {
  const left = a ?? [];
  const right = b ?? [];
  return (
    left.length === right.length && left.every((line, i) => line === right[i])
  );
}

/**
 * Draft helpers for the web environment variables editor.
 *
 * Significance: Keeps dirty tracking, import preview, and pre-save checks
 * out of the component so they can be tested.
 * Core idea: Variables are matched by `id` against the saved baseline;
 * saved ids are "locked" (sensitivity fixed, sensitive values never shown).
 */
export class PAMEnvVariableDraftUtil {
  /**
   * Number of added, edited, and removed variables versus the baseline.
   */
  public static countChanges(
    baseline: readonly PAMVariable[],
    draft: readonly PAMVariable[]
  ): number {
    const byId = new Map(
      baseline.filter((item) => item.id).map((item) => [item.id!, item])
    );
    let count = 0;
    const seen = new Set<string>();
    for (const item of draft) {
      const saved = item.id ? byId.get(item.id) : undefined;
      if (!saved) {
        count += 1;
        continue;
      }
      seen.add(saved.id!);
      if (
        saved.key !== item.key ||
        saved.value !== item.value ||
        (saved.sensitive === true) !== (item.sensitive === true) ||
        !sameComments(saved.comments, item.comments)
      ) {
        count += 1;
      }
    }
    for (const id of byId.keys()) {
      if (!seen.has(id)) {
        count += 1;
      }
    }
    return count;
  }

  /**
   * Classifies parsed dotenv entries against the draft.
   * A saved sensitive key given an empty value or a placeholder keeps its
   * stored value. Other placeholder values are skipped: the web client does
   * not know this environment's placeholder, and the server would reject them.
   */
  public static previewImport(
    draft: readonly PAMVariable[],
    parsed: readonly {
      readonly key: string;
      readonly value: string;
      readonly comments?: readonly string[];
    }[],
    lockedIds: ReadonlySet<string>
  ): PAMEnvImportEntry[] {
    const byKey = new Map(draft.map((item) => [item.key, item]));
    return parsed.map((item) => {
      const existing = byKey.get(item.key);
      const isPlaceholder = PAMEnvSensitivePlaceholderUtil.isPlaceholder(
        item.value
      );
      const base = {
        key: item.key,
        value: item.value,
        ...(item.comments && item.comments.length > 0
          ? { comments: [...item.comments] }
          : {})
      };
      if (!existing) {
        return { ...base, status: isPlaceholder ? 'skipped' : 'added' };
      }
      const lockedSensitive =
        existing.sensitive === true &&
        Boolean(existing.id && lockedIds.has(existing.id));
      if (lockedSensitive && (item.value === '' || isPlaceholder)) {
        return { ...base, status: 'unchanged' };
      }
      if (isPlaceholder) {
        return { ...base, status: 'skipped' };
      }
      return {
        ...base,
        status: existing.value === item.value ? 'unchanged' : 'changed'
      };
    });
  }

  /**
   * Applies `added` / `changed` entries to the draft.
   * New keys default to sensitive; existing keys keep their sensitivity.
   */
  public static applyImport(
    draft: readonly PAMVariable[],
    entries: readonly PAMEnvImportEntry[],
    createId: () => string
  ): PAMVariable[] {
    const next = draft.map((item) => ({ ...item }));
    const indexByKey = new Map(next.map((item, i) => [item.key, i]));
    for (const entry of entries) {
      const comments = entry.comments ? { comments: [...entry.comments] } : {};
      if (entry.status === 'changed') {
        const index = indexByKey.get(entry.key)!;
        next[index] = { ...next[index]!, value: entry.value, ...comments };
      } else if (entry.status === 'added') {
        indexByKey.set(entry.key, next.length);
        next.push({
          id: createId(),
          key: entry.key,
          value: entry.value,
          sensitive: true,
          ...comments
        });
      }
    }
    return next;
  }

  /**
   * Diff draft against baseline for an incremental save payload.
   * Unchanged rows are omitted; removed baseline ids go into `deleteIds`.
   */
  public static buildPatch(
    baseline: readonly PAMVariable[],
    draft: readonly PAMVariable[]
  ): PAMEnvVariablePatch {
    const byId = new Map(
      baseline.filter((item) => item.id).map((item) => [item.id!, item])
    );
    const upsert: PAMVariable[] = [];
    const seen = new Set<string>();

    for (const item of draft) {
      const saved = item.id ? byId.get(item.id) : undefined;
      if (!saved) {
        upsert.push({ ...item });
        continue;
      }
      seen.add(saved.id!);
      if (
        saved.key !== item.key ||
        saved.value !== item.value ||
        (saved.sensitive === true) !== (item.sensitive === true) ||
        !sameComments(saved.comments, item.comments)
      ) {
        upsert.push({ ...item });
      }
    }

    const deleteIds: string[] = [];
    for (const id of byId.keys()) {
      if (!seen.has(id)) {
        deleteIds.push(id);
      }
    }

    return { upsert, deleteIds };
  }

  /**
   * First blocking problem before save, or `null`.
   * Unsaved sensitive variables need a value (empty means "keep stored",
   * which only exists for saved ones).
   */
  public static findIssue(
    draft: readonly PAMVariable[],
    lockedIds: ReadonlySet<string>
  ): PAMEnvDraftIssue | null {
    const seen = new Set<string>();
    for (const item of draft) {
      const key = item.key.trim();
      if (key === '') {
        return { kind: 'key_required' };
      }
      if (seen.has(key)) {
        return { kind: 'key_duplicate', key };
      }
      seen.add(key);
      const saved = Boolean(item.id && lockedIds.has(item.id));
      if (item.sensitive === true && !saved && item.value === '') {
        return { kind: 'sensitive_value', key };
      }
    }
    return null;
  }
}
