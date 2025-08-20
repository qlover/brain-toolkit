import { Element, MapValue } from '../interface/ViewMapProviderInterface';
import { Keys, MapInput } from './ViewMapBaseProvider';

export type PropsHandler<Key extends Keys, T> = T | ((key: Key) => T);

export function isMapValue<T>(
  value: MapValue<T> | Element<T>
): value is MapValue<T> {
  return typeof value === 'object' && 'component' in value;
}

export function toMapValue<Key extends Keys, T>(
  key: Key,
  element: MapValue<T> | Element<T>,
  propsHandler?: PropsHandler<Key, T>
): MapValue<T> {
  const defaultProps =
    propsHandler && typeof propsHandler === 'function'
      ? (propsHandler as (key: Key) => T)(key)
      : propsHandler;

  if (isMapValue(element)) {
    const elementProps = element.props;

    if (elementProps && defaultProps) {
      element.props = Object.assign(defaultProps, elementProps);
    }

    return element;
  }

  return {
    Component: element,
    props: defaultProps
  };
}

export function toMaps<Key extends Keys, T>(
  maps: MapInput<Key, T>,
  propsHandler?: PropsHandler<Key, T>
): Map<Key, MapValue<T>> {
  const result = new Map<Key, MapValue<T>>();

  if (maps instanceof Map) {
    // Handle Map input
    maps.forEach((value, key) => {
      result.set(key, toMapValue(key, value, propsHandler));
    });
  } else {
    // Handle Record/object input
    (Object.entries(maps) as [Key, MapValue<T> | Element<T>][]).forEach(
      ([key, value]) => {
        result.set(key, toMapValue(key, value, propsHandler));
      }
    );
  }

  return result;
}
