/**
 * ResourceTable with Custom Actions Example
 *
 * Demonstrates customization of action column
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
 * CustomActionExample Component
 *
 * Shows customization of:
 * - Action column text (i18n)
 * - Action column width
 * - Action column position
 */
export function CustomActionExample() {
  const [form] = Form.useForm();

  const userService = useMemo(() => new UserService(), []);
  const tableEvent = useMemo(
    () =>
      new ResourceEvent('users-custom-action', userService, undefined, form),
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
    <Card data-testid="CustomActionExample" title="Custom Action Example - Customized Action Column">
      <ResourceTable
        columns={columns}
        tableEvent={tableEvent}
        actionProps={{
          width: 220,
          fixed: 'right',
          editText: '修改',
          deleteText: '移除',
          detailText: '查看详情'
        }}
      />
    </Card>
  );
}
