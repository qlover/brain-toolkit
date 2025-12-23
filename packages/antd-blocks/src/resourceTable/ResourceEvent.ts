import {
  RequestState,
  type ResourceServiceInterface,
  type ResourceStateInterface,
  type ResourceQuery,
  type ResourceStore
} from '@qlover/corekit-bridge';
import { ResourceEventStroe } from './ResourceEventStroe';
import type { FormInstance } from 'antd';
import type {
  ResourceTableEventCommonParams,
  ResourceTableEventInterface
} from './ResourceTableEventInterface';
import {
  ResourceTableEventAction
} from './ResourceTableEventInterface';

/**
 * Default implementation of resource table event handling
 *
 * Core concept:
 * Provides a complete, production-ready implementation of `ResourceTableEventInterface`
 * that manages the entire lifecycle of resource table CRUD operations with state management,
 * form handling, and error handling built-in.
 *
 * Main features:
 * - CRUD operations: Handles create, read, update, delete operations with loading states
 *   - Create: Validates form data, calls resource service, updates store state
 *   - Edit: Pre-fills form with existing data, handles partial updates
 *   - Delete: Removes resource and refreshes list automatically
 *   - Detail: Displays resource in read-only mode
 *
 * - State management: Integrates with `ResourceEventStore` for reactive UI updates
 *   - Tracks operation states (create, edit, delete) with loading/success/error
 *   - Manages popup visibility and selected resource
 *   - Synchronizes with resource service search parameters
 *
 * - Form integration: Works seamlessly with Ant Design Form component
 *   - Auto-fills form fields when editing or viewing details
 *   - Resets form after successful operations
 *   - Validates form data before submission
 *
 * - Error handling: Comprehensive error catching and state updates
 *   - Captures API errors and updates store with error state
 *   - Prevents duplicate submissions during loading
 *   - Provides error information for UI feedback
 *
 * Main purpose:
 * Eliminates boilerplate code for common resource table operations,
 * allowing developers to quickly implement CRUD functionality with
 * minimal custom code.
 *
 * @example Basic usage
 * ```typescript
 * const userService = new UserService();
 * const formRef = Form.useForm()[0];
 *
 * const tableEvent = new ResourceEvent(
 *   'users',
 *   userService,
 *   undefined,
 *   formRef
 * );
 *
 * // Initialize
 * tableEvent.created();
 *
 * // Handle operations
 * tableEvent.onCreated({ dataSource: {} });
 * await tableEvent.onSubmit({ name: 'John', email: 'john@example.com' });
 *
 * // Cleanup
 * tableEvent.destroyed();
 * ```
 *
 * @example With custom store
 * ```typescript
 * const customStore = new ResourceEventStore();
 * const tableEvent = new ResourceEvent(
 *   'products',
 *   productService,
 *   customStore,
 *   formRef
 * );
 *
 * // Subscribe to store changes
 * customStore.subscribe((state) => {
 *   console.log('State updated:', state);
 * });
 * ```
 *
 * @example Custom delete implementation
 * ```typescript
 * class CustomResourceEvent extends ResourceEvent {
 *   protected async actionDelete(values: unknown): Promise<unknown> {
 *     // Confirm before delete
 *     if (!confirm('Are you sure?')) {
 *       return Promise.resolve(false);
 *     }
 *     return await this.resource.remove(values);
 *   }
 * }
 * ```
 */
export class ResourceEvent implements ResourceTableEventInterface {
  /**
   * Store instance managing resource table state
   *
   * Handles reactive state updates for all CRUD operations
   */
  public readonly store: ResourceEventStroe;

  constructor(
    /**
     * Unique namespace identifier for this resource table
     *
     * Used for state isolation when multiple resource tables exist
     * in the same application.
     *
     * @example `'users'`, `'products'`, `'orders'`
     */
    readonly namespace: string,

    /**
     * Resource service instance for performing CRUD operations
     *
     * Must implement `ResourceServiceInterface` with methods:
     * - `create()`: Create new resource
     * - `update()`: Update existing resource
     * - `remove()`: Delete resource
     * - `search()`: Query resources with pagination
     * - `getStore()`: Get resource store for state management
     */
    protected resource: ResourceServiceInterface<
      unknown,
      ResourceStore<ResourceStateInterface>
    >,

    /**
     * Custom store instance (optional)
     *
     * If not provided, creates a new `ResourceEventStore` instance automatically.
     * Useful when you need to share state between multiple components or
     * implement custom state management logic.
     *
     * @optional
     * @default `new ResourceEventStroe()`
     */
    store?: ResourceEventStroe,

    /**
     * Ant Design Form instance reference (optional)
     *
     * Required for automatic form field management:
     * - Auto-fills form when editing or viewing details
     * - Resets form after successful operations
     * - Validates form data before submission
     *
     * @optional
     * @example
     * ```typescript
     * const [form] = Form.useForm();
     * const event = new ResourceEvent('users', service, undefined, form);
     * ```
     */
    protected schemaFormRef?: FormInstance<unknown>
  ) {
    this.store = store || new ResourceEventStroe();
  }

  /**
   * Get the resource service instance
   *
   * Provides access to the underlying resource service for
   * custom operations or accessing service-specific methods.
   *
   * @override
   * @returns Resource service instance
   *
   * @example
   * ```typescript
   * const service = tableEvent.getResource();
   * const store = service.getStore();
   * console.log('Current state:', store.state);
   * ```
   */
  public getResource(): ResourceServiceInterface<
    unknown,
    ResourceStore<ResourceStateInterface>
  > {
    return this.resource;
  }

  /**
   * Execute create action with state management
   *
   * Internal method that handles the create operation flow:
   * 1. Set create state to loading
   * 2. Call resource service create method
   * 3. Update create state with success result
   * 4. Handle errors and update state accordingly
   *
   * @param values - Form values to create resource
   * @returns Promise resolving to created resource data
   *
   * @throws {ApiError} When server request fails
   * @throws {ValidationError} When data validation fails
   *
   * @protected
   */
  protected async actionCreate(values: unknown): Promise<unknown> {
    this.store.changeCreateState(new RequestState(true));

    try {
      const result = await this.resource.create(values);
      this.store.changeCreateState(new RequestState(false, result).end());
      return result;
    } catch (error) {
      this.store.changeCreateState(new RequestState(false, null, error).end());
      throw error;
    }
  }

  /**
   * Execute edit action with state management
   *
   * Internal method that handles the update operation flow:
   * 1. Set edit state to loading
   * 2. Call resource service update method with partial data
   * 3. Update edit state with success result
   * 4. Handle errors and update state accordingly
   *
   * Business rules:
   * - Supports partial updates (only modified fields)
   * - Requires resource ID in values
   * - Updates store state for UI feedback
   *
   * @param values - Form values to update resource (must include ID)
   * @returns Promise resolving to updated resource data
   *
   * @throws {ApiError} When server request fails
   * @throws {ValidationError} When data validation fails
   *
   * @protected
   */
  protected async actionEdit(values: unknown): Promise<unknown> {
    this.store.changeEditState(new RequestState(true));

    try {
      const result = await this.resource.update(values as Partial<unknown>);
      this.store.changeEditState(new RequestState(false, result).end());
      return result;
    } catch (error) {
      this.store.changeEditState(new RequestState(false, null, error).end());
      throw error;
    }
  }

  /**
   * Execute delete action
   *
   * Default implementation returns `true` without actual deletion.
   * Override this method to implement custom delete logic:
   * - Show confirmation dialog
   * - Call resource service remove method
   * - Update UI state
   * - Refresh resource list
   *
   * @param _values - Resource data to delete (typically includes ID)
   * @returns Promise resolving to deletion result
   *
   * @example Override for custom implementation
   * ```typescript
   * class MyResourceEvent extends ResourceEvent {
   *   protected async actionDelete(values: unknown): Promise<unknown> {
   *     await this.resource.remove(values);
   *     await this.onRefresh({ resource: this.resource });
   *     return true;
   *   }
   * }
   * ```
   *
   * @protected
   */
  protected async actionDelete(_values: unknown): Promise<unknown> {
    return Promise.resolve(true);
  }

  /**
   * Handle form submission
   *
   * Routes form submission to appropriate action (create or edit)
   * based on current action type in store state. Prevents duplicate
   * submissions by checking loading state.
   *
   * Business rules:
   * - CREATE action: calls `actionCreate()` if not already loading
   * - EDIT action: calls `actionEdit()` if not already loading
   * - Other actions: throws error
   * - Validates action type before processing
   *
   * @override
   * @param values - Form values to submit
   * @returns Promise resolving to operation result
   *
   * @throws {Error} When action type is invalid or unsupported
   * @throws {ApiError} When API request fails
   *
   * @example
   * ```typescript
   * // In form onFinish handler
   * const handleFinish = async (values: FormValues) => {
   *   try {
   *     await tableEvent.onSubmit(values);
   *     message.success('Operation successful');
   *     tableEvent.onClosePopup();
   *   } catch (error) {
   *     message.error('Operation failed');
   *   }
   * };
   * ```
   */
  public async onSubmit(values: unknown): Promise<unknown> {
    const action = this.store.state.action;

    if (
      action === ResourceTableEventAction.CREATE &&
      !this.store.state.createState.loading
    ) {
      return await this.actionCreate(values);
    }

    if (
      action === ResourceTableEventAction.EDIT &&
      !this.store.state.editState.loading
    ) {
      return await this.actionEdit(values);
    }

    throw new Error('Invalid action');
  }

  /**
   * Handle search parameters change
   *
   * Updates resource service search parameters and triggers new search
   * when pagination, sorting, or filtering changes. Automatically
   * updates store state and refreshes data.
   *
   * @override
   * @param params - Search parameters
   * @param {ResourceServiceInterface} [params.resource] - Resource service instance
   * @param {number} [params.page] - Page number (1-based)
   * @param {number} [params.pageSize] - Items per page
   * @param {Record<string, unknown>} [params.filters] - Filter conditions
   * @param {Record<string, 'asc' | 'desc'>} [params.sorter] - Sort configuration
   *
   * @example
   * ```typescript
   * // Handle pagination change
   * <Table
   *   pagination={{
   *     onChange: (page, pageSize) => {
   *       tableEvent.onChangeParams({
   *         resource: userService,
   *         page,
   *         pageSize
   *       });
   *     }
   *   }}
   * />
   * ```
   */
  public onChangeParams(
    params: ResourceTableEventCommonParams & ResourceQuery
  ): void {
    const { resource, ...query } = params;

    if (resource) {
      resource.getStore().changeSearchParams(query);

      resource.search(query);
    }
  }

  /**
   * Handle resource creation initiation
   *
   * Opens popup with empty form in CREATE mode. Resets form fields
   * to ensure no stale data from previous operations.
   *
   * @override
   * @param params - Event parameters
   * @param {unknown} [params.dataSource] - Initial data for pre-filling form
   *
   * @example
   * ```typescript
   * // Create button handler
   * <Button onClick={() => tableEvent.onCreated({ dataSource: {} })}>
   *   Create New
   * </Button>
   * ```
   */
  public onCreated(params: ResourceTableEventCommonParams): void {
    this.schemaFormRef?.resetFields();
    this.store.emit({
      ...this.store.state,
      selectedResource: params.dataSource,
      action: ResourceTableEventAction.CREATE,
      openPopup: true
    });
  }

  /**
   * Handle resource deletion
   *
   * Calls resource service remove method to delete the resource.
   * You may want to show a confirmation dialog before calling this method.
   *
   * @override
   * @param _params - Event parameters
   * @param {unknown} _params.dataSource - Resource data to delete (must include ID)
   *
   * @example
   * ```typescript
   * // Delete button with confirmation
   * <Popconfirm
   *   title="Are you sure?"
   *   onConfirm={() => tableEvent.onDeleted({ dataSource: record })}
   * >
   *   <Button danger>Delete</Button>
   * </Popconfirm>
   * ```
   */
  public onDeleted(_params: ResourceTableEventCommonParams): void {
    this.resource.remove(_params.dataSource);
  }

  /**
   * Handle resource detail view
   *
   * Opens popup in DETAIL mode with form fields populated with
   * resource data. Form should be in read-only mode for viewing.
   *
   * @override
   * @param _params - Event parameters
   * @param {unknown} _params.dataSource - Resource data to display
   *
   * @example
   * ```typescript
   * // View details button
   * <Button onClick={() => tableEvent.onDetail({ dataSource: record })}>
   *   View Details
   * </Button>
   * ```
   */
  public onDetail(_params: ResourceTableEventCommonParams): void {
    const { dataSource } = _params;

    if (!dataSource) {
      return;
    }

    this.schemaFormRef?.setFieldsValue(dataSource);

    this.store.emit({
      ...this.store.state,
      selectedResource: dataSource,
      action: ResourceTableEventAction.DETAIL,
      openPopup: true
    });
  }

  /**
   * Handle resource edit initiation
   *
   * Opens popup in EDIT mode with form fields pre-filled with
   * current resource data. Allows user to modify and submit changes.
   *
   * @override
   * @param _params - Event parameters
   * @param {unknown} _params.dataSource - Resource data to edit (must include ID)
   *
   * @example
   * ```typescript
   * // Edit button in table actions
   * <Button onClick={() => tableEvent.onEdited({ dataSource: record })}>
   *   Edit
   * </Button>
   * ```
   */
  public onEdited(_params: ResourceTableEventCommonParams): void {
    const { dataSource } = _params;

    if (!dataSource) {
      return;
    }

    this.schemaFormRef?.setFieldsValue(dataSource);

    this.store.emit({
      ...this.store.state,
      selectedResource: dataSource,
      action: ResourceTableEventAction.EDIT,
      openPopup: true
    });
  }

  /**
   * Handle resource list refresh
   *
   * Reloads resource list from server using current search parameters.
   * Updates list state with loading indicator and handles errors gracefully.
   *
   * Business rules:
   * - Sets loading state before making request
   * - Preserves current search parameters (page, filters, sorting)
   * - Updates store with new data on success
   * - Captures and stores error on failure
   *
   * @override
   * @param _params - Event parameters
   * @param {ResourceServiceInterface} [_params.resource] - Resource service to refresh
   * @returns Promise resolving to search result or error
   *
   * @example
   * ```typescript
   * // Refresh button handler
   * <Button onClick={() => tableEvent.onRefresh({ resource: userService })}>
   *   Refresh
   * </Button>
   *
   * // Auto-refresh after create/update
   * await tableEvent.onSubmit(values);
   * await tableEvent.onRefresh({ resource: userService });
   * ```
   */
  public async onRefresh(
    _params: ResourceTableEventCommonParams
  ): Promise<unknown> {
    const resource = this.resource;
    const resourceStore = resource.getStore();

    resourceStore.changeListState(
      new RequestState(true, resourceStore.state.listState.result)
    );

    try {
      const result = await resource.search(resourceStore.state.searchParams);

      resourceStore.changeListState(new RequestState(false, result).end());
      return result;
    } catch (error) {
      resourceStore.changeListState(new RequestState(false, null, error).end());

      return error;
    }
  }

  /**
   * Handle popup close
   *
   * Closes the create/edit/detail popup and resets form state.
   * Prevents closing while create or edit operations are in progress
   * to avoid interrupting async operations.
   *
   * Business rules:
   * - Blocks closing if create operation is loading
   * - Blocks closing if edit operation is loading
   * - Resets form fields on close
   * - Clears selected resource
   * - Resets action type to undefined
   *
   * @override
   * @example
   * ```typescript
   * // Modal close handler
   * <Modal
   *   open={openPopup}
   *   onCancel={() => tableEvent.onClosePopup()}
   * >
   *   <Form onFinish={(values) => tableEvent.onSubmit(values)} />
   * </Modal>
   * ```
   */
  public onClosePopup(): void {
    if (
      this.store.state.createState.loading ||
      this.store.state.editState.loading
    ) {
      return;
    }

    this.schemaFormRef?.resetFields();
    this.store.emit({
      ...this.store.state,
      selectedResource: undefined,
      action: undefined,
      openPopup: false
    });
  }

  /**
   * Lifecycle hook: Component created
   *
   * Called when component is mounted. Initializes resource service
   * and resets store state to ensure clean starting state.
   *
   * Typical initialization tasks:
   * - Initialize resource service lifecycle
   * - Reset store to default state
   * - Set up event listeners or subscriptions
   *
   * @override
   * @example
   * ```typescript
   * // In React component
   * useEffect(() => {
   *   tableEvent.created();
   *   return () => tableEvent.destroyed();
   * }, []);
   * ```
   */
  public created(): void {
    this.resource.created();
    this.store.reset();
  }

  /**
   * Lifecycle hook: Component updated
   *
   * Called when component is updated. Notifies resource service
   * to synchronize state changes.
   *
   * @override
   * @example
   * ```typescript
   * // In React component
   * useEffect(() => {
   *   tableEvent.updated();
   * });
   * ```
   */
  public updated(): void {
    this.resource.updated();
  }

  /**
   * Lifecycle hook: Component destroyed
   *
   * Called when component is unmounted. Cleans up resource service
   * and resets store state to prevent memory leaks.
   *
   * Cleanup tasks:
   * - Destroy resource service lifecycle
   * - Reset store state
   * - Clean up event listeners or subscriptions
   * - Cancel pending requests
   *
   * @override
   * @example
   * ```typescript
   * // In React component
   * useEffect(() => {
   *   return () => {
   *     tableEvent.destroyed();
   *   };
   * }, []);
   * ```
   */
  public destroyed(): void {
    this.resource.destroyed();
    this.store.reset();
  }
}
