/**
 * Resource State Implementation
 *
 * Provides default state structure for resource management
 */
import {
  ResourceStateInterface,
  ResourceQuery,
  RequestState
} from '@qlover/corekit-bridge';

/**
 * Default ResourceState implementation
 *
 * Significance: Provides concrete state structure for resource services
 * Core idea: Centralize state management with sensible defaults
 * Main function: Track search parameters and operation states
 * Main purpose: Simplify resource service implementation
 *
 * @example
 * ```typescript
 * const store = new ResourceStore(() => new ResourceState());
 * ```
 */
export class ResourceState implements ResourceStateInterface {
  /**
   * Search and pagination parameters
   */
  searchParams: ResourceQuery = {
    page: 1,
    pageSize: 10,
    orderBy: 'updated_at',
    order: 1
  };

  /**
   * Initial load state
   */
  initState = new RequestState<unknown>();

  /**
   * List/search operation state
   */
  listState = new RequestState<unknown>();
}
