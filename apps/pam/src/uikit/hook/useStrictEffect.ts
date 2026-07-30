import {
  useEffect,
  useId,
  type DependencyList,
  type EffectCallback
} from 'react';

type StrictEffectEntry = {
  dispose?: () => void;
  timer?: ReturnType<typeof setTimeout>;
};

const ENTRIES_KEY = '__brain_pam_useStrictEffect_entries__';

type GlobalWithEntries = typeof globalThis & {
  [ENTRIES_KEY]?: Map<string, StrictEffectEntry>;
};

/**
 * Module-safe store (survives duplicate bundle copies of this hook).
 * Cleanup is deferred so Strict Mode remount can skip a second effect run.
 */
function getEntries(): Map<string, StrictEffectEntry> {
  const g = globalThis as GlobalWithEntries;
  if (!g[ENTRIES_KEY]) {
    g[ENTRIES_KEY] = new Map();
  }
  return g[ENTRIES_KEY];
}

function depsKey(deps?: DependencyList): string {
  if (deps == null) {
    return '';
  }
  return deps
    .map((dep) => {
      if (dep == null) {
        return String(dep);
      }
      const type = typeof dep;
      if (type === 'string' || type === 'number' || type === 'boolean') {
        return `${type}:${String(dep)}`;
      }
      if (type === 'function') {
        return 'fn';
      }
      // Objects/class instances: identity is handled by React deps; key only needs stability.
      return 'obj';
    })
    .join('|');
}

/**
 * Like `useEffect`, but skips the extra run from React Strict Mode remount
 * when dependencies are unchanged.
 */
export const useStrictEffect = (
  effect: EffectCallback,
  deps?: DependencyList
): void => {
  const effectId = useId();

  useEffect(() => {
    const entries = getEntries();
    const key = `${effectId}:${depsKey(deps)}`;
    const existing = entries.get(key);

    // Already ran for this key (Strict remount): keep first effect alive.
    if (existing) {
      if (existing.timer != null) {
        clearTimeout(existing.timer);
        existing.timer = undefined;
      }

      return () => {
        existing.timer = setTimeout(() => {
          existing.dispose?.();
          entries.delete(key);
        }, 0);
      };
    }

    const dispose = effect();
    const entry: StrictEffectEntry = {
      dispose: typeof dispose === 'function' ? dispose : undefined
    };
    entries.set(key, entry);

    return () => {
      entry.timer = setTimeout(() => {
        entry.dispose?.();
        entries.delete(key);
      }, 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
