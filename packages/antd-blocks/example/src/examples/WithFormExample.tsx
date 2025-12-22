/**
 * ResourceTable with Form Example
 *
 * Demonstrates full CRUD functionality with form popup
 */
import { useEffect, useMemo } from 'react';
import { Form, Card } from 'antd';
import {
  ResourceTableProvider,
  ResourceTableHeader,
  ResourceTable,
  ResourceTablePopup,
  ResourceTableSchemaForm,
  ResourceEvent
} from '@brain-toolkit/antd-blocks/resourceTable';
import { UserService } from '../services/UserService';
import { createColumn } from '../utils/columnHelper';
import { getDefaultFormComponents } from '../utils/formComponents';
import type { User } from '../services/types';
import type {
  ResourceTableLocales,
  ResourceTableHeaderI18n
} from '@brain-toolkit/antd-blocks/resourceTable';

/**
 * WithFormExample Component
 *
 * Shows complete CRUD with:
 * - Header with create and refresh buttons
 * - Form popup for create/edit operations
 * - Schema-based form rendering
 * - Full CRUD operations
 */
export function WithFormExample() {
  const [form] = Form.useForm();

  const userService = useMemo(() => new UserService(), []);
  const tableEvent = useMemo(
    () => new ResourceEvent('users-with-form', userService, undefined, form),
    [userService, form]
  );

  useEffect(() => {
    tableEvent.created();
    tableEvent.onRefresh({});
    return () => tableEvent.destroyed();
  }, [tableEvent]);

  // Get form component mapping for auto-rendering
  const formComponents = getDefaultFormComponents();

  // Define header settings
  const headerSettings: { [key in keyof ResourceTableHeaderI18n]: string } = {
    create: 'Create User',
    refresh: 'Refresh',
    search: 'Search',
    reset: 'Reset',
    export: 'Export',
    settings: 'Settings'
  };

  // Define form locales
  const formLocales: ResourceTableLocales = {
    title: 'User Management',
    description: 'Manage users in the system',
    content: '',
    keywords: '',
    createTitle: 'Create New User',
    editTitle: 'Edit User',
    detailTitle: 'User Details',
    deleteTitle: 'Delete User',
    deleteContent: 'Are you sure you want to delete this user?',
    saveButton: 'Save',
    detailButton: 'Details',
    cancelButton: 'Cancel',
    createButton: 'Create',
    importTitle: 'Import',
    importZhTitle: 'Import (Chinese)',
    importEnTitle: 'Import (English)'
  };

  // Define table columns with form rendering
  const columns = [
    createColumn<User>({
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
      // ID field is not editable, no renderForm
    }),
    createColumn<User>({
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      renderForm: 'input',
      formItemWrapProps: {
        rules: [{ required: true, message: 'Please enter name' }]
      },
      formItemProps: {
        placeholder: 'Enter user name'
      }
    }),
    createColumn<User>({
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      renderForm: 'input',
      formItemWrapProps: {
        rules: [
          { required: true, message: 'Please enter email' },
          { type: 'email', message: 'Please enter valid email' }
        ]
      },
      formItemProps: {
        placeholder: 'Enter email address'
      }
    }),
    createColumn<User>({
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      renderForm: 'select',
      formItemWrapProps: {
        rules: [{ required: true, message: 'Please select role' }]
      },
      formItemProps: {
        placeholder: 'Select user role',
        options: [
          { label: 'Admin', value: 'admin' },
          { label: 'User', value: 'user' },
          { label: 'Guest', value: 'guest' }
        ]
      },
      render: (role: string) => {
        const colors = {
          admin: 'red',
          user: 'blue',
          guest: 'gray'
        };
        return (
          <span data-testid="columns" style={{ color: colors[role as keyof typeof colors] }}>
            {role.toUpperCase()}
          </span>
        );
      }
    }),
    createColumn<User>({
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      renderForm: 'input',
      formItemWrapProps: {
        rules: [{ type: 'number', min: 1, max: 120 }]
      },
      formItemProps: {
        type: 'number',
        placeholder: 'Enter age',
        min: 1,
        max: 120
      }
    }),
    createColumn<User>({
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      renderForm: 'input',
      formItemProps: {
        placeholder: 'Enter phone number'
      }
    })
  ];

  return (
    <Card data-testid="WithFormExample" title="With Form Example - Full CRUD with Form Popup">
      <ResourceTableProvider formComponents={formComponents}>
        {/* Header with create and refresh buttons */}
        <ResourceTableHeader
          tableEvent={tableEvent}
          settings={headerSettings}
        />

        {/* Table */}
        <ResourceTable columns={columns} tableEvent={tableEvent} />

        {/* Form popup for create/edit - auto-rendered from columns */}
        <ResourceTablePopup tableEvent={tableEvent} title="User Information">
          <ResourceTableSchemaForm
            formRef={form}
            options={columns}
            tableEvent={tableEvent}
            tt={formLocales}
          />
        </ResourceTablePopup>
      </ResourceTableProvider>
    </Card>
  );
}
