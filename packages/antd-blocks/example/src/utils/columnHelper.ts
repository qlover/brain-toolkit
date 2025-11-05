/**
 * Helper utilities for creating ResourceTable columns
 */
import type {
  ResourceTableOption,
  ResourceTableTT,
  ResourceTableFormType
} from '@brain-toolkit/antd-blocks/resourceTable';
import type { ColumnType } from 'antd/es/table';
import type { FormItemProps } from 'antd';
import type { Key } from 'react';

/**
 * Create translation table with default values
 *
 * @param title - Column title
 * @returns Translation table object
 */
export function createTT(title: string): ResourceTableTT {
  return {
    tableTitle: title,
    description: '',
    formItemLabel: title,
    formItemPlaceholder: `Enter ${title.toLowerCase()}`,
    formItemError: `${title} is required`,
    formItemRequired: `Please enter ${title.toLowerCase()}`
  };
}

/**
 * Column configuration with form rendering support
 */
export interface ColumnConfig<T> extends Omit<ColumnType<T>, 'key'> {
  key: Key;
  tt?: Partial<ResourceTableTT>;
  renderForm?: ResourceTableFormType;
  formItemWrapProps?: FormItemProps;
  formItemProps?: unknown;
}

/**
 * Create a ResourceTable column with required tt property and form rendering support
 *
 * @param column - Column configuration
 * @returns Complete ResourceTableOption
 *
 * @example
 * ```typescript
 * createColumn<User>({
 *   title: 'Name',
 *   dataIndex: 'name',
 *   key: 'name',
 *   renderForm: 'input',
 *   formItemWrapProps: {
 *     rules: [{ required: true, message: 'Please enter name' }]
 *   }
 * })
 * ```
 */
export function createColumn<T>(
  column: ColumnConfig<T>
): ResourceTableOption<T> {
  const title = typeof column.title === 'string' ? column.title : '';
  return {
    ...column,
    tt: {
      ...createTT(title),
      ...column.tt
    }
  } as ResourceTableOption<T>;
}
