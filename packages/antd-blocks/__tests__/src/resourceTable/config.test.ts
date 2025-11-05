/**
 * config test-suite
 *
 * Coverage:
 * 1. resourceSelectors  – Resource state selectors tests
 * 2. eventSelectos      – Event state selectors tests
 * 3. edge cases         – Edge case tests
 * 4. type safety        – Type safety tests
 */

import { describe, it, expect } from 'vitest';
import {
  resourceSelectors,
  eventSelectos,
  type ResourceTableI18n,
  type ResourceTableActionI18n,
  type ResourceTableLocales,
  type ResourceTableHeaderI18n
} from '../../../src/resourceTable/config';
import { ResourceTableEventAction } from '../../../src/resourceTable/ResourceTableEventInterface';
import type { ResourceTableState } from '../../../src/resourceTable/ResourceEventStroe';
import {
  RequestState,
  type ResourceStateInterface,
  type ResourceQuery
} from '@qlover/corekit-bridge';

describe('config', () => {
  // Test data constants
  const createMockResourceState = (
    overrides: Partial<ResourceStateInterface> = {}
  ): ResourceStateInterface => ({
    searchParams: { page: 1, pageSize: 10 } as ResourceQuery,
    initState: new RequestState<unknown>(),
    listState: new RequestState(false, {
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    }).end(),
    ...overrides
  });

  const createMockEventState = (
    overrides: Partial<ResourceTableState> = {}
  ): ResourceTableState => ({
    action: ResourceTableEventAction.CREATE,
    createState: new RequestState<unknown>(),
    deleteState: new RequestState<unknown>(),
    editState: new RequestState<unknown>(),
    openPopup: false,
    selectedResource: undefined,
    ...overrides
  });

  // resourceSelectors tests
  describe('resourceSelectors', () => {
    describe('searchParams', () => {
      it('should return searchParams from state', () => {
        const mockState = createMockResourceState({
          searchParams: { page: 2, pageSize: 20 } as ResourceQuery
        });

        const result = resourceSelectors.searchParams(mockState);

        expect(result).toEqual({ page: 2, pageSize: 20 });
      });

      it('should handle empty searchParams', () => {
        const mockState = createMockResourceState({
          searchParams: {} as ResourceQuery
        });

        const result = resourceSelectors.searchParams(mockState);

        expect(result).toEqual({});
      });

      it('should handle minimal searchParams', () => {
        const mockState = createMockResourceState({
          searchParams: { page: 1 } as ResourceQuery
        });

        const result = resourceSelectors.searchParams(mockState);

        expect(result).toEqual({ page: 1 });
      });
    });

    describe('listState', () => {
      it('should return listState from state', () => {
        const listState = new RequestState(true, {
          list: [{ id: 1 }, { id: 2 }],
          total: 2,
          page: 1,
          pageSize: 10
        });

        const mockState = createMockResourceState({ listState });

        const result = resourceSelectors.listState(mockState);

        expect(result).toBe(listState);
        expect(result.loading).toBe(true);
        expect(result.result).toEqual({
          list: [{ id: 1 }, { id: 2 }],
          total: 2,
          page: 1,
          pageSize: 10
        });
      });

      it('should handle empty list', () => {
        const listState = new RequestState(false, {
          list: [],
          total: 0,
          page: 1,
          pageSize: 10
        }).end();

        const mockState = createMockResourceState({ listState });

        const result = resourceSelectors.listState(mockState);

        expect(result.result).toEqual({
          list: [],
          total: 0,
          page: 1,
          pageSize: 10
        });
      });

      it('should handle error state', () => {
        const listState = new RequestState(
          false,
          null,
          new Error('Network error')
        ).end();

        const mockState = createMockResourceState({ listState });

        const result = resourceSelectors.listState(mockState);

        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toBe('Network error');
      });
    });

    describe('listLoading', () => {
      it('should return true when loading', () => {
        const mockState = createMockResourceState({
          listState: new RequestState(true)
        });

        const result = resourceSelectors.listLoading(mockState);

        expect(result).toBe(true);
      });

      it('should return false when not loading', () => {
        const mockState = createMockResourceState({
          listState: new RequestState(false, {
            list: [],
            total: 0,
            page: 1,
            pageSize: 10
          }).end()
        });

        const result = resourceSelectors.listLoading(mockState);

        expect(result).toBe(false);
      });
    });
  });

  // eventSelectos tests (note: typo in original name)
  describe('eventSelectos', () => {
    describe('action', () => {
      it('should return action from state', () => {
        const mockState = createMockEventState({
          action: ResourceTableEventAction.EDIT
        });

        const result = eventSelectos.action(mockState);

        expect(result).toBe(ResourceTableEventAction.EDIT);
      });

      it('should handle CREATE action', () => {
        const mockState = createMockEventState({
          action: ResourceTableEventAction.CREATE
        });

        const result = eventSelectos.action(mockState);

        expect(result).toBe(ResourceTableEventAction.CREATE);
      });

      it('should handle DELETE action', () => {
        const mockState = createMockEventState({
          action: ResourceTableEventAction.DELETE
        });

        const result = eventSelectos.action(mockState);

        expect(result).toBe(ResourceTableEventAction.DELETE);
      });
    });

    describe('createState', () => {
      it('should return createState from state', () => {
        const createState = new RequestState(true, { id: 1, name: 'test' });

        const mockState = createMockEventState({ createState });

        const result = eventSelectos.createState(mockState);

        expect(result).toBe(createState);
        expect(result.loading).toBe(true);
        expect(result.result).toEqual({ id: 1, name: 'test' });
      });

      it('should handle error in createState', () => {
        const createState = new RequestState(
          false,
          null,
          new Error('Create failed')
        ).end();

        const mockState = createMockEventState({ createState });

        const result = eventSelectos.createState(mockState);

        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toBe('Create failed');
      });
    });

    describe('createLoading', () => {
      it('should return true when creating', () => {
        const mockState = createMockEventState({
          createState: new RequestState(true)
        });

        const result = eventSelectos.createLoading(mockState);

        expect(result).toBe(true);
      });

      it('should return false when not creating', () => {
        const mockState = createMockEventState({
          createState: new RequestState(false).end()
        });

        const result = eventSelectos.createLoading(mockState);

        expect(result).toBe(false);
      });
    });

    describe('editState', () => {
      it('should return editState from state', () => {
        const editState = new RequestState(true, { id: 1, name: 'updated' });

        const mockState = createMockEventState({ editState });

        const result = eventSelectos.editState(mockState);

        expect(result).toBe(editState);
        expect(result.result).toEqual({ id: 1, name: 'updated' });
      });

      it('should handle error in editState', () => {
        const editState = new RequestState(
          false,
          null,
          new Error('Update failed')
        ).end();

        const mockState = createMockEventState({ editState });

        const result = eventSelectos.editState(mockState);

        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toBe('Update failed');
      });
    });

    describe('editLoading', () => {
      it('should return true when editing', () => {
        const mockState = createMockEventState({
          editState: new RequestState(true)
        });

        const result = eventSelectos.editLoading(mockState);

        expect(result).toBe(true);
      });

      it('should return false when not editing', () => {
        const mockState = createMockEventState({
          editState: new RequestState(false).end()
        });

        const result = eventSelectos.editLoading(mockState);

        expect(result).toBe(false);
      });
    });

    describe('openPopup', () => {
      it('should return true when popup is open', () => {
        const mockState = createMockEventState({ openPopup: true });

        const result = eventSelectos.openPopup(mockState);

        expect(result).toBe(true);
      });

      it('should return false when popup is closed', () => {
        const mockState = createMockEventState({ openPopup: false });

        const result = eventSelectos.openPopup(mockState);

        expect(result).toBe(false);
      });
    });

    describe('isCreate', () => {
      it('should return true when action is CREATE', () => {
        const mockState = createMockEventState({
          action: ResourceTableEventAction.CREATE
        });

        const result = eventSelectos.isCreate(mockState);

        expect(result).toBe(true);
      });

      it('should return false when action is EDIT', () => {
        const mockState = createMockEventState({
          action: ResourceTableEventAction.EDIT
        });

        const result = eventSelectos.isCreate(mockState);

        expect(result).toBe(false);
      });

      it('should return false when action is DELETE', () => {
        const mockState = createMockEventState({
          action: ResourceTableEventAction.DELETE
        });

        const result = eventSelectos.isCreate(mockState);

        expect(result).toBe(false);
      });

      it('should return false when action is DETAIL', () => {
        const mockState = createMockEventState({
          action: ResourceTableEventAction.DETAIL
        });

        const result = eventSelectos.isCreate(mockState);

        expect(result).toBe(false);
      });
    });
  });

  // Type interface tests
  describe('Type interfaces', () => {
    describe('ResourceTableHeaderI18n', () => {
      it('should accept valid i18n object', () => {
        const i18n: ResourceTableHeaderI18n = {
          create: 'Create',
          refresh: 'Refresh',
          search: 'Search',
          reset: 'Reset',
          export: 'Export',
          settings: 'Settings'
        };

        expect(i18n.create).toBe('Create');
        expect(i18n.refresh).toBe('Refresh');
        expect(Object.keys(i18n)).toHaveLength(6);
      });
    });

    describe('ResourceTableI18n', () => {
      it('should extend ResourceTableHeaderI18n', () => {
        const i18n: ResourceTableI18n = {
          create: 'Create',
          refresh: 'Refresh',
          search: 'Search',
          reset: 'Reset',
          export: 'Export',
          settings: 'Settings',
          action: 'Action',
          editText: 'Edit',
          deleteText: 'Delete',
          detailText: 'Detail'
        };

        expect(i18n.action).toBe('Action');
        expect(i18n.editText).toBe('Edit');
        expect(i18n.deleteText).toBe('Delete');
        expect(i18n.detailText).toBe('Detail');
      });
    });

    describe('ResourceTableActionI18n', () => {
      it('should accept valid action i18n object', () => {
        const actionI18n: ResourceTableActionI18n = {
          editText: 'Edit',
          deleteText: 'Delete',
          detailText: 'Detail'
        };

        expect(actionI18n.editText).toBe('Edit');
        expect(actionI18n.deleteText).toBe('Delete');
        expect(actionI18n.detailText).toBe('Detail');
      });
    });

    describe('ResourceTableLocales', () => {
      it('should accept valid locales object', () => {
        const locales: ResourceTableLocales = {
          title: 'Title',
          description: 'Description',
          content: 'Content',
          keywords: 'Keywords',
          createTitle: 'Create Title',
          editTitle: 'Edit Title',
          detailTitle: 'Detail Title',
          deleteTitle: 'Delete Title',
          deleteContent: 'Delete Content',
          saveButton: 'Save',
          detailButton: 'Detail',
          cancelButton: 'Cancel',
          createButton: 'Create',
          importTitle: 'Import',
          importZhTitle: 'Import ZH',
          importEnTitle: 'Import EN'
        };

        expect(locales.title).toBe('Title');
        expect(locales.saveButton).toBe('Save');
        expect(Object.keys(locales)).toHaveLength(16);
      });

      it('should be readonly', () => {
        const locales: ResourceTableLocales = {
          title: 'Title',
          description: 'Description',
          content: 'Content',
          keywords: 'Keywords',
          createTitle: 'Create Title',
          editTitle: 'Edit Title',
          detailTitle: 'Detail Title',
          deleteTitle: 'Delete Title',
          deleteContent: 'Delete Content',
          saveButton: 'Save',
          detailButton: 'Detail',
          cancelButton: 'Cancel',
          createButton: 'Create',
          importTitle: 'Import',
          importZhTitle: 'Import ZH',
          importEnTitle: 'Import EN'
        };

        // Type check: these should fail at compile time
        // locales.title = 'New Title'; // Error: Cannot assign to 'title' because it is a read-only property
        expect(locales.title).toBe('Title');
      });
    });
  });

  // Integration tests
  describe('Integration tests', () => {
    it('should work with complete resource and event state', () => {
      const resourceState = createMockResourceState({
        searchParams: { page: 1, pageSize: 20 } as ResourceQuery,
        listState: new RequestState(true, {
          list: [{ id: 1 }, { id: 2 }],
          total: 2,
          page: 1,
          pageSize: 20
        })
      });

      const eventState = createMockEventState({
        action: ResourceTableEventAction.EDIT,
        openPopup: true,
        editState: new RequestState(false, { id: 1, name: 'updated' }).end()
      });

      // Resource selectors
      expect(resourceSelectors.searchParams(resourceState)).toEqual({
        page: 1,
        pageSize: 20
      });
      expect(resourceSelectors.listLoading(resourceState)).toBe(true);

      // Event selectors
      expect(eventSelectos.action(eventState)).toBe(
        ResourceTableEventAction.EDIT
      );
      expect(eventSelectos.openPopup(eventState)).toBe(true);
      expect(eventSelectos.isCreate(eventState)).toBe(false);
    });

    it('should handle state transitions correctly', () => {
      // Initial state: CREATE action
      let eventState = createMockEventState({
        action: ResourceTableEventAction.CREATE,
        openPopup: true,
        createState: new RequestState(true)
      });

      expect(eventSelectos.isCreate(eventState)).toBe(true);
      expect(eventSelectos.createLoading(eventState)).toBe(true);

      // After creation: EDIT action
      eventState = createMockEventState({
        action: ResourceTableEventAction.EDIT,
        openPopup: true,
        editState: new RequestState(false, { id: 1 }).end()
      });

      expect(eventSelectos.isCreate(eventState)).toBe(false);
      expect(eventSelectos.editLoading(eventState)).toBe(false);
    });
  });

  // Edge cases and boundary tests
  describe('Edge cases', () => {
    it('should handle state with minimal data', () => {
      const minimalResourceState = createMockResourceState({
        searchParams: {} as ResourceQuery,
        listState: new RequestState(false)
      });

      expect(() =>
        resourceSelectors.searchParams(minimalResourceState)
      ).not.toThrow();
      expect(() =>
        resourceSelectors.listLoading(minimalResourceState)
      ).not.toThrow();
    });

    it('should handle concurrent loading states', () => {
      const eventState = createMockEventState({
        createState: new RequestState(true),
        editState: new RequestState(true)
      });

      expect(eventSelectos.createLoading(eventState)).toBe(true);
      expect(eventSelectos.editLoading(eventState)).toBe(true);
    });

    it('should handle large pagination data', () => {
      const largeList = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
      const resourceState = createMockResourceState({
        listState: new RequestState(false, {
          list: largeList,
          total: 10000,
          page: 5,
          pageSize: 1000
        }).end()
      });

      const listState = resourceSelectors.listState(resourceState);
      expect(listState.result?.list).toHaveLength(1000);
      expect(listState.result?.total).toBe(10000);
    });
  });

  // Selector immutability tests
  describe('Selector immutability', () => {
    it('should not modify original state when selecting', () => {
      const originalState = createMockResourceState({
        searchParams: { page: 1, pageSize: 10 } as ResourceQuery
      });
      const originalSearchParams = { ...originalState.searchParams };

      resourceSelectors.searchParams(originalState);

      expect(originalState.searchParams).toEqual(originalSearchParams);
    });

    it('should return same reference for same state', () => {
      const state = createMockResourceState();

      const result1 = resourceSelectors.searchParams(state);
      const result2 = resourceSelectors.searchParams(state);

      expect(result1).toBe(result2);
    });
  });
});
