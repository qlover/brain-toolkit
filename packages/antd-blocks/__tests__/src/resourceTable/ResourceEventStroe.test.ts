/**
 * ResourceEventStroe test-suite
 *
 * Coverage:
 * 1. ResourceTableState   – State class tests
 * 2. ResourceEventStroe   – Store class tests
 * 3. changeCreateState    – Create state change tests
 * 4. changeEditState      – Edit state change tests
 * 5. state management     – State management tests
 * 6. edge cases           – Edge case tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ResourceEventStroe,
  ResourceTableState
} from '../../../src/resourceTable/ResourceEventStroe';
import { ResourceTableEventAction } from '../../../src/resourceTable/ResourceTableEventInterface';
import { RequestState } from '@qlover/corekit-bridge';

describe('ResourceEventStroe', () => {
  let store: ResourceEventStroe;

  beforeEach(() => {
    store = new ResourceEventStroe();
  });

  // ResourceTableState tests
  describe('ResourceTableState', () => {
    describe('constructor', () => {
      it('should create instance with default values', () => {
        const state = new ResourceTableState();

        expect(state.selectedResource).toBeUndefined();
        expect(state.action).toBeUndefined();
        expect(state.openPopup).toBe(false);
        expect(state.createState).toBeInstanceOf(RequestState);
        expect(state.deleteState).toBeInstanceOf(RequestState);
        expect(state.editState).toBeInstanceOf(RequestState);
      });

      it('should initialize with RequestState instances', () => {
        const state = new ResourceTableState();

        expect(state.createState.loading).toBe(false);
        expect(state.deleteState.loading).toBe(false);
        expect(state.editState.loading).toBe(false);
      });

      it('should allow property modifications', () => {
        const state = new ResourceTableState();

        state.selectedResource = { id: 1, name: 'test' };
        state.action = ResourceTableEventAction.CREATE;
        state.openPopup = true;

        expect(state.selectedResource).toEqual({ id: 1, name: 'test' });
        expect(state.action).toBe(ResourceTableEventAction.CREATE);
        expect(state.openPopup).toBe(true);
      });
    });

    describe('state properties', () => {
      it('should handle selectedResource as any type', () => {
        const state = new ResourceTableState();

        state.selectedResource = { id: 1 };
        expect(state.selectedResource).toEqual({ id: 1 });

        state.selectedResource = 'string value';
        expect(state.selectedResource).toBe('string value');

        state.selectedResource = [1, 2, 3];
        expect(state.selectedResource).toEqual([1, 2, 3]);
      });

      it('should handle all action types', () => {
        const state = new ResourceTableState();

        state.action = ResourceTableEventAction.CREATE;
        expect(state.action).toBe('create');

        state.action = ResourceTableEventAction.EDIT;
        expect(state.action).toBe('edit');

        state.action = ResourceTableEventAction.DELETE;
        expect(state.action).toBe('delete');

        state.action = ResourceTableEventAction.DETAIL;
        expect(state.action).toBe('detail');

        state.action = ResourceTableEventAction.REFRESH;
        expect(state.action).toBe('refresh');
      });

      it('should toggle openPopup', () => {
        const state = new ResourceTableState();

        expect(state.openPopup).toBe(false);

        state.openPopup = true;
        expect(state.openPopup).toBe(true);

        state.openPopup = false;
        expect(state.openPopup).toBe(false);
      });
    });
  });

  // ResourceEventStroe constructor tests
  describe('ResourceEventStroe.constructor', () => {
    it('should create instance with initial state', () => {
      const newStore = new ResourceEventStroe();

      expect(newStore).toBeInstanceOf(ResourceEventStroe);
      expect(newStore.state).toBeDefined();
      expect(newStore.state).toBeInstanceOf(ResourceTableState);
    });

    it('should initialize with default ResourceTableState', () => {
      const newStore = new ResourceEventStroe();

      expect(newStore.state.selectedResource).toBeUndefined();
      expect(newStore.state.action).toBeUndefined();
      expect(newStore.state.openPopup).toBe(false);
      expect(newStore.state.createState).toBeInstanceOf(RequestState);
      expect(newStore.state.deleteState).toBeInstanceOf(RequestState);
      expect(newStore.state.editState).toBeInstanceOf(RequestState);
    });

    it('should create independent instances', () => {
      const store1 = new ResourceEventStroe();
      const store2 = new ResourceEventStroe();

      store1.state.openPopup = true;
      store2.state.openPopup = false;

      expect(store1.state.openPopup).toBe(true);
      expect(store2.state.openPopup).toBe(false);
    });
  });

  // changeCreateState tests
  describe('ResourceEventStroe.changeCreateState', () => {
    it('should update createState', () => {
      const newState = new RequestState(true);

      store.changeCreateState(newState);

      expect(store.state.createState).toBe(newState);
      expect(store.state.createState.loading).toBe(true);
    });

    it('should preserve other state properties', () => {
      store.state.selectedResource = { id: 1 };
      store.state.action = ResourceTableEventAction.CREATE;
      store.state.openPopup = true;

      const newState = new RequestState(true, { result: 'data' });
      store.changeCreateState(newState);

      expect(store.state.createState).toBe(newState);
      expect(store.state.selectedResource).toEqual({ id: 1 });
      expect(store.state.action).toBe(ResourceTableEventAction.CREATE);
      expect(store.state.openPopup).toBe(true);
    });

    it('should handle loading state change', () => {
      const loadingState = new RequestState(true);
      store.changeCreateState(loadingState);

      expect(store.state.createState.loading).toBe(true);

      const completedState = new RequestState(false, { id: 1 }).end();
      store.changeCreateState(completedState);

      expect(store.state.createState.loading).toBe(false);
      expect(store.state.createState.result).toEqual({ id: 1 });
    });

    it('should handle error state', () => {
      const errorState = new RequestState(
        false,
        null,
        new Error('Create failed')
      ).end();

      store.changeCreateState(errorState);

      expect(store.state.createState.error).toBeInstanceOf(Error);
      expect((store.state.createState.error as Error).message).toBe(
        'Create failed'
      );
    });

    it('should trigger state update multiple times', () => {
      const state1 = new RequestState(true);
      const state2 = new RequestState(false, { id: 1 }).end();
      const state3 = new RequestState(false, { id: 2 }).end();

      store.changeCreateState(state1);
      expect(store.state.createState).toBe(state1);

      store.changeCreateState(state2);
      expect(store.state.createState).toBe(state2);

      store.changeCreateState(state3);
      expect(store.state.createState).toBe(state3);
    });
  });

  // changeEditState tests
  describe('ResourceEventStroe.changeEditState', () => {
    it('should update editState', () => {
      const newState = new RequestState(true);

      store.changeEditState(newState);

      expect(store.state.editState).toBe(newState);
      expect(store.state.editState.loading).toBe(true);
    });

    it('should preserve other state properties', () => {
      store.state.selectedResource = { id: 1 };
      store.state.action = ResourceTableEventAction.EDIT;
      store.state.openPopup = true;

      const newState = new RequestState(true, { result: 'data' });
      store.changeEditState(newState);

      expect(store.state.editState).toBe(newState);
      expect(store.state.selectedResource).toEqual({ id: 1 });
      expect(store.state.action).toBe(ResourceTableEventAction.EDIT);
      expect(store.state.openPopup).toBe(true);
    });

    it('should handle loading state change', () => {
      const loadingState = new RequestState(true);
      store.changeEditState(loadingState);

      expect(store.state.editState.loading).toBe(true);

      const completedState = new RequestState(false, { id: 1 }).end();
      store.changeEditState(completedState);

      expect(store.state.editState.loading).toBe(false);
      expect(store.state.editState.result).toEqual({ id: 1 });
    });

    it('should handle error state', () => {
      const errorState = new RequestState(
        false,
        null,
        new Error('Update failed')
      ).end();

      store.changeEditState(errorState);

      expect(store.state.editState.error).toBeInstanceOf(Error);
      expect((store.state.editState.error as Error).message).toBe(
        'Update failed'
      );
    });

    it('should trigger state update multiple times', () => {
      const state1 = new RequestState(true);
      const state2 = new RequestState(false, { id: 1 }).end();
      const state3 = new RequestState(false, { id: 2 }).end();

      store.changeEditState(state1);
      expect(store.state.editState).toBe(state1);

      store.changeEditState(state2);
      expect(store.state.editState).toBe(state2);

      store.changeEditState(state3);
      expect(store.state.editState).toBe(state3);
    });
  });

  // State management integration tests
  describe('State management', () => {
    it('should handle independent create and edit states', () => {
      const createState = new RequestState(true);
      const editState = new RequestState(false, { id: 1 }).end();

      store.changeCreateState(createState);
      store.changeEditState(editState);

      expect(store.state.createState.loading).toBe(true);
      expect(store.state.editState.loading).toBe(false);
      expect(store.state.editState.result).toEqual({ id: 1 });
    });

    it('should maintain deleteState when updating create and edit states', () => {
      const initialDeleteState = store.state.deleteState;

      store.changeCreateState(new RequestState(true));
      expect(store.state.deleteState).toBe(initialDeleteState);

      store.changeEditState(new RequestState(true));
      expect(store.state.deleteState).toBe(initialDeleteState);
    });

    it('should handle state transitions correctly', () => {
      // Initial state
      expect(store.state.createState.loading).toBe(false);
      expect(store.state.editState.loading).toBe(false);

      // Start create
      store.changeCreateState(new RequestState(true));
      expect(store.state.createState.loading).toBe(true);

      // Complete create
      store.changeCreateState(new RequestState(false, { id: 1 }).end());
      expect(store.state.createState.loading).toBe(false);
      expect(store.state.createState.result).toEqual({ id: 1 });

      // Start edit
      store.changeEditState(new RequestState(true));
      expect(store.state.editState.loading).toBe(true);

      // Complete edit
      store.changeEditState(
        new RequestState(false, { id: 1, updated: true }).end()
      );
      expect(store.state.editState.loading).toBe(false);
      expect(store.state.editState.result).toEqual({ id: 1, updated: true });
    });

    it('should work with emit and state spreading', () => {
      const customResource = { id: 123, name: 'test' };

      store.emit({
        ...store.state,
        selectedResource: customResource,
        action: ResourceTableEventAction.CREATE,
        openPopup: true
      });

      expect(store.state.selectedResource).toEqual(customResource);
      expect(store.state.action).toBe(ResourceTableEventAction.CREATE);
      expect(store.state.openPopup).toBe(true);
    });
  });

  // State emission tests
  describe('State emission', () => {
    it('should emit state when changeCreateState is called', () => {
      const newState = new RequestState(true);
      const initialState = { ...store.state };

      store.changeCreateState(newState);

      expect(store.state.createState).toBe(newState);
      expect(store.state.selectedResource).toBe(initialState.selectedResource);
      expect(store.state.action).toBe(initialState.action);
      expect(store.state.openPopup).toBe(initialState.openPopup);
    });

    it('should emit state when changeEditState is called', () => {
      const newState = new RequestState(true);
      const initialState = { ...store.state };

      store.changeEditState(newState);

      expect(store.state.editState).toBe(newState);
      expect(store.state.selectedResource).toBe(initialState.selectedResource);
      expect(store.state.action).toBe(initialState.action);
      expect(store.state.openPopup).toBe(initialState.openPopup);
    });

    it('should emit complete state object', () => {
      const createState = new RequestState(true, { id: 1 });

      store.changeCreateState(createState);

      expect(store.state).toEqual({
        selectedResource: undefined,
        action: undefined,
        openPopup: false,
        createState: createState,
        deleteState: expect.any(RequestState),
        editState: expect.any(RequestState)
      });
    });

    it('should maintain state consistency across emissions', () => {
      store.emit({
        ...store.state,
        selectedResource: { id: 1 },
        action: ResourceTableEventAction.CREATE,
        openPopup: true
      });

      const createState = new RequestState(true);
      store.changeCreateState(createState);

      expect(store.state.createState).toBe(createState);
      expect(store.state.selectedResource).toEqual({ id: 1 });
      expect(store.state.action).toBe(ResourceTableEventAction.CREATE);
      expect(store.state.openPopup).toBe(true);
    });
  });

  // Edge cases and boundary tests
  describe('Edge cases', () => {
    it('should handle rapid state changes', () => {
      for (let i = 0; i < 100; i++) {
        store.changeCreateState(new RequestState(i % 2 === 0));
      }

      expect(store.state.createState.loading).toBe(false);
    });

    it('should handle null result in RequestState', () => {
      const stateWithNull = new RequestState(false, null).end();

      store.changeCreateState(stateWithNull);

      expect(store.state.createState.result).toBeNull();
    });

    it('should handle undefined result in RequestState', () => {
      const stateWithUndefined = new RequestState(false).end();

      store.changeEditState(stateWithUndefined);

      // RequestState might convert undefined to null or keep it as undefined
      expect([null, undefined]).toContain(store.state.editState.result);
    });

    it('should handle complex objects in RequestState', () => {
      const complexObject = {
        id: 1,
        nested: {
          deep: {
            value: 'test',
            array: [1, 2, 3]
          }
        },
        date: new Date('2024-01-01')
      };

      const state = new RequestState(false, complexObject).end();
      store.changeCreateState(state);

      expect(store.state.createState.result).toEqual(complexObject);
    });

    it('should handle concurrent state updates', () => {
      const createState = new RequestState(true);
      const editState = new RequestState(true);

      store.changeCreateState(createState);
      store.changeEditState(editState);

      expect(store.state.createState.loading).toBe(true);
      expect(store.state.editState.loading).toBe(true);

      const createDone = new RequestState(false, { id: 1 }).end();
      store.changeCreateState(createDone);

      expect(store.state.createState.loading).toBe(false);
      expect(store.state.editState.loading).toBe(true); // Still loading
    });
  });

  // Reset functionality tests
  describe('Reset functionality', () => {
    it('should reset to initial state', () => {
      // Modify state
      store.state.selectedResource = { id: 1 };
      store.state.action = ResourceTableEventAction.EDIT;
      store.state.openPopup = true;
      store.changeCreateState(new RequestState(true));
      store.changeEditState(new RequestState(true));

      // Reset
      store.reset();

      // Verify reset
      expect(store.state).toBeInstanceOf(ResourceTableState);
      expect(store.state.selectedResource).toBeUndefined();
      expect(store.state.action).toBeUndefined();
      expect(store.state.openPopup).toBe(false);
      expect(store.state.createState).toBeInstanceOf(RequestState);
      expect(store.state.createState.loading).toBe(false);
      expect(store.state.editState).toBeInstanceOf(RequestState);
      expect(store.state.editState.loading).toBe(false);
    });
  });
});
