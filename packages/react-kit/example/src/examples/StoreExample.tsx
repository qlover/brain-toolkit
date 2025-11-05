/**
 * Store Hook Examples
 *
 * Demonstrates useStore for reactive state management
 */
import { useState } from 'react';
import { useFactory, useStore } from '@brain-toolkit/react-kit';
import { StoreInterface } from '@qlover/corekit-bridge';

/**
 * Simple Counter Store
 */
interface CounterState {
  count: number;
  lastUpdated: number;
}

class CounterStore extends StoreInterface<CounterState> {
  constructor() {
    super(() => ({
      count: 0,
      lastUpdated: Date.now()
    }));
  }

  increment(): void {
    this.emit({
      ...this.state,
      count: this.state.count + 1,
      lastUpdated: Date.now()
    });
  }

  decrement(): void {
    this.emit({
      ...this.state,
      count: this.state.count - 1,
      lastUpdated: Date.now()
    });
  }

  reset(): void {
    this.emit({
      count: 0,
      lastUpdated: Date.now()
    });
  }
}

/**
 * Todo Store
 */
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
}

class TodoStore extends StoreInterface<TodoState> {
  constructor() {
    super(() => ({
      todos: [],
      filter: 'all'
    }));
  }

  addTodo(text: string): void {
    const newTodo: Todo = {
      id: Date.now().toString(),
      text,
      completed: false
    };
    this.emit({
      ...this.state,
      todos: [...this.state.todos, newTodo]
    });
  }

  toggleTodo(id: string): void {
    this.emit({
      ...this.state,
      todos: this.state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    });
  }

  deleteTodo(id: string): void {
    this.emit({
      ...this.state,
      todos: this.state.todos.filter((todo) => todo.id !== id)
    });
  }

  setFilter(filter: 'all' | 'active' | 'completed'): void {
    this.emit({
      ...this.state,
      filter
    });
  }
}

/**
 * Example 1: Basic Store Usage
 */
function BasicStoreExample() {
  const store = useFactory(CounterStore);
  const state = useStore(store);

  return (
    <div className="example-card">
      <h3 className="example-title">Basic useStore Example</h3>
      <p className="page-description">
        Subscribe to store state and trigger re-renders when state changes. The
        component automatically updates when you modify the store.
      </p>
      <div className="demo-section">
        <div className="counter-display">{state.count}</div>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
          Last updated: {new Date(state.lastUpdated).toLocaleTimeString()}
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button className="button primary" onClick={() => store.increment()}>
            Increment
          </button>
          <button className="button primary" onClick={() => store.decrement()}>
            Decrement
          </button>
          <button className="button" onClick={() => store.reset()}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 2: Store with Selector
 */
function SelectorExample() {
  const store = useFactory(CounterStore);

  // Only subscribe to count, not lastUpdated
  const count = useStore(store, (state) => state.count);

  return (
    <div className="example-card">
      <h3 className="example-title">Selector Example</h3>
      <p className="page-description">
        Use a selector to subscribe to specific parts of the state. This
        component only re-renders when <code>count</code> changes, not{' '}
        <code>lastUpdated</code>.
      </p>
      <div className="demo-section">
        <div className="counter-display">{count}</div>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
          This component won't re-render if only lastUpdated changes
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button className="button primary" onClick={() => store.increment()}>
            Increment
          </button>
          <button className="button primary" onClick={() => store.decrement()}>
            Decrement
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 3: Complex Store (Todo List)
 */
function TodoStoreExample() {
  const store = useFactory(TodoStore);
  const state = useStore(store);
  const [inputValue, setInputValue] = useState('');

  const handleAddTodo = () => {
    if (inputValue.trim()) {
      store.addTodo(inputValue);
      setInputValue('');
    }
  };

  const filteredTodos = state.todos.filter((todo) => {
    if (state.filter === 'active') return !todo.completed;
    if (state.filter === 'completed') return todo.completed;
    return true;
  });

  const stats = {
    total: state.todos.length,
    active: state.todos.filter((t) => !t.completed).length,
    completed: state.todos.filter((t) => t.completed).length
  };

  return (
    <div className="example-card">
      <h3 className="example-title">Todo List with Store</h3>
      <p className="page-description">
        A complete todo list application using useStore for state management.
        Add, toggle, and delete todos with reactive updates.
      </p>
      <div className="demo-section">
        {/* Add Todo */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
              placeholder="What needs to be done?"
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px'
              }}
            />
            <button className="button primary" onClick={handleAddTodo}>
              Add
            </button>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '16px',
            padding: '12px',
            background: '#fafafa',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <span>Total: {stats.total}</span>
          <span>Active: {stats.active}</span>
          <span>Completed: {stats.completed}</span>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <button
            className={`button ${state.filter === 'all' ? 'primary' : ''}`}
            onClick={() => store.setFilter('all')}
          >
            All
          </button>
          <button
            className={`button ${state.filter === 'active' ? 'primary' : ''}`}
            onClick={() => store.setFilter('active')}
          >
            Active
          </button>
          <button
            className={`button ${state.filter === 'completed' ? 'primary' : ''}`}
            onClick={() => store.setFilter('completed')}
          >
            Completed
          </button>
        </div>

        {/* Todo List */}
        <div>
          {filteredTodos.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '24px' }}>
              No todos to display
            </p>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  marginBottom: '8px',
                  background: '#fff',
                  border: '1px solid #e8e8e8',
                  borderRadius: '4px'
                }}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => store.toggleTodo(todo.id)}
                  style={{ marginRight: '12px' }}
                />
                <span
                  style={{
                    flex: 1,
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? '#999' : '#333'
                  }}
                >
                  {todo.text}
                </span>
                <button
                  className="button"
                  onClick={() => store.deleteTodo(todo.id)}
                  style={{ padding: '4px 12px' }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Store Example Component
 */
export function StoreExample() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">useStore Hook</h1>
        <p className="page-description">
          The useStore hook provides reactive state management by subscribing to
          store changes. Components automatically re-render when subscribed
          state updates, making it perfect for building reactive UIs.
        </p>
      </div>

      <BasicStoreExample />
      <SelectorExample />
      <TodoStoreExample />

      <div className="example-card">
        <h3 className="example-title">Key Features</h3>
        <ul className="feature-list">
          <li>
            🔄 <strong>Reactive Updates</strong>: Automatic re-renders on state
            changes
          </li>
          <li>
            🎯 <strong>Selective Subscription</strong>: Use selectors to
            optimize performance
          </li>
          <li>
            📦 <strong>Type Safe</strong>: Full TypeScript support with
            inference
          </li>
          <li>
            🏪 <strong>Store Interface</strong>: Compatible with
            @qlover/corekit-bridge
          </li>
          <li>
            ⚡ <strong>Performance</strong>: Only re-renders when selected state
            changes
          </li>
        </ul>
      </div>
    </div>
  );
}
