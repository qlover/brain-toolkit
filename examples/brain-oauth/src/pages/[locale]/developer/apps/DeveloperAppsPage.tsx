'use client';

import { EditOutlined, DeleteOutlined, KeyOutlined, PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { developerAppsI18n } from '@config/i18n-mapping/developerAppsI18n';
import type { OAuthClientListItem, OAuthClientCreate, OAuthClientUpdate } from '@schemas/oauth/OAuthAuthorizeSchema';
import { message, Modal, Form, Input, Button } from 'antd';
const { TextArea } = Input;

interface DeveloperAppsPageProps {
  initialApps: OAuthClientListItem[];
}

export function DeveloperAppsPageComponent({ initialApps }: DeveloperAppsPageProps) {
  const tt = useI18nMapping(developerAppsI18n);
  const [apps, setApps] = useState<OAuthClientListItem[]>(initialApps);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingApp, setEditingApp] = useState<OAuthClientListItem | null>(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  const handleCreateApp = async (values: any) => {
    try {
      const redirectUris = values.redirect_uris
        .split('\n')
        .map((uri: string) => uri.trim())
        .filter((uri: string) => uri.length > 0);

      if (redirectUris.length === 0) {
        message.error(tt.toastError || 'Please enter at least one redirect URI');
        return;
      }

      const payload: OAuthClientCreate = {
        client_name: values.client_name,
        client_uri: values.client_uri || undefined,
        redirect_uris: redirectUris
      };

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to create application');
      }

      const data = await response.json();
      
      // Add to local state
      const newApp: OAuthClientListItem = {
        client_id: data.client_id,
        client_name: data.client_name,
        client_uri: data.client_uri,
        redirect_uris: data.redirect_uris,
        created_at: data.created_at,
        updated_at: data.created_at
      };
      
      setApps([...apps, newApp]);
      setCreateModalVisible(false);
      createForm.resetFields();
      
      message.success(
        `${tt.toastCreateSuccess || 'Application created successfully!'}\nClient ID: ${data.client_id}\nClient Secret: ${data.client_secret}`,
        8
      );
    } catch (error) {
      console.error('Create app error:', error);
      message.error(tt.toastError || 'Operation failed, please try again later');
    }
  };

  const handleEditApp = async (values: any) => {
    if (!editingApp) return;

    try {
      const redirectUris = values.redirect_uris
        .split('\n')
        .map((uri: string) => uri.trim())
        .filter((uri: string) => uri.length > 0);

      if (redirectUris.length === 0) {
        message.error(tt.toastError || 'Please enter at least one redirect URI');
        return;
      }

      const payload: OAuthClientUpdate = {
        client_name: values.client_name,
        client_uri: values.client_uri || undefined,
        redirect_uris: redirectUris
      };

      const response = await fetch(`/api/clients/${editingApp.client_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to update application');
      }

      const updatedApp = await response.json();
      
      // Update local state
      setApps(apps.map(app => 
        app.client_id === editingApp.client_id ? {
          ...app,
          client_name: updatedApp.client_name,
          client_uri: updatedApp.client_uri,
          redirect_uris: updatedApp.redirect_uris,
          updated_at: updatedApp.updated_at
        } : app
      ));
      
      setEditModalVisible(false);
      setEditingApp(null);
      form.resetFields();
      
      message.success(tt.toastUpdateSuccess || 'Application updated successfully');
    } catch (error) {
      console.error('Update app error:', error);
      message.error(tt.toastError || 'Operation failed, please try again later');
    }
  };

  const handleRotateSecret = async (clientId: string) => {
    Modal.confirm({
      title: tt.rotateSecretConfirmTitle || 'Rotate Secret',
      content: tt.rotateSecretConfirmContent || 'Rotating the secret will immediately invalidate the old one. Continue?',
      okText: tt.rotateSecretButton || 'Rotate Secret',
      cancelText: tt.cancelButton || 'Cancel',
      okType: 'warning',
      onOk: async () => {
        try {
          const response = await fetch(`/api/clients/${clientId}/rotate-secret`, {
            method: 'POST'
          });

          if (!response.ok) {
            throw new Error('Failed to rotate secret');
          }

          const data = await response.json();
          message.success(
            `${tt.toastRotateSuccess || 'New secret generated'}:\n${data.client_secret}`,
            8
          );
        } catch (error) {
          console.error('Rotate secret error:', error);
          message.error(tt.toastError || 'Operation failed, please try again later');
        }
      }
    });
  };

  const handleDeleteApp = async (clientId: string) => {
    Modal.confirm({
      title: tt.deleteConfirmTitle || 'Delete Application',
      content: tt.deleteConfirmContent || 'Permanently delete this application? This action cannot be undone.',
      okText: tt.deleteButton || 'Delete',
      okType: 'danger',
      cancelText: tt.cancelButton || 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`/api/clients/${clientId}`, {
            method: 'DELETE'
          });

          if (!response.ok && response.status !== 204) {
            throw new Error('Failed to delete application');
          }

          setApps(apps.filter(app => app.client_id !== clientId));
          message.success(tt.toastDeleteSuccess || 'Application deleted');
        } catch (error) {
          console.error('Delete app error:', error);
          message.error(tt.toastError || 'Operation failed, please try again later');
        }
      }
    });
  };

  const openEditModal = (app: OAuthClientListItem) => {
    setEditingApp(app);
    form.setFieldsValue({
      client_name: app.client_name,
      client_uri: app.client_uri || '',
      redirect_uris: app.redirect_uris.join('\n')
    });
    setEditModalVisible(true);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary-text">{tt.title || 'My OAuth Applications'}</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
            className="inline-flex items-center gap-2"
          >
            {tt.createButton || 'Create New App'}
          </Button>
        </div>

        {/* Apps List */}
        <div className="space-y-4">
          {apps.length === 0 ? (
            <div className="text-center py-12 text-secondary-text">
              {tt.emptyState || 'No applications yet. Click "Create New App" to get started.'}
            </div>
          ) : (
            apps.map((app) => (
              <div
                key={app.client_id}
                className="bg-elevated rounded-xl shadow-sm border border-c-border p-5"
              >
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-primary-text">
                        {app.client_name}
                      </h3>
                      <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                        {tt.statusEnabled || 'Enabled'}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-text mt-1">
                      {tt.clientIdLabel || 'Client ID'}:{' '}
                      <code className="bg-secondary px-1 rounded">
                        {app.client_id}
                      </code>
                    </p>
                    <p className="text-sm text-secondary-text mt-1">
                      {tt.redirectUrisLabel || 'Redirect URIs'}:{' '}
                      <code className="bg-secondary px-1 rounded">
                        {app.redirect_uris.join(', ')}
                      </code>
                    </p>
                    <p className="text-xs text-muted-text mt-2">
                      {tt.createdAtLabel || 'Created at'}{' '}
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => openEditModal(app)}
                      className="text-brand hover:text-brand-hover"
                    >
                      {tt.editButton || 'Edit'}
                    </Button>
                    <Button
                      type="link"
                      icon={<KeyOutlined />}
                      onClick={() => handleRotateSecret(app.client_id)}
                      className="text-warning hover:text-warning-hover"
                    >
                      {tt.rotateSecretButton || 'Rotate Secret'}
                    </Button>
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteApp(app.client_id)}
                    >
                      {tt.deleteButton || 'Delete'}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        title={tt.createModalTitle || 'Create OAuth Application'}
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateApp}
          labelCol={{ style: { color: 'var(--text-secondary)' } }}
        >
          <Form.Item
            name="client_name"
            label={tt.appNameLabel || 'Application Name'}
            rules={[{ required: true, message: tt.appNameRequired || 'Please enter application name' }]}
          >
            <Input placeholder="My Application" />
          </Form.Item>

          <Form.Item
            name="redirect_uris"
            label={tt.redirectUrisLabel || 'Redirect URIs (one per line)'}
            rules={[{ required: true, message: 'Please enter at least one redirect URI' }]}
          >
            <TextArea
              rows={3}
              placeholder={tt.redirectUrisPlaceholder || 'https://your-app.com/callback\nhttps://localhost:3000/callback'}
            />
          </Form.Item>
          <p className="text-xs text-muted-text mt-1 -mt-2 mb-4">
            {tt.redirectUrisHint || 'Multiple callback URLs supported, one per line. Must use HTTPS (http://localhost allowed for local development).'}
          </p>

          <Form.Item
            name="client_uri"
            label={tt.clientUriLabel || 'Application Homepage URL (Optional)'}
          >
            <Input type="url" placeholder="https://your-app.com" />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={() => {
              setCreateModalVisible(false);
              createForm.resetFields();
            }}>
              {tt.cancelButton || 'Cancel'}
            </Button>
            <Button type="primary" htmlType="submit">
              {tt.createSubmitButton || 'Create Application'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={tt.editModalTitle || 'Edit Application'}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingApp(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditApp}
          labelCol={{ style: { color: 'var(--text-secondary)' } }}
        >
          <Form.Item
            name="client_name"
            label={tt.appNameLabel || 'Application Name'}
            rules={[{ required: true, message: tt.appNameRequired || 'Please enter application name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="redirect_uris"
            label={tt.redirectUrisLabel || 'Redirect URIs (one per line)'}
            rules={[{ required: true, message: 'Please enter at least one redirect URI' }]}
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="client_uri"
            label={tt.clientUriLabel || 'Application Homepage URL (Optional)'}
          >
            <Input type="url" />
          </Form.Item>

          <div className="flex flex-wrap gap-3 justify-between items-center mt-6">
            <div className="flex gap-2">
              {editingApp && (
                <>
                  <Button
                    type="default"
                    icon={<KeyOutlined />}
                    onClick={() => handleRotateSecret(editingApp.client_id)}
                    className="text-warning hover:text-warning-hover"
                  >
                    {tt.rotateSecretButton || 'Rotate Secret'}
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      setEditModalVisible(false);
                      setEditingApp(null);
                      if (editingApp) {
                        handleDeleteApp(editingApp.client_id);
                      }
                    }}
                  >
                    {tt.deleteButton || 'Delete'}
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => {
                setEditModalVisible(false);
                setEditingApp(null);
                form.resetFields();
              }}>
                {tt.cancelButton || 'Cancel'}
              </Button>
              <Button type="primary" htmlType="submit">
                {tt.saveSubmitButton || 'Save Changes'}
              </Button>
            </div>
          </div>
        </Form>
      </Modal>
    </>
  );
}
