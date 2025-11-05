/**
 * Form component mappings for ResourceTableSchemaForm
 */
import { Input, Select, InputNumber } from 'antd';
import type { ResourceTableFormType } from '@brain-toolkit/antd-blocks/resourceTable';

/**
 * Default form component mapping
 *
 * Maps renderForm types to actual Ant Design components
 *
 * @example
 * ```typescript
 * <ResourceTableProvider formComponents={getDefaultFormComponents()}>
 *   <ResourceTableSchemaForm ... />
 * </ResourceTableProvider>
 * ```
 */
export function getDefaultFormComponents(): Record<
  ResourceTableFormType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.ComponentType<any>
> {
  return {
    input: Input,
    textarea: Input.TextArea,
    select: Select
  };
}

/**
 * Extended form component mapping with additional components
 *
 * Includes InputNumber, DatePicker, etc.
 */
export function getExtendedFormComponents(): Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.ComponentType<any>
> {
  return {
    ...getDefaultFormComponents(),
    number: InputNumber
    // Add more as needed:
    // date: DatePicker,
    // dateRange: DatePicker.RangePicker,
    // checkbox: Checkbox,
    // radio: Radio.Group,
    // switch: Switch,
  };
}
