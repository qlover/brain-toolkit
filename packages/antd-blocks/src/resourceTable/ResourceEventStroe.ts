import {
  RequestState,
  StoreInterface,
  type StoreStateInterface
} from '@qlover/corekit-bridge';
import type { ResourceTableEventActionType } from './ResourceTableEventInterface';

/**
 * Resource table state model
 *
 * Core concept:
 * Defines the complete state structure for resource table operations,
 * tracking the current operation mode, selected resource, UI visibility,
 * and operation states for create/edit/delete actions.
 *
 * Main features:
 * - Operation tracking: Stores current action type (create/edit/delete/detail)
 * - Resource selection: Maintains currently selected resource data
 * - UI state: Controls popup visibility for forms
 * - Request states: Tracks loading/success/error states for async operations
 *
 * Main purpose:
 * Provides a centralized state model for all resource table UI and
 * operation states, enabling reactive updates across components.
 *
 * @example
 * ```typescript
 * const state = new ResourceTableState();
 * state.action = ResourceTableEventAction.EDIT;
 * state.selectedResource = { id: '123', name: 'John' };
 * state.openPopup = true;
 * ```
 */
export class ResourceTableState implements StoreStateInterface {
  /**
   * Currently selected resource data
   *
   * Contains the resource entity being operated on (create/edit/delete/detail).
   * `undefined` when no resource is selected or popup is closed.
   *
   * @optional
   */
  public selectedResource?: unknown;

  /**
   * Current action type
   *
   * Indicates the current operation mode:
   * - `'create'`: Creating new resource
   * - `'edit'`: Editing existing resource
   * - `'delete'`: Deleting resource
   * - `'detail'`: Viewing resource details
   * - `undefined`: No active operation
   *
   * @optional
   */
  public action: ResourceTableEventActionType | undefined;

  /**
   * Whether the form popup is open
   *
   * Controls visibility of create/edit/detail modal or drawer.
   *
   * @default `false`
   */
  public openPopup: boolean = false;

  /**
   * Create operation state
   *
   * Tracks loading, success, and error states for resource creation.
   * Used to show loading indicators and handle operation results.
   *
   * @default `new RequestState<unknown>()`
   */
  public createState = new RequestState<unknown>();

  /**
   * Delete operation state
   *
   * Tracks loading, success, and error states for resource deletion.
   *
   * @default `new RequestState<unknown>()`
   */
  public deleteState = new RequestState<unknown>();

  /**
   * Edit operation state
   *
   * Tracks loading, success, and error states for resource updates.
   *
   * @default `new RequestState<unknown>()`
   */
  public editState = new RequestState<unknown>();
}

/**
 * Resource event store
 *
 * Core concept:
 * Manages resource table state with reactive updates, providing methods
 * to update specific operation states while maintaining immutability.
 *
 * Main features:
 * - State management: Maintains `ResourceTableState` with reactive updates
 * - Immutable updates: Emits new state objects on changes
 * - Operation state helpers: Convenient methods for updating create/edit states
 * - Subscription support: Allows components to subscribe to state changes
 *
 * Main purpose:
 * Provides a centralized store for resource table operations, enabling
 * multiple components to react to state changes consistently.
 *
 * @example Basic usage
 * ```typescript
 * const store = new ResourceEventStroe();
 *
 * // Subscribe to state changes
 * store.subscribe((state) => {
 *   console.log('Action:', state.action);
 *   console.log('Popup open:', state.openPopup);
 * });
 *
 * // Update state
 * store.emit({
 *   ...store.state,
 *   action: ResourceTableEventAction.CREATE,
 *   openPopup: true
 * });
 * ```
 *
 * @example Update operation states
 * ```typescript
 * const store = new ResourceEventStroe();
 *
 * // Start create operation
 * store.changeCreateState(new RequestState(true));
 *
 * // Complete with success
 * store.changeCreateState(new RequestState(false, result).end());
 *
 * // Complete with error
 * store.changeCreateState(new RequestState(false, null, error).end());
 * ```
 */
export class ResourceEventStroe extends StoreInterface<ResourceTableState> {
  constructor() {
    super(() => new ResourceTableState());
  }

  /**
   * Update create operation state
   *
   * Emits new state with updated `createState`, used to track the
   * progress of resource creation operations.
   *
   * @param state - New request state for create operation
   *
   * @example
   * ```typescript
   * // Start loading
   * store.changeCreateState(new RequestState(true));
   *
   * // Complete successfully
   * store.changeCreateState(new RequestState(false, createdData).end());
   * ```
   */
  public changeCreateState(state: RequestState<unknown>): void {
    this.emit({
      ...this.state,
      createState: state
    });
  }

  /**
   * Update edit operation state
   *
   * Emits new state with updated `editState`, used to track the
   * progress of resource update operations.
   *
   * @param state - New request state for edit operation
   *
   * @example
   * ```typescript
   * // Start loading
   * store.changeEditState(new RequestState(true));
   *
   * // Complete successfully
   * store.changeEditState(new RequestState(false, updatedData).end());
   * ```
   */
  public changeEditState(state: RequestState<unknown>): void {
    this.emit({
      ...this.state,
      editState: state
    });
  }
}
