import type { ResourceTableState } from './ResourceEventStroe';
import type {
  ResourceServiceInterface,
  ResourceQuery,
  StoreInterface,
  LifecycleInterface,
  ResourceStore,
  ResourceStateInterface
} from '@qlover/corekit-bridge';

/**
 * Common parameters for resource table event handlers
 *
 * Provides shared parameters across all resource table operations,
 * encapsulating resource service and data source information.
 */
export interface ResourceTableEventCommonParams {
  /**
   * Resource service instance for performing CRUD operations
   *
   * @optional
   */
  resource?: ResourceServiceInterface<unknown>;

  /**
   * Data source for the current operation
   *
   * Contains the entity data being operated on (create, edit, delete, etc.)
   *
   * @optional
   */
  dataSource?: unknown;
}

/**
 * Resource table event action types enumeration
 *
 * Defines all available CRUD operations for resource table management:
 * - `CREATE`: Initialize new resource creation flow
 * - `DELETE`: Remove existing resource
 * - `DETAIL`: View resource details in read-only mode
 * - `EDIT`: Modify existing resource
 * - `REFRESH`: Reload resource list data
 *
 * @example
 * ```typescript
 * if (action === ResourceTableEventAction.CREATE) {
 *   // Handle create flow
 * }
 * ```
 */
export const ResourceTableEventAction = Object.freeze({
  CREATE: 'create',
  DELETE: 'delete',
  DETAIL: 'detail',
  EDIT: 'edit',
  REFRESH: 'refresh'
});

/**
 * Type-safe union type for resource table event actions
 *
 * Automatically derives from `ResourceTableEventAction` constant values
 */
export type ResourceTableEventActionType =
  (typeof ResourceTableEventAction)[keyof typeof ResourceTableEventAction];

/**
 * Resource table event handler interface
 *
 * Core concept:
 * Provides a standardized event handling system for resource table operations,
 * integrating lifecycle management with CRUD operations.
 *
 * Main features:
 * - Event handling: Manages all resource table interactions (create, edit, delete, detail, refresh)
 *   - Coordinates between UI actions and resource service calls
 *   - Maintains operation state (loading, success, error)
 *   - Handles form data validation and submission
 *   - Controls popup visibility for edit/create/detail views
 *
 * - State management: Uses store pattern for reactive state updates
 *   - Tracks current action type and selected resource
 *   - Manages create/edit/delete operation states
 *   - Synchronizes with resource service search parameters
 *
 * - Lifecycle integration: Implements lifecycle hooks for resource initialization and cleanup
 *   - `created()`: Initialize resource service and reset store state
 *   - `updated()`: Synchronize state when component updates
 *   - `destroyed()`: Clean up resources and reset state
 *
 * Main purpose:
 * Decouples business logic from UI components, providing a consistent
 * interface for resource table operations across different implementations.
 *
 * @example Basic implementation
 * ```typescript
 * class MyResourceEvent implements ResourceTableEventInterface {
 *   readonly namespace = 'users';
 *   readonly store = new ResourceEventStore();
 *
 *   getResource() {
 *     return this.userService;
 *   }
 *
 *   onCreated(params) {
 *     this.store.emit({
 *       action: ResourceTableEventAction.CREATE,
 *       openPopup: true
 *     });
 *   }
 *
 *   async onSubmit(values) {
 *     return await this.userService.create(values);
 *   }
 *
 *   created() {
 *     this.userService.created();
 *   }
 *
 *   destroyed() {
 *     this.userService.destroyed();
 *   }
 * }
 * ```
 *
 * @example Usage in component
 * ```typescript
 * const tableEvent = new ResourceEvent('users', userService);
 *
 * // Handle create button click
 * tableEvent.onCreated({ dataSource: {} });
 *
 * // Handle form submission
 * await tableEvent.onSubmit(formValues);
 *
 * // Handle refresh
 * tableEvent.onRefresh({ resource: userService });
 * ```
 */
export interface ResourceTableEventInterface extends LifecycleInterface {
  /**
   * Unique namespace identifier for the resource table
   *
   * Used for state isolation and debugging
   *
   * @example `'users'`, `'products'`, `'orders'`
   */
  readonly namespace: string;

  /**
   * Store instance managing resource table state
   *
   * Handles reactive state updates for:
   * - Current action type (create/edit/delete/detail)
   * - Selected resource data
   * - Operation states (create, edit states)
   * - Popup visibility
   */
  readonly store: StoreInterface<ResourceTableState>;

  /**
   * Get the resource service instance
   *
   * Provides access to the underlying resource service for
   * performing CRUD operations and state management.
   *
   * @returns Resource service instance with store
   */
  getResource(): ResourceServiceInterface<
    unknown,
    ResourceStore<ResourceStateInterface>
  >;

  /**
   * Handle resource creation initiation
   *
   * Triggered when user clicks create button. Opens popup with
   * empty form and sets action to CREATE mode.
   *
   * @param params - Event parameters
   * @param {unknown} [params.dataSource] - Initial data for pre-filling form fields
   *
   * @example
   * ```typescript
   * // Create with empty form
   * tableEvent.onCreated({ dataSource: {} });
   *
   * // Create with default values
   * tableEvent.onCreated({
   *   dataSource: { status: 'active', role: 'user' }
   * });
   * ```
   */
  onCreated(params: ResourceTableEventCommonParams): void;

  /**
   * Handle resource deletion
   *
   * Triggered when user confirms deletion. Calls resource service
   * to remove the entity and refreshes the list.
   *
   * @param params - Event parameters
   * @param {unknown} params.dataSource - Resource entity to delete (must include ID)
   *
   * @example
   * ```typescript
   * tableEvent.onDeleted({
   *   resource: userService,
   *   dataSource: { id: '123', name: 'John' }
   * });
   * ```
   */
  onDeleted(params: ResourceTableEventCommonParams): void;

  /**
   * Handle resource detail view
   *
   * Triggered when user clicks detail/view button. Opens popup in
   * read-only mode displaying resource information.
   *
   * @param params - Event parameters
   * @param {unknown} params.dataSource - Resource entity to display
   *
   * @example
   * ```typescript
   * tableEvent.onDetail({
   *   dataSource: { id: '123', name: 'John', email: 'john@example.com' }
   * });
   * ```
   */
  onDetail(params: ResourceTableEventCommonParams): void;

  /**
   * Handle resource edit initiation
   *
   * Triggered when user clicks edit button. Opens popup with
   * form pre-filled with current resource data.
   *
   * @param params - Event parameters
   * @param {unknown} params.dataSource - Resource entity to edit (must include ID)
   *
   * @example
   * ```typescript
   * tableEvent.onEdited({
   *   dataSource: { id: '123', name: 'John', email: 'john@example.com' }
   * });
   * ```
   */
  onEdited(params: ResourceTableEventCommonParams): void;

  /**
   * Handle resource list refresh
   *
   * Triggered when user clicks refresh button or after successful
   * create/edit/delete operations. Reloads data from server using
   * current search parameters.
   *
   * @param params - Event parameters
   * @param {ResourceServiceInterface} [params.resource] - Resource service to refresh
   *
   * @example
   * ```typescript
   * // Manual refresh
   * await tableEvent.onRefresh({ resource: userService });
   *
   * // After successful creation
   * await tableEvent.onSubmit(values);
   * await tableEvent.onRefresh({ resource: userService });
   * ```
   */
  onRefresh(params: ResourceTableEventCommonParams): void;

  /**
   * Handle search parameters change
   *
   * Triggered when pagination, sorting, or filtering changes.
   * Updates resource service search parameters and triggers new search.
   *
   * @param params - Event parameters including query parameters
   * @param {ResourceServiceInterface} [params.resource] - Resource service instance
   * @param {number} [params.page] - Page number (1-based)
   * @param {number} [params.pageSize] - Number of items per page
   * @param {Record<string, unknown>} [params.filters] - Filter conditions
   * @param {Record<string, 'asc' | 'desc'>} [params.sorter] - Sort configuration
   *
   * @example
   * ```typescript
   * // Pagination change
   * tableEvent.onChangeParams({
   *   resource: userService,
   *   page: 2,
   *   pageSize: 20
   * });
   *
   * // Filter and sort
   * tableEvent.onChangeParams({
   *   resource: userService,
   *   page: 1,
   *   pageSize: 10,
   *   filters: { status: 'active' },
   *   sorter: { createdAt: 'desc' }
   * });
   * ```
   */
  onChangeParams(params: ResourceTableEventCommonParams & ResourceQuery): void;

  /**
   * Handle popup close
   *
   * Triggered when user clicks cancel or close button. Resets form
   * fields and closes the edit/create/detail popup.
   *
   * Business rules:
   * - Prevents closing while create/edit operations are in progress
   * - Clears selected resource and form state
   * - Resets action type to undefined
   *
   * @example
   * ```typescript
   * // User clicks cancel button
   * tableEvent.onClosePopup();
   * ```
   */
  onClosePopup(): void;

  /**
   * Handle form submission
   *
   * Triggered when user submits create or edit form. Validates form
   * data and calls appropriate resource service method based on current action.
   *
   * Business rules:
   * - Only processes if not already loading
   * - CREATE action: calls `resource.create(values)`
   * - EDIT action: calls `resource.update(values)`
   * - Updates operation state (loading, success, error)
   *
   * @param values - Form values to submit (structure depends on resource type)
   * @returns Promise resolving to created/updated resource data
   *
   * @throws {Error} When action type is invalid or not supported
   * @throws {ValidationError} When form validation fails
   * @throws {ApiError} When server request fails
   *
   * @example Create user
   * ```typescript
   * try {
   *   const newUser = await tableEvent.onSubmit({
   *     name: 'John Doe',
   *     email: 'john@example.com',
   *     role: 'user'
   *   });
   *   console.log('Created:', newUser);
   * } catch (error) {
   *   console.error('Submit failed:', error);
   * }
   * ```
   *
   * @example Update user
   * ```typescript
   * // First set edit mode
   * tableEvent.onEdited({ dataSource: existingUser });
   *
   * // Then submit changes
   * await tableEvent.onSubmit({
   *   id: '123',
   *   name: 'John Updated',
   *   email: 'john.updated@example.com'
   * });
   * ```
   */
  onSubmit(values: unknown): Promise<unknown>;
}
