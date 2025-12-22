import { useSliceStore } from '@qlover/slice-store-react';
import { Form, type FormProps } from 'antd';
import { useCallback, useMemo } from 'react';
import { eventSelectos } from './config';
import { useResourceTableContext } from './ResourceTableContext';
import {
  ResourceTableEventAction,
  type ResourceTableEventInterface
} from './ResourceTableEventInterface';
import { ResourceTableSchemaFormFooter } from './ResourceTableSchemaFormFooter';
import type { ResourceTableLocales } from './config';
import type {
  ResourceTableFormType,
  ResourceTableOption
} from './ResourceTableOption';
import type { FormInstance } from 'antd/lib';
import { NamePath } from 'antd/es/form/interface';

const { Item: FormItem } = Form;

export interface ResourceTableSchemaFormProps<T>
  extends Omit<FormProps, 'children'> {
  formComponents?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key in ResourceTableFormType]?: React.ComponentType<any>;
  };
  formRef: FormInstance<unknown>;
  options: ResourceTableOption<T>[];
  children?: Exclude<React.ReactNode, bigint>;
  tableEvent: ResourceTableEventInterface;
  tt: ResourceTableLocales;
}

export function ResourceTableSchemaForm<T>(
  props: ResourceTableSchemaFormProps<T>
) {
  const {
    options,
    children,
    tt,
    formRef,
    tableEvent,
    formComponents,
    ...rest
  } = props;
  const action = useSliceStore(tableEvent.store, eventSelectos.action);

  const disabled = action === ResourceTableEventAction.DETAIL;

  const context = useResourceTableContext();

  const schemaFormMap = useMemo(
    () => ({
      ...context.formComponents,
      ...formComponents
    }),
    [context.formComponents, formComponents]
  );

  const renderItem = useCallback(
    (option: ResourceTableOption<T>, index: number) => {
      const { renderForm, formItemWrapProps, formItemProps, ...rest } = option;
      const unionKey = String(rest.key) + index;

      if (!renderForm) return null;

      if (typeof renderForm === 'function') {
        return <div data-testid="renderItem" key={unionKey}>{renderForm(rest, index)}</div>;
      }

      const Component = schemaFormMap[renderForm];

      if (!Component) {
        console.warn(`SchemaFormMap[${renderForm}] is not found`);
        return null;
      }

      return (
        <FormItem
          data-testid={'AdminTableForm' + unionKey}
          key={unionKey}
          name={option.dataIndex as NamePath}
          {...formItemWrapProps}
          label={formItemWrapProps?.label}
        >
          <Component
            disabled={disabled}
            {...(formItemProps as Record<string, unknown>)}
          />
        </FormItem>
      );
    },
    [disabled, schemaFormMap]
  );

  return (
    <Form
      form={formRef}
      data-testid="AdminTableSchemaForm"
      layout="vertical"
      onFinish={tableEvent.onSubmit.bind(tableEvent)}
      {...rest}
    >
      {options.map(renderItem)}

      {children ? (
        (children as React.ReactElement | null | undefined)
      ) : (
        <ResourceTableSchemaFormFooter tt={tt} tableEvent={tableEvent} />
      )}
    </Form>
  );
}
