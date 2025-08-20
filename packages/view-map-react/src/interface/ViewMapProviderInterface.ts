export type Element<T> = React.ComponentType<T>;

export interface MapValue<T> {
  /**
   * this is component
   */
  Component: Element<T>;
  /**
   * this is default props for component
   */
  props?: T;
}

export interface ViewMapProviderInterface<K, T> {
  setElements(maps: unknown): void;
  addElement(key: K, element: MapValue<T> | Element<T>): void;
  addElements(elements: unknown): void;
  removeElement(key: K): void;
  getElement(key: K): MapValue<T> | undefined;
}
