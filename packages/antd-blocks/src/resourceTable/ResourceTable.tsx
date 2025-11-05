import { useSliceStore } from '@qlover/slice-store-react';
import { Table } from 'antd';
import { useMemo } from 'react';
import { resourceSelectors } from './config';
import { ResourceTableAction } from './ResourceTableAction';
import type { ResourceTableActionI18n } from './config';
import type { ResourceTableEventInterface } from './ResourceTableEventInterface';
import type { ResourceTableOption } from './ResourceTableOption';
import type { TableColumnProps, TableProps } from 'antd';

/**
 * Props for ResourceTable component
 *
 * Extends Ant Design Table props with resource-specific functionality
 *
 * @template T - Type of data records in the table
 */
export interface ResourceTableProps<T> extends TableProps<T> {
  /**
   * Column definitions for the table
   *
   * Defines how each field should be displayed, including:
   * - Field name and data index
   * - Column title and rendering
   * - Sorting and filtering configuration
   * - Custom cell rendering
   *
   * @example
   * ```typescript
   * const columns: ResourceTableOption<User>[] = [
   *   {
   *     title: 'Name',
   *     dataIndex: 'name',
   *     sorter: true
   *   },
   *   {
   *     title: 'Email',
   *     dataIndex: 'email',
   *     render: (email) => <a href={`mailto:${email}`}>{email}</a>
   *   }
   * ];
   * ```
   */
  columns: ResourceTableOption<T>[];

  /**
   * Resource table event handler instance
   *
   * Manages all CRUD operations and state updates for the table.
   * Must implement `ResourceTableEventInterface` for handling:
   * - Create, edit, delete, detail operations
   * - Pagination and search parameter changes
   * - Form submission and validation
   * - Lifecycle management
   *
   * @example
   * ```typescript
   * const tableEvent = new ResourceEvent('users', userService, undefined, formRef);
   * ```
   */
  tableEvent: ResourceTableEventInterface;

  /**
   * Configuration for action column
   *
   * Controls the appearance and behavior of the action column:
   * - Set to `false` to hide action column entirely
   * - Provide object to customize action column properties and i18n texts
   *
   * Default action column includes:
   * - Edit button
   * - Delete button (with confirmation)
   * - Detail/View button
   *
   * @optional
   * @default Action column with default configuration
   *
   * @example Hide action column
   * ```typescript
   * <ResourceTable
   *   actionProps={false}
   *   columns={columns}
   *   tableEvent={tableEvent}
   * />
   * ```
   *
   * @example Customize action column
   * ```typescript
   * <ResourceTable
   *   actionProps={{
   *     width: 200,
   *     fixed: 'right',
   *     editText: 'Modify',
   *     deleteText: 'Remove',
   *     detailText: 'View'
   *   }}
   *   columns={columns}
   *   tableEvent={tableEvent}
   * />
   * ```
   */
  actionProps?: false | (TableColumnProps<T> & ResourceTableActionI18n);
}

/**
 * Resource Table Component
 *
 * Core concept:
 * A fully-featured data table component built on Ant Design Table,
 * providing automatic CRUD operation handling, pagination, and state
 * management for resource-based data.
 *
 * Main features:
 * - Automatic data fetching: Integrates with resource service for automatic data loading
 *   - Displays loading state during data fetch
 *   - Shows paginated data with total count
 *   - Handles empty states and error states
 *
 * - Built-in actions: Provides default action column with edit/delete/detail buttons
 *   - Edit: Opens edit form with pre-filled data
 *   - Delete: Shows confirmation and removes resource
 *   - Detail: Opens read-only detail view
 *   - Customizable or can be disabled
 *
 * - Pagination support: Full pagination with configurable page size
 *   - Page size options: 10, 20, 50 (customizable)
 *   - Automatic total count display
 *   - Synchronizes with resource service search parameters
 *
 * - Responsive design: Horizontal scrolling for mobile devices
 *   - Auto-adjusts column widths
 *   - Maintains action column visibility
 *
 * Main purpose:
 * Eliminates boilerplate code for resource list displays by providing
 * a complete table solution with all common features built-in.
 *
 * @template T - Type of data records in the table
 *
 * @example Basic usage
 * ```typescript
 * function UserList() {
 *   const userService = new UserService();
 *   const [form] = Form.useForm();
 *   const tableEvent = new ResourceEvent('users', userService, undefined, form);
 *
 *   useEffect(() => {
 *     tableEvent.created();
 *     return () => tableEvent.destroyed();
 *   }, []);
 *
 *   const columns = [
 *     { title: 'Name', dataIndex: 'name' },
 *     { title: 'Email', dataIndex: 'email' },
 *     { title: 'Role', dataIndex: 'role' }
 *   ];
 *
 *   return <ResourceTable columns={columns} tableEvent={tableEvent} />;
 * }
 * ```
 *
 * @example With custom action column
 * ```typescript
 * <ResourceTable
 *   columns={columns}
 *   tableEvent={tableEvent}
 *   actionProps={{
 *     width: 200,
 *     fixed: 'right',
 *     editText: 'Edit User',
 *     deleteText: 'Delete User',
 *     detailText: 'View Details'
 *   }}
 * />
 * ```
 *
 * @example Without action column
 * ```typescript
 * <ResourceTable
 *   columns={columns}
 *   tableEvent={tableEvent}
 *   actionProps={false}
 * />
 * ```
 *
 * @example With custom table props
 * ```typescript
 * <ResourceTable
 *   columns={columns}
 *   tableEvent={tableEvent}
 *   size="small"
 *   bordered
 *   pagination={{
 *     pageSizeOptions: [5, 10, 20],
 *     showSizeChanger: true,
 *     showTotal: (total) => `Total ${total} items`
 *   }}
 * />
 * ```
 */
export function ResourceTable<T>(props: ResourceTableProps<T>) {
  const { tableEvent, columns, actionProps, ...tableProps } = props;
  const resource = tableEvent.getResource();
  const resourceStore = resource.getStore();
  const searchParams = useSliceStore(
    resourceStore,
    resourceSelectors.searchParams
  );
  const listState = useSliceStore(resourceStore, resourceSelectors.listState);
  const dataSource = listState.result?.list as T[];
  const innerColumns = useMemo(() => {
    if (actionProps === false) {
      return columns;
    }

    return [
      ...columns,
      {
        title: 'Action',
        dataIndex: 'action',
        fixed: 'right',
        width: 160,
        render: (_, record: T) => (
          <ResourceTableAction
            data-testid="innerColumns"
            tableEvent={tableEvent}
            record={record}
            settings={actionProps}
          />
        ),
        ...actionProps
      }
    ] as TableProps<T>['columns'];
  }, [actionProps, columns, tableEvent]);

  return (
    <Table
      data-testid="ResourcesTable"
      rowKey="id"
      dataSource={dataSource}
      loading={listState.loading}
      scroll={{ x: true }}
      {...tableProps}
      columns={innerColumns}
      pagination={{
        pageSizeOptions: [10, 20, 50],
        current: searchParams.page,
        pageSize: searchParams.pageSize,
        total: listState.result?.total,
        onChange: (page, pageSize) => {
          tableEvent?.onChangeParams({ resource, page, pageSize });
        },
        ...tableProps.pagination
      }}
    />
  );
}
