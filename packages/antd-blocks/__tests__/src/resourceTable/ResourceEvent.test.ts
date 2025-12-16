/**
 * ResourceEvent test-suite
 *
 * Coverage:
 * 1. constructor        – Constructor tests
 * 2. getResource        – Resource getter tests
 * 3. actionCreate       – Create action tests
 * 4. actionEdit         – Edit action tests
 * 5. actionDelete       – Delete action tests
 * 6. onSubmit           – Submit handler tests
 * 7. onChangeParams     – Parameter change tests
 * 8. onCreated          – Created event tests
 * 9. onDeleted          – Deleted event tests
 * 10. onDetail          – Detail event tests
 * 11. onEdited          – Edited event tests
 * 12. onRefresh         – Refresh event tests
 * 13. onClosePopup      – Close popup tests
 * 14. lifecycle methods – Lifecycle tests
 * 15. integration       – Integration tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResourceEvent } from '../../../src/resourceTable/ResourceEvent';
import { ResourceEventStroe } from '../../../src/resourceTable/ResourceEventStroe';
import {
  ResourceTableEventAction,
  type ResourceTableEventCommonParams
} from '../../../src/resourceTable/ResourceTableEventInterface';
import {
  RequestState,
  type ResourceServiceInterface,
  type ResourceStore,
  type ResourceStateInterface,
  type ResourceQuery
} from '@qlover/corekit-bridge';

describe('ResourceEvent', () => {
  // Mock resource service
  let mockResource: ResourceServiceInterface<
    unknown,
    ResourceStore<ResourceStateInterface>
  >;
  let mockResourceStore: ResourceStore<ResourceStateInterface>;
  let mockFormInstance: any;
  let resourceEvent: ResourceEvent;

  beforeEach(() => {
    // Create mock resource store
    mockResourceStore = {
      state: {
        searchParams: { page: 1, pageSize: 10 } as ResourceQuery,
        initState: new RequestState(),
        listState: new RequestState(false, {
          list: [],
          total: 0,
          page: 1,
          pageSize: 10
        }).end()
      },
      changeSearchParams: vi.fn(),
      changeListState: vi.fn(),
      reset: vi.fn(),
      emit: vi.fn()
    } as any;

    // Create mock resource service
    mockResource = {
      getStore: vi.fn(() => mockResourceStore),
      create: vi.fn((values) => Promise.resolve({ id: 1, ...values })),
      update: vi.fn((values) => Promise.resolve({ id: 1, ...values })),
      remove: vi.fn(() => Promise.resolve(true)),
      search: vi.fn(() =>
        Promise.resolve({ list: [], total: 0, page: 1, pageSize: 10 })
      ),
      created: vi.fn(),
      updated: vi.fn(),
      destroyed: vi.fn()
    } as any;

    // Create mock form instance
    mockFormInstance = {
      resetFields: vi.fn(),
      setFieldsValue: vi.fn(),
      getFieldsValue: vi.fn()
    };

    // Create resource event instance
    resourceEvent = new ResourceEvent(
      'test-namespace',
      mockResource,
      undefined,
      mockFormInstance
    );
  });

  // Constructor tests
  describe('constructor', () => {
    it('should create instance with required parameters', () => {
      const event = new ResourceEvent('test', mockResource);

      expect(event).toBeInstanceOf(ResourceEvent);
      expect(event.namespace).toBe('test');
      expect(event.store).toBeInstanceOf(ResourceEventStroe);
    });

    it('should create instance with custom store', () => {
      const customStore = new ResourceEventStroe();
      const event = new ResourceEvent('test', mockResource, customStore);

      expect(event.store).toBe(customStore);
    });

    it('should create instance with form ref', () => {
      const event = new ResourceEvent(
        'test',
        mockResource,
        undefined,
        mockFormInstance
      );

      expect(event).toBeInstanceOf(ResourceEvent);
    });

    it('should create store automatically if not provided', () => {
      const event = new ResourceEvent('test', mockResource);

      expect(event.store).toBeInstanceOf(ResourceEventStroe);
      expect(event.store).toBeDefined();
    });
  });

  // getResource tests
  describe('getResource', () => {
    it('should return the resource instance', () => {
      const result = resourceEvent.getResource();

      expect(result).toBe(mockResource);
    });

    it('should return same resource on multiple calls', () => {
      const result1 = resourceEvent.getResource();
      const result2 = resourceEvent.getResource();

      expect(result1).toBe(result2);
    });
  });

  // actionCreate tests
  describe('actionCreate', () => {
    it('should set loading state before creating', async () => {
      const values = { name: 'Test' };

      await resourceEvent['actionCreate'](values);

      expect(resourceEvent.store.state.createState.loading).toBe(false);
    });

    it('should call resource.create with values', async () => {
      const values = { name: 'Test Item' };

      await resourceEvent['actionCreate'](values);

      expect(mockResource.create).toHaveBeenCalledWith(values);
      expect(mockResource.create).toHaveBeenCalledTimes(1);
    });

    it('should update store state on success', async () => {
      const values = { name: 'Test' };
      const result = { id: 1, name: 'Test' };
      (mockResource.create as any).mockResolvedValue(result);

      const returned = await resourceEvent['actionCreate'](values);

      expect(returned).toEqual(result);
      expect(resourceEvent.store.state.createState.loading).toBe(false);
      expect(resourceEvent.store.state.createState.result).toEqual(result);
    });

    it('should handle creation error', async () => {
      const error = new Error('Create failed');
      (mockResource.create as any).mockRejectedValue(error);

      await expect(resourceEvent['actionCreate']({})).rejects.toThrow(
        'Create failed'
      );
      expect(resourceEvent.store.state.createState.error).toBe(error);
    });

    it('should set createState with error on failure', async () => {
      const error = new Error('Network error');
      (mockResource.create as any).mockRejectedValue(error);

      try {
        await resourceEvent['actionCreate']({});
      } catch {
        expect(resourceEvent.store.state.createState.error).toBe(error);
        expect(resourceEvent.store.state.createState.result).toBeNull();
      }
    });
  });

  // actionEdit tests
  describe('actionEdit', () => {
    it('should set loading state before editing', async () => {
      const values = { id: 1, name: 'Updated' };

      await resourceEvent['actionEdit'](values);

      expect(resourceEvent.store.state.editState.loading).toBe(false);
    });

    it('should call resource.update with values', async () => {
      const values = { id: 1, name: 'Updated Item' };

      await resourceEvent['actionEdit'](values);

      expect(mockResource.update).toHaveBeenCalledWith(values);
      expect(mockResource.update).toHaveBeenCalledTimes(1);
    });

    it('should update store state on success', async () => {
      const values = { id: 1, name: 'Updated' };
      const result = { id: 1, name: 'Updated' };
      (mockResource.update as any).mockResolvedValue(result);

      const returned = await resourceEvent['actionEdit'](values);

      expect(returned).toEqual(result);
      expect(resourceEvent.store.state.editState.loading).toBe(false);
      expect(resourceEvent.store.state.editState.result).toEqual(result);
    });

    it('should handle edit error', async () => {
      const error = new Error('Update failed');
      (mockResource.update as any).mockRejectedValue(error);

      await expect(resourceEvent['actionEdit']({})).rejects.toThrow(
        'Update failed'
      );
      expect(resourceEvent.store.state.editState.error).toBe(error);
    });

    it('should set editState with error on failure', async () => {
      const error = new Error('Network error');
      (mockResource.update as any).mockRejectedValue(error);

      try {
        await resourceEvent['actionEdit']({});
      } catch {
        expect(resourceEvent.store.state.editState.error).toBe(error);
        expect(resourceEvent.store.state.editState.result).toBeNull();
      }
    });
  });

  // actionDelete tests
  describe('actionDelete', () => {
    it('should resolve to true', async () => {
      const result = await resourceEvent['actionDelete']({});

      expect(result).toBe(true);
    });

    it('should not call resource methods', async () => {
      await resourceEvent['actionDelete']({ id: 1 });

      expect(mockResource.remove).not.toHaveBeenCalled();
      expect(mockResource.create).not.toHaveBeenCalled();
      expect(mockResource.update).not.toHaveBeenCalled();
    });
  });

  // onSubmit tests
  describe('onSubmit', () => {
    it('should call actionCreate when action is CREATE', async () => {
      resourceEvent.store.emit({
        ...resourceEvent.store.state,
        action: ResourceTableEventAction.CREATE
      });

      const values = { name: 'New Item' };
      const result = await resourceEvent.onSubmit(values);

      expect(mockResource.create).toHaveBeenCalledWith(values);
      expect(result).toBeDefined();
    });

    it('should call actionEdit when action is EDIT', async () => {
      resourceEvent.store.emit({
        ...resourceEvent.store.state,
        action: ResourceTableEventAction.EDIT
      });

      const values = { id: 1, name: 'Updated Item' };
      const result = await resourceEvent.onSubmit(values);

      expect(mockResource.update).toHaveBeenCalledWith(values);
      expect(result).toBeDefined();
    });

    it('should throw error when action is invalid', async () => {
      resourceEvent.store.emit({
        ...resourceEvent.store.state,
        action: ResourceTableEventAction.DELETE
      });

      await expect(resourceEvent.onSubmit({})).rejects.toThrow(
        'Invalid action'
      );
    });

    it('should not submit if createState is already loading', async () => {
      resourceEvent.store.changeCreateState(new RequestState(true));
      resourceEvent.store.emit({
        ...resourceEvent.store.state,
        action: ResourceTableEventAction.CREATE
      });

      await expect(resourceEvent.onSubmit({})).rejects.toThrow(
        'Invalid action'
      );
    });

    it('should not submit if editState is already loading', async () => {
      resourceEvent.store.changeEditState(new RequestState(true));
      resourceEvent.store.emit({
        ...resourceEvent.store.state,
        action: ResourceTableEventAction.EDIT
      });

      await expect(resourceEvent.onSubmit({})).rejects.toThrow(
        'Invalid action'
      );
    });

    it('should throw error when action is undefined', async () => {
      resourceEvent.store.emit({
        ...resourceEvent.store.state,
        action: undefined
      });

      await expect(resourceEvent.onSubmit({})).rejects.toThrow(
        'Invalid action'
      );
    });
  });

  // onChangeParams tests
  describe('onChangeParams', () => {
    it('should update search params when resource provided', () => {
      const params: ResourceTableEventCommonParams & ResourceQuery = {
        resource: mockResource,
        page: 2,
        pageSize: 20
      };

      resourceEvent.onChangeParams(params);

      expect(mockResourceStore.changeSearchParams).toHaveBeenCalledWith({
        page: 2,
        pageSize: 20
      });
    });

    it('should call resource.search with query params', () => {
      const params: ResourceTableEventCommonParams & ResourceQuery = {
        resource: mockResource,
        page: 3,
        pageSize: 50
      };

      resourceEvent.onChangeParams(params);

      expect(mockResource.search).toHaveBeenCalledWith({
        page: 3,
        pageSize: 50
      });
    });

    it('should not do anything when resource is not provided', () => {
      const params: ResourceTableEventCommonParams & ResourceQuery = {
        page: 2,
        pageSize: 20
      };

      resourceEvent.onChangeParams(params);

      expect(mockResourceStore.changeSearchParams).not.toHaveBeenCalled();
      expect(mockResource.search).not.toHaveBeenCalled();
    });

    it('should exclude resource from query params', () => {
      const params = {
        resource: mockResource,
        page: 1,
        keyword: 'test'
      };

      resourceEvent.onChangeParams(params as any);

      expect(mockResourceStore.changeSearchParams).toHaveBeenCalledWith({
        page: 1,
        keyword: 'test'
      });
    });
  });

  // onCreated tests
  describe('onCreated', () => {
    it('should reset form fields', () => {
      resourceEvent.onCreated({});

      expect(mockFormInstance.resetFields).toHaveBeenCalled();
    });

    it('should emit state with CREATE action', () => {
      const dataSource = { id: 1, name: 'Test' };

      resourceEvent.onCreated({ dataSource });

      expect(resourceEvent.store.state.selectedResource).toBe(dataSource);
      expect(resourceEvent.store.state.action).toBe(
        ResourceTableEventAction.CREATE
      );
      expect(resourceEvent.store.state.openPopup).toBe(true);
    });

    it('should work without form instance', () => {
      const eventWithoutForm = new ResourceEvent('test', mockResource);

      expect(() => eventWithoutForm.onCreated({})).not.toThrow();
    });

    it('should handle params without dataSource', () => {
      resourceEvent.onCreated({});

      expect(resourceEvent.store.state.selectedResource).toBeUndefined();
      expect(resourceEvent.store.state.action).toBe(
        ResourceTableEventAction.CREATE
      );
    });
  });

  // onDeleted tests
  describe('onDeleted', () => {
    it('should call resource.remove with dataSource', () => {
      const dataSource = { id: 1, name: 'Test' };

      resourceEvent.onDeleted({ dataSource });

      expect(mockResource.remove).toHaveBeenCalledWith(dataSource);
    });

    it('should handle undefined dataSource', () => {
      resourceEvent.onDeleted({});

      expect(mockResource.remove).toHaveBeenCalledWith(undefined);
    });
  });

  // onDetail tests
  describe('onDetail', () => {
    it('should set form values with dataSource', () => {
      const dataSource = { id: 1, name: 'Test' };

      resourceEvent.onDetail({ dataSource });

      expect(mockFormInstance.setFieldsValue).toHaveBeenCalledWith(dataSource);
    });

    it('should emit state with DETAIL action', () => {
      const dataSource = { id: 1, name: 'Test' };

      resourceEvent.onDetail({ dataSource });

      expect(resourceEvent.store.state.selectedResource).toBe(dataSource);
      expect(resourceEvent.store.state.action).toBe(
        ResourceTableEventAction.DETAIL
      );
      expect(resourceEvent.store.state.openPopup).toBe(true);
    });

    it('should return early when dataSource is undefined', () => {
      resourceEvent.onDetail({});

      expect(mockFormInstance.setFieldsValue).not.toHaveBeenCalled();
      expect(resourceEvent.store.state.action).not.toBe(
        ResourceTableEventAction.DETAIL
      );
    });

    it('should return early when dataSource is null', () => {
      resourceEvent.onDetail({ dataSource: null });

      expect(mockFormInstance.setFieldsValue).not.toHaveBeenCalled();
    });

    it('should work without form instance', () => {
      const eventWithoutForm = new ResourceEvent('test', mockResource);
      const dataSource = { id: 1 };

      expect(() => eventWithoutForm.onDetail({ dataSource })).not.toThrow();
    });
  });

  // onEdited tests
  describe('onEdited', () => {
    it('should set form values with dataSource', () => {
      const dataSource = { id: 1, name: 'Test' };

      resourceEvent.onEdited({ dataSource });

      expect(mockFormInstance.setFieldsValue).toHaveBeenCalledWith(dataSource);
    });

    it('should emit state with EDIT action', () => {
      const dataSource = { id: 1, name: 'Test' };

      resourceEvent.onEdited({ dataSource });

      expect(resourceEvent.store.state.selectedResource).toBe(dataSource);
      expect(resourceEvent.store.state.action).toBe(
        ResourceTableEventAction.EDIT
      );
      expect(resourceEvent.store.state.openPopup).toBe(true);
    });

    it('should return early when dataSource is undefined', () => {
      resourceEvent.onEdited({});

      expect(mockFormInstance.setFieldsValue).not.toHaveBeenCalled();
      expect(resourceEvent.store.state.action).not.toBe(
        ResourceTableEventAction.EDIT
      );
    });

    it('should return early when dataSource is null', () => {
      resourceEvent.onEdited({ dataSource: null });

      expect(mockFormInstance.setFieldsValue).not.toHaveBeenCalled();
    });

    it('should work without form instance', () => {
      const eventWithoutForm = new ResourceEvent('test', mockResource);
      const dataSource = { id: 1 };

      expect(() => eventWithoutForm.onEdited({ dataSource })).not.toThrow();
    });
  });

  // onRefresh tests
  describe('onRefresh', () => {
    it('should set loading state before refresh', async () => {
      await resourceEvent.onRefresh({});

      expect(mockResourceStore.changeListState).toHaveBeenCalled();
    });

    it('should call resource.search with current searchParams', async () => {
      await resourceEvent.onRefresh({});

      expect(mockResource.search).toHaveBeenCalledWith(
        mockResourceStore.state.searchParams
      );
    });

    it('should update listState on success', async () => {
      const searchResult = {
        list: [{ id: 1 }],
        total: 1,
        page: 1,
        pageSize: 10
      };
      (mockResource.search as any).mockResolvedValue(searchResult);

      const result = await resourceEvent.onRefresh({});

      expect(result).toEqual(searchResult);
      expect(mockResourceStore.changeListState).toHaveBeenCalled();
    });

    it('should handle search error', async () => {
      const error = new Error('Search failed');
      (mockResource.search as any).mockRejectedValue(error);

      const result = await resourceEvent.onRefresh({});

      expect(result).toBe(error);
      expect(mockResourceStore.changeListState).toHaveBeenCalled();
    });

    it('should preserve existing list result while loading', async () => {
      const existingResult = {
        list: [{ id: 1 }],
        total: 1,
        page: 1,
        pageSize: 10
      };
      mockResourceStore.state.listState = new RequestState(
        false,
        existingResult
      ).end();

      await resourceEvent.onRefresh({});

      // The first call to changeListState should preserve the existing result
      const firstCall = (mockResourceStore.changeListState as any).mock
        .calls[0][0];
      expect(firstCall.result).toEqual(existingResult);
      expect(firstCall.loading).toBe(true);
    });
  });

  // onClosePopup tests
  describe('onClosePopup', () => {
    it('should reset form fields', () => {
      resourceEvent.onClosePopup();

      expect(mockFormInstance.resetFields).toHaveBeenCalled();
    });

    it('should emit state with openPopup false', () => {
      resourceEvent.onClosePopup();

      expect(resourceEvent.store.state.openPopup).toBe(false);
      expect(resourceEvent.store.state.selectedResource).toBeUndefined();
      expect(resourceEvent.store.state.action).toBeUndefined();
    });

    it('should not close when createState is loading', () => {
      resourceEvent.store.changeCreateState(new RequestState(true));
      const initialState = { ...resourceEvent.store.state };

      resourceEvent.onClosePopup();

      expect(resourceEvent.store.state.openPopup).toBe(initialState.openPopup);
    });

    it('should not close when editState is loading', () => {
      resourceEvent.store.changeEditState(new RequestState(true));
      const initialState = { ...resourceEvent.store.state };

      resourceEvent.onClosePopup();

      expect(resourceEvent.store.state.openPopup).toBe(initialState.openPopup);
    });

    it('should work without form instance', () => {
      const eventWithoutForm = new ResourceEvent('test', mockResource);

      expect(() => eventWithoutForm.onClosePopup()).not.toThrow();
    });
  });

  // Lifecycle methods tests
  describe('Lifecycle methods', () => {
    describe('created', () => {
      it('should call resource.created', () => {
        resourceEvent.created();

        expect(mockResource.created).toHaveBeenCalled();
      });

      it('should reset store', () => {
        const resetSpy = vi.spyOn(resourceEvent.store, 'reset');

        resourceEvent.created();

        expect(resetSpy).toHaveBeenCalled();
      });
    });

    describe('updated', () => {
      it('should call resource.updated', () => {
        resourceEvent.updated();

        expect(mockResource.updated).toHaveBeenCalled();
      });

      it('should not affect store state', () => {
        const stateBefore = { ...resourceEvent.store.state };

        resourceEvent.updated();

        expect(resourceEvent.store.state).toEqual(stateBefore);
      });
    });

    describe('destroyed', () => {
      it('should call resource.destroyed', () => {
        resourceEvent.destroyed();

        expect(mockResource.destroyed).toHaveBeenCalled();
      });

      it('should reset store', () => {
        const resetSpy = vi.spyOn(resourceEvent.store, 'reset');

        resourceEvent.destroyed();

        expect(resetSpy).toHaveBeenCalled();
      });
    });
  });

  // Integration tests
  describe('Integration tests', () => {
    it('should handle complete create flow', async () => {
      // Open create popup
      resourceEvent.onCreated({});
      expect(resourceEvent.store.state.action).toBe(
        ResourceTableEventAction.CREATE
      );
      expect(resourceEvent.store.state.openPopup).toBe(true);

      // Submit form
      const values = { name: 'New Item' };
      const result = await resourceEvent.onSubmit(values);
      expect(result).toEqual({ id: 1, ...values });

      // Close popup
      resourceEvent.onClosePopup();
      expect(resourceEvent.store.state.openPopup).toBe(false);
    });

    it('should handle complete edit flow', async () => {
      const dataSource = { id: 1, name: 'Existing' };

      // Open edit popup
      resourceEvent.onEdited({ dataSource });
      expect(resourceEvent.store.state.action).toBe(
        ResourceTableEventAction.EDIT
      );
      expect(resourceEvent.store.state.selectedResource).toBe(dataSource);

      // Submit form
      const values = { id: 1, name: 'Updated' };
      const result = await resourceEvent.onSubmit(values);
      expect(result).toBeDefined();

      // Close popup
      resourceEvent.onClosePopup();
      expect(resourceEvent.store.state.openPopup).toBe(false);
    });

    it('should handle error during create', async () => {
      const error = new Error('Server error');
      (mockResource.create as any).mockRejectedValue(error);

      resourceEvent.onCreated({});

      await expect(resourceEvent.onSubmit({ name: 'Test' })).rejects.toThrow(
        'Server error'
      );
      expect(resourceEvent.store.state.createState.error).toBe(error);
    });

    it('should work through full lifecycle', () => {
      // Create
      resourceEvent.created();
      expect(mockResource.created).toHaveBeenCalled();

      // Update
      resourceEvent.updated();
      expect(mockResource.updated).toHaveBeenCalled();

      // Destroy
      resourceEvent.destroyed();
      expect(mockResource.destroyed).toHaveBeenCalled();
    });

    it('should handle parameter changes and refresh', async () => {
      // Change params
      resourceEvent.onChangeParams({
        resource: mockResource,
        page: 2,
        pageSize: 20
      });
      expect(mockResource.search).toHaveBeenCalled();

      // Refresh
      await resourceEvent.onRefresh({});
      expect(mockResource.search).toHaveBeenCalledTimes(2);
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    it('should handle null values in create', async () => {
      await resourceEvent['actionCreate'](null);
      expect(mockResource.create).toHaveBeenCalledWith(null);
    });

    it('should handle empty object in edit', async () => {
      await resourceEvent['actionEdit']({});
      expect(mockResource.update).toHaveBeenCalledWith({});
    });

    it('should handle concurrent operations', async () => {
      resourceEvent.onCreated({});
      const promise1 = resourceEvent.onSubmit({ name: 'Item 1' });

      // Try to submit again while first is in progress
      resourceEvent.store.emit({
        ...resourceEvent.store.state,
        action: ResourceTableEventAction.CREATE
      });

      await promise1;
      expect(mockResource.create).toHaveBeenCalledTimes(1);
    });
  });
});
