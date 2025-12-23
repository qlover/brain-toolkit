/**
 * ResourceTable with Custom Pagination Example
 *
 * Demonstrates pagination customization
 */
import { useEffect, useMemo } from 'react';
import { Form, Card } from 'antd';
import {
  ResourceTable,
  ResourceEvent
} from '@brain-toolkit/antd-blocks/resourceTable';
import { UserService } from '../services/UserService';
import { createColumn } from '../utils/columnHelper';
import type { User } from '../services/types';

/**
 * CustomPaginationExample Component
 *
 * Shows pagination customization:
 * - Custom page size options
 * - Show total count
 * - Show size changer
 * - Show quick jumper
 */
export function CustomPaginationExample() {
  const [form] = Form.useForm();

  const userService = useMemo(() => new UserService(), []);
  const tableEvent = useMemo(
    () => new ResourceEvent('users-pagination', userService, undefined, form),
    [userService, form]
  );

  useEffect(() => {
    tableEvent.created();
    tableEvent.onRefresh({});
    return () => tableEvent.destroyed();
  }, [tableEvent]);

  const columns = [
    createColumn<User>({
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    }),
    createColumn<User>({
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    }),
    createColumn<User>({
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    }),
    createColumn<User>({
      title: 'Role',
      dataIndex: 'role',
      key: 'role'
    })
  ];

  return (
    <Card data-testid="CustomPaginationExample" title="Custom Pagination Example - Enhanced Pagination">
      <ResourceTable
        columns={columns}
        tableEvent={tableEvent}
        pagination={{
          pageSizeOptions: [5, 10, 15, 20],
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
        }}
      />
    </Card>
  );
}
