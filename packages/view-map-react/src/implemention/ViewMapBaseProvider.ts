import { PropsHandler, toMaps, toMapValue } from './utils';
import {
  Element,
  MapValue,
  ViewMapProviderInterface
} from '../interface/ViewMapProviderInterface';

export type Keys = string | number | symbol | object;

export type MapInput<Key extends Keys, T> =
  | Map<Key, MapValue<T> | Element<T>>
  | Record<Exclude<Key, object>, MapValue<T> | Element<T>>;

export type ViewMapBaseProviderProps<Key extends Keys, T> = {
  maps?: MapInput<Key, T>;

  /**
   * this is case insensitive key
   *
   * but key only string, so it will be converted to lowercase
   *
   * @default `false`
   */
  caseInsensitiveKey?: boolean;

  /**
   * this is default props for component
   *
   * - if it is a function, it will be called with the key
   * - if it is an object, it will be assigned to the component props
   * - if MapInput is a Map, it will be assigned to the value.props
   * - if MapInput is a Record, it will be assigned to the value.props
   *
   */
  defaultProps?: PropsHandler<Key, T>;
};

export class ViewMapBaseProvider<Key extends Keys, T>
  implements ViewMapProviderInterface<Key, T>
{
  protected maps: Map<Key, MapValue<T>>;
  protected propsHandler?: PropsHandler<Key, T>;
  protected caseInsensitiveKey?: boolean;

  constructor(props?: ViewMapBaseProviderProps<Key, T>) {
    this.maps = props?.maps
      ? toMaps(props.maps, props.defaultProps)
      : new Map();

    this.propsHandler = props?.defaultProps;
    this.caseInsensitiveKey = props?.caseInsensitiveKey ?? false;
  }

  /**
   * set elements to the view map
   *
   * @override
   * @param maps - the elements to set
   */
  setElements(maps: MapInput<Key, T>): void {
    this.maps = toMaps(maps, this.propsHandler);
  }

  /**
   * add element to the view map
   *
   * @override
   * @param key - the key of the element
   * @param element - the element to add
   */
  addElement(key: Key, element: MapValue<T> | Element<T>): void {
    const value = toMapValue(key, element, this.propsHandler);
    this.maps.set(key, value);

    if (this.caseInsensitiveKey && typeof key === 'string') {
      this.maps.set(key.toLowerCase() as Key, value);
    }
  }

  /**
   * add elements to the view map
   *
   * @override
   * @param elements - the elements to add
   */
  addElements(elements: MapInput<Key, T>): void {
    const newMaps = toMaps(elements, this.propsHandler);

    newMaps.forEach((value, key) => {
      this.maps.set(key, value);
    });
  }

  /**
   * remove element from the view map
   *
   * @override
   * @param key - the key of the element to remove
   */
  removeElement(key: Key): void {
    this.maps.delete(key);

    if (this.caseInsensitiveKey && typeof key === 'string') {
      this.maps.delete(key.toLowerCase() as Key);
    }
  }

  /**
   * get element from the view map
   *
   * @override
   * @param key - the key of the element to get
   */
  getElement(key: Key): MapValue<T> | undefined {
    if (this.caseInsensitiveKey && typeof key === 'string') {
      return this.maps.get(key.toLowerCase() as Key);
    }

    return this.maps.get(key);
  }
}
