import { useSyncExternalStore } from 'react';
import type {
  BrainUserStateInterface,
  BrainUserStore
} from '@brain-toolkit/brain-user';

/**
 * Subscribe to BrainUserStore state in React components.
 *
 * Uses the reactive port from {@link BrainUserStore.getStore} (corekit-bridge 3.x),
 * not SliceStore — so it replaces `useSliceStore(userStore, ...)`.
 */
export function useBrainUserStore<
  Tags extends readonly string[],
  Selected
>(
  store: BrainUserStore<Tags>,
  selector: (state: BrainUserStateInterface) => Selected
): Selected {
  const port = store.getStore();
  const getSnapshot = () => selector(port.getState());

  return useSyncExternalStore(
    (onStoreChange) => port.subscribe(() => onStoreChange()),
    getSnapshot,
    getSnapshot
  );
}
