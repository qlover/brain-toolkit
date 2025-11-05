/**
 * Basic ResourceTable Example
 *
 * Demonstrates the simplest use case of ResourceTable with minimal configuration
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
 * BasicExample Component
 *
 * Shows basic ResourceTable usage with:
 * - Default pagination
 * - Default action column
 * - Simple column definitions
 */
export function BasicExample() {
  const [form] = Form.useForm();

  // Use useMemo to ensure instances are created only once
  const userService = useMemo(() => new UserService(), []);
  const tableEvent = useMemo(
    () => new ResourceEvent('users', userService, undefined, form),
    [userService, form]
  );

  // Lifecycle management
  useEffect(() => {
    tableEvent.created();
    tableEvent.onRefresh({});
    return () => tableEvent.destroyed();
  }, [tableEvent]);

  // Define table columns
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
    <Card title="Basic Example - Simple User Table">
      <ResourceTable columns={columns} tableEvent={tableEvent} />
    </Card>
  );
}
