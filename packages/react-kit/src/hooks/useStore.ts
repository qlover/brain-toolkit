import { useSliceStore, type SliceStore } from '@qlover/slice-store-react';
import type {
  StoreInterface,
  StoreStateInterface
} from '@qlover/corekit-bridge';

/**
 * Hook to subscribe to store state changes with optional selector
 *
 * Significance: Bridges @qlover/corekit-bridge stores with React components
 * Core idea: Provides reactive state management with fine-grained subscription control
 * Main function: Subscribes to store state and triggers re-renders on changes
 * Main purpose: Enable efficient and type-safe store integration in React components
 *
 * Key features:
 * - Automatic re-rendering when subscribed state changes
 * - Optional selector for subscribing to partial state (performance optimization)
 * - Full TypeScript support with type inference
 * - Compatible with StoreInterface from @qlover/corekit-bridge
 * - Prevents unnecessary re-renders when unselected state changes
 *
 * Use cases:
 * - Accessing store state in functional components
 * - Subscribing to specific parts of state for performance
 * - Building reactive UIs that respond to store changes
 * - Integrating with existing store architecture
 *
 * @template C - Store type extending StoreInterface
 * @template State - The type of state being selected (defaults to full store state)
 *
 * @param store - The store instance to subscribe to
 * @param selector - Optional function to select specific part of state
 * @returns The selected state (or full state if no selector provided)
 *
 * @example Basic usage - subscribing to entire store state
 * interface CounterState {
 *   count: number;
 *   loading: boolean;
 * }
 *
 * class CounterStore implements StoreInterface<CounterState> {
 *   state: CounterState = { count: 0, loading: false };
 *   increment() { this.state.count++; }
 * }
 *
 * function Counter() {
 *   const counterStore = useFactory(CounterStore);
 *   const state = useStore(counterStore);
 *
 *   return (
 *     <div>
 *       <p>Count: {state.count}</p>
 *       <button onClick={() => counterStore.increment()}>+1</button>
 *     </div>
 *   );
 * }
 *
 * @example Using selector for performance optimization
 * interface UserState {
 *   profile: { name: string; email: string };
 *   settings: { theme: string; language: string };
 *   notifications: Array<{ id: string; message: string }>;
 * }
 *
 * function UserProfile() {
 *   const userStore = useFactory(UserStore);
 *
 *   // Only re-render when profile changes, not settings or notifications
 *   const profile = useStore(userStore, (state) => state.profile);
 *
 *   return <div>{profile.name} ({profile.email})</div>;
 * }
 *
 * @example Multiple selectors in same component
 * function Dashboard() {
 *   const appStore = useFactory(AppStore);
 *
 *   // Each selector subscribes independently
 *   const user = useStore(appStore, (state) => state.user);
 *   const todos = useStore(appStore, (state) => state.todos);
 *   const stats = useStore(appStore, (state) => state.statistics);
 *
 *   return (
 *     <div>
 *       <UserCard user={user} />
 *       <TodoList items={todos} />
 *       <Statistics data={stats} />
 *     </div>
 *   );
 * }
 *
 * @example Derived state with selector
 * interface TodoState {
 *   items: Array<{ id: string; text: string; completed: boolean }>;
 * }
 *
 * function TodoStats() {
 *   const todoStore = useFactory(TodoStore);
 *
 *   // Compute derived state in selector
 *   const stats = useStore(todoStore, (state) => ({
 *     total: state.items.length,
 *     completed: state.items.filter(item => item.completed).length,
 *     pending: state.items.filter(item => !item.completed).length
 *   }));
 *
 *   return (
 *     <div>
 *       <p>Total: {stats.total}</p>
 *       <p>Completed: {stats.completed}</p>
 *       <p>Pending: {stats.pending}</p>
 *     </div>
 *   );
 * }
 *
 * @example Complex state selection
 * interface AppState {
 *   data: {
 *     users: Record<string, User>;
 *     posts: Record<string, Post>;
 *   };
 *   ui: {
 *     selectedUserId: string | null;
 *   };
 * }
 *
 * function SelectedUserPosts() {
 *   const appStore = useFactory(AppStore);
 *
 *   // Select deeply nested and computed state
 *   const userPosts = useStore(appStore, (state) => {
 *     const userId = state.ui.selectedUserId;
 *     if (!userId) return [];
 *
 *     return Object.values(state.data.posts)
 *       .filter(post => post.authorId === userId);
 *   });
 *
 *   return (
 *     <div>
 *       {userPosts.map(post => (
 *         <PostCard key={post.id} post={post} />
 *       ))}
 *     </div>
 *   );
 * }
 *
 * @example Integration with useFactory
 * class AuthStore implements StoreInterface<AuthState> {
 *   state = { user: null, token: null };
 *   async login(credentials: Credentials) {
 *     // ... login logic
 *   }
 * }
 *
 * function AuthProvider({ children }: Props) {
 *   // Create stable store instance
 *   const authStore = useFactory(AuthStore);
 *
 *   // Subscribe to auth state
 *   const { user } = useStore(authStore);
 *
 *   if (!user) {
 *     return <LoginForm onLogin={authStore.login} />;
 *   }
 *
 *   return children;
 * }
 */
export function useStore<
  C extends StoreInterface<StoreStateInterface>,
  State = C['state']
>(store: C, selector?: (state: C['state']) => State): State {
  return useSliceStore(
    store as unknown as SliceStore<StoreStateInterface>,
    selector
  );
}
