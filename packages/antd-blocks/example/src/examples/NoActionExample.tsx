/**
 * ResourceTable without Actions Example
 *
 * Demonstrates read-only table without action column
 */
import { useEffect, useMemo } from 'react';
import { Form, Card, Tag } from 'antd';
import {
  ResourceTable,
  ResourceEvent
} from '@brain-toolkit/antd-blocks/resourceTable';
import { UserService } from '../services/UserService';
import { createColumn } from '../utils/columnHelper';
import type { User } from '../services/types';

/**
 * NoActionExample Component
 *
 * Shows read-only table:
 * - No action column
 * - Custom cell rendering
 * - Smaller table size
 */
export function NoActionExample() {
  const [form] = Form.useForm();

  const userService = useMemo(() => new UserService(), []);
  const tableEvent = useMemo(
    () => new ResourceEvent('users-readonly', userService, undefined, form),
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
      key: 'email',
      render: (email: string) => <a data-testid="columns" href={`mailto:${email}`}>{email}</a>
    }),
    createColumn<User>({
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colorMap = {
          admin: 'red',
          user: 'blue',
          guest: 'default'
        };
        return (
          <Tag data-testid="columns" color={colorMap[role as keyof typeof colorMap]}>
            {role.toUpperCase()}
          </Tag>
        );
      }
    }),
    createColumn<User>({
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      width: 80
    })
  ];

  return (
    <Card data-testid="NoActionExample" title="No Action Example - Read-Only Table">
      <ResourceTable
        columns={columns}
        tableEvent={tableEvent}
        actionProps={false}
        size="small"
      />
    </Card>
  );
}
