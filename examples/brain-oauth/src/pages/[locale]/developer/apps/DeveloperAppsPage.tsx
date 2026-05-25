'use client';

import {
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { developerAppsI18n } from '@config/i18n-mapping/developerAppsI18n';
import type {
  OAuthClientListItem,
  OAuthClientCreate,
  OAuthClientCreateResponse,
  OAuthClientDetail,
  OAuthClientSecretRotateResponse,
  OAuthClientUpdate
} from '@schemas/oauth/OAuthAuthorizeSchema';
import { readAppApiJson } from './readAppApiJson';
import { message, Modal, Button, Spin } from 'antd';
import { clsx } from 'clsx';
import {
  OAuthClientCredentialsModal,
  type OAuthCredentials
} from './OAuthClientCredentialsModal';
import {
  OAuthClientAppForm,
  emptyOAuthClientFormValues,
  type OAuthClientFormValues
} from './OAuthClientAppForm';

const modalCancelButtonClass =
  'inline-flex items-center justify-center px-4 py-2 rounded-lg border border-primary-border bg-primary text-primary-text font-medium hover:bg-elevated transition';
const modalSubmitButtonClass =
  'inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand text-on-brand font-medium hover:bg-brand-hover transition shadow-sm disabled:opacity-60';

function parseRedirectUris(raw: string): string[] {
  return raw
    .split('\n')
    .map((uri) => uri.trim())
    .filter((uri) => uri.length > 0);
}

interface DeveloperAppsPageProps {
  initialApps: OAuthClientListItem[];
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function DeveloperAppsPageComponent({
  initialApps
}: DeveloperAppsPageProps) {
  const tt = useI18nMapping(developerAppsI18n);
  const [apps, setApps] = useState<OAuthClientListItem[]>(initialApps);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingApp, setEditingApp] = useState<OAuthClientListItem | null>(null);
  const [credentials, setCredentials] = useState<OAuthCredentials | null>(null);
  const [credentialsModalVisible, setCredentialsModalVisible] = useState(false);
  const [createValues, setCreateValues] = useState<OAuthClientFormValues>(
    emptyOAuthClientFormValues
  );
  const [createFieldErrors, setCreateFieldErrors] = useState<
    Partial<Record<keyof OAuthClientFormValues, string>>
  >({});
  const [editValues, setEditValues] = useState<OAuthClientFormValues>(
    emptyOAuthClientFormValues
  );
  const [editFieldErrors, setEditFieldErrors] = useState<
    Partial<Record<keyof OAuthClientFormValues, string>>
  >({});

  const formLabels = useMemo(
    () => ({
      appNameLabel: tt.appNameLabel || 'Application Name',
      appNameRequired: tt.appNameRequired || 'Please enter application name',
      redirectUrisLabel: tt.redirectUrisLabel || 'Redirect URIs (one per line)',
      redirectUrisPlaceholder:
        tt.redirectUrisPlaceholder ||
        'https://your-app.com/callback\nhttps://localhost:3000/callback',
      redirectUrisHint:
        tt.redirectUrisHint ||
        'Multiple callback URLs supported, one per line. Must use HTTPS (http://localhost allowed for local development).',
      clientUriLabel:
        tt.clientUriLabel || 'Application Homepage URL (Optional)'
    }),
    [tt]
  );

  const resetCreateForm = () => {
    setCreateValues(emptyOAuthClientFormValues);
    setCreateFieldErrors({});
  };

  const resetEditForm = () => {
    setEditValues(emptyOAuthClientFormValues);
    setEditFieldErrors({});
  };

  const validateFormValues = (
    values: OAuthClientFormValues
  ): Partial<Record<keyof OAuthClientFormValues, string>> | null => {
    const errors: Partial<Record<keyof OAuthClientFormValues, string>> = {};
    if (!values.client_name.trim()) {
      errors.client_name = formLabels.appNameRequired;
    }
    if (parseRedirectUris(values.redirect_uris).length === 0) {
      errors.redirect_uris = formLabels.appNameRequired;
    }
    return Object.keys(errors).length > 0 ? errors : null;
  };

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Failed to load applications');
      }
      const data = await readAppApiJson<OAuthClientListItem[]>(response);
      setApps(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load apps error:', error);
      message.error(tt.toastError || 'Operation failed, please try again later');
    } finally {
      setLoading(false);
    }
  }, [tt.toastError]);

  useEffect(() => {
    void loadApps();
  }, [loadApps]);

  const showCredentialsModal = (next: OAuthCredentials) => {
    setCredentials(next);
    setCredentialsModalVisible(true);
  };

  const handleCopyClientId = async (clientId: string) => {
    try {
      await copyText(clientId);
      message.success(tt.copyClientIdSuccess || 'Client ID copied');
    } catch {
      message.error(tt.toastError || 'Operation failed, please try again later');
    }
  };

  const handleCopyFromCredentialsModal = async (field: 'id' | 'secret') => {
    if (!credentials) return;
    try {
      if (field === 'id') {
        await copyText(credentials.clientId);
        message.success(tt.copyClientIdSuccess || 'Client ID copied');
      } else {
        await copyText(credentials.clientSecret);
        message.success(tt.copySecretSuccess || 'Client Secret copied');
      }
    } catch {
      message.error(tt.toastError || 'Operation failed, please try again later');
    }
  };

  const closeCredentialsModal = () => {
    setCredentialsModalVisible(false);
    setCredentials(null);
  };

  const handleCreateApp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateFormValues(createValues);
    if (validationErrors) {
      setCreateFieldErrors(validationErrors);
      return;
    }
    setCreateFieldErrors({});

    try {
      const redirectUris = parseRedirectUris(createValues.redirect_uris);
      const payload: OAuthClientCreate = {
        client_name: createValues.client_name.trim(),
        client_uri: createValues.client_uri.trim() || undefined,
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

      const data = await readAppApiJson<OAuthClientCreateResponse>(response);

      const newApp: OAuthClientListItem = {
        client_id: data.client_id,
        client_name: data.client_name,
        client_uri: data.client_uri,
        redirect_uris: data.redirect_uris,
        created_at: data.created_at,
        updated_at: data.created_at
      };

      setApps((prev) => [...prev, newApp]);
      setCreateModalVisible(false);
      resetCreateForm();

      showCredentialsModal({
        clientId: data.client_id,
        clientSecret: data.client_secret
      });
    } catch (error) {
      console.error('Create app error:', error);
      message.error(tt.toastError || 'Operation failed, please try again later');
    }
  };

  const handleEditApp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingApp) return;

    const validationErrors = validateFormValues(editValues);
    if (validationErrors) {
      setEditFieldErrors(validationErrors);
      return;
    }
    setEditFieldErrors({});

    try {
      const redirectUris = parseRedirectUris(editValues.redirect_uris);
      const payload: OAuthClientUpdate = {
        client_name: editValues.client_name.trim(),
        client_uri: editValues.client_uri.trim() || undefined,
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

      const updatedApp = await readAppApiJson<OAuthClientDetail>(response);

      setApps((prev) =>
        prev.map((app) =>
          app.client_id === editingApp.client_id
            ? {
                ...app,
                client_name: updatedApp.client_name,
                client_uri: updatedApp.client_uri,
                redirect_uris: updatedApp.redirect_uris,
                updated_at: updatedApp.updated_at
              }
            : app
        )
      );

      setEditModalVisible(false);
      setEditingApp(null);
      resetEditForm();

      message.success(tt.toastUpdateSuccess || 'Application updated successfully');
    } catch (error) {
      console.error('Update app error:', error);
      message.error(tt.toastError || 'Operation failed, please try again later');
    }
  };

  const handleRotateSecret = async (clientId: string) => {
    Modal.confirm({
      title: tt.rotateSecretConfirmTitle || 'Rotate Secret',
      content:
        tt.rotateSecretConfirmContent ||
        'Rotating the secret will immediately invalidate the old one. Continue?',
      okText: tt.rotateSecretButton || 'Rotate Secret',
      cancelText: tt.cancelButton || 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`/api/clients/${clientId}/rotate-secret`, {
            method: 'POST'
          });

          if (!response.ok) {
            throw new Error('Failed to rotate secret');
          }

          const data = await readAppApiJson<OAuthClientSecretRotateResponse>(
            response
          );
          showCredentialsModal({
            clientId,
            clientSecret: data.client_secret
          });
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
      content:
        tt.deleteConfirmContent ||
        'Permanently delete this application? This action cannot be undone.',
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

          setApps((prev) => prev.filter((app) => app.client_id !== clientId));
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
    setEditValues({
      client_name: app.client_name,
      client_uri: app.client_uri || '',
      redirect_uris: app.redirect_uris.join('\n')
    });
    setEditFieldErrors({});
    setEditModalVisible(true);
  };

  const openCreateModal = () => {
    resetCreateForm();
    setCreateModalVisible(true);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-primary-text">
            {tt.title || 'My OAuth Applications'}
          </h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 shadow-sm"
          >
            {tt.createButton || 'Create New App'}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spin tip={tt.loading || 'Loading applications…'} />
          </div>
        ) : (
          <div className="space-y-4">
            {apps.length === 0 ? (
              <div className="text-center py-12 text-secondary-text rounded-xl border border-dashed border-primary-border bg-elevated/50">
                {tt.emptyState ||
                  'No applications yet. Click "Create New App" to get started.'}
              </div>
            ) : (
              apps.map((app) => (
                <div
                  key={app.client_id}
                  className="bg-elevated rounded-xl shadow-sm border border-primary-border p-5 transition-colors hover:border-brand/30"
                >
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-primary-text">
                          {app.client_name}
                        </h3>
                        <span
                          className={clsx(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            'bg-green-100 text-green-800',
                            'dark:bg-green-900/30 dark:text-green-300'
                          )}
                        >
                          {tt.statusEnabled || 'Enabled'}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap min-w-0">
                        <code className="text-sm bg-secondary text-primary-text px-2 py-1 rounded-lg font-mono border border-primary-border/40 break-all">
                          {tt.clientIdLabel || 'Client ID'}: {app.client_id}
                        </code>
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => void handleCopyClientId(app.client_id)}
                          className="text-brand hover:text-brand-hover"
                          aria-label={tt.copyClientIdSuccess || 'Copy Client ID'}
                        />
                      </div>
                      <p className="text-sm text-secondary-text mt-2 break-words">
                        {tt.redirectUrisLabel || 'Redirect URIs'}:{' '}
                        <code className="bg-secondary text-primary-text px-1.5 py-0.5 rounded text-xs font-mono">
                          {app.redirect_uris.join(', ')}
                        </code>
                      </p>
                      <p className="text-xs text-muted-text mt-2">
                        {tt.createdAtLabel || 'Created at'}{' '}
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2 shrink-0">
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(app)}
                        className="text-brand hover:text-brand-hover px-2"
                      >
                        {tt.editButton || 'Edit'}
                      </Button>
                      <Button
                        type="link"
                        icon={<KeyOutlined />}
                        onClick={() => void handleRotateSecret(app.client_id)}
                        className="text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 px-2"
                      >
                        {tt.rotateSecretButton || 'Rotate Secret'}
                      </Button>
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => void handleDeleteApp(app.client_id)}
                        className="px-2"
                      >
                        {tt.deleteButton || 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <OAuthClientCredentialsModal
        open={credentialsModalVisible}
        credentials={credentials}
        title={tt.credentialsModalTitle || 'New Application Credentials'}
        clientIdLabel={tt.clientIdLabel || 'Client ID'}
        clientSecretLabel={tt.clientSecretLabel || 'Client Secret'}
        secretWarning={
          tt.secretWarning ||
          'This secret is shown only once. Save it securely now.'
        }
        confirmLabel={tt.credentialsConfirm || 'I have saved it, close'}
        onCopyClientId={() => void handleCopyFromCredentialsModal('id')}
        onCopySecret={() => void handleCopyFromCredentialsModal('secret')}
        onClose={closeCredentialsModal}
      />

      <Modal
        title={
          <span className="text-primary-text">
            {tt.createModalTitle || 'Create OAuth Application'}
          </span>
        }
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          resetCreateForm();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <OAuthClientAppForm
          formId="create-oauth-client"
          values={createValues}
          fieldErrors={createFieldErrors}
          labels={formLabels}
          onChange={(patch) => {
            setCreateValues((prev) => ({ ...prev, ...patch }));
            setCreateFieldErrors((prev) => {
              const next = { ...prev };
              for (const key of Object.keys(patch) as (keyof OAuthClientFormValues)[]) {
                delete next[key];
              }
              return next;
            });
          }}
          onSubmit={handleCreateApp}
          footer={
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                className={modalCancelButtonClass}
                onClick={() => {
                  setCreateModalVisible(false);
                  resetCreateForm();
                }}
              >
                {tt.cancelButton || 'Cancel'}
              </button>
              <button type="submit" className={modalSubmitButtonClass}>
                {tt.createSubmitButton || 'Create Application'}
              </button>
            </div>
          }
        />
      </Modal>

      <Modal
        title={
          <span className="text-primary-text">
            {tt.editModalTitle || 'Edit Application'}
          </span>
        }
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingApp(null);
          resetEditForm();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <OAuthClientAppForm
          formId="edit-oauth-client"
          values={editValues}
          fieldErrors={editFieldErrors}
          labels={formLabels}
          onChange={(patch) => {
            setEditValues((prev) => ({ ...prev, ...patch }));
            setEditFieldErrors((prev) => {
              const next = { ...prev };
              for (const key of Object.keys(patch) as (keyof OAuthClientFormValues)[]) {
                delete next[key];
              }
              return next;
            });
          }}
          onSubmit={handleEditApp}
          footer={
            <div className="flex flex-wrap gap-3 justify-between items-center mt-6">
              <div className="flex flex-wrap gap-2">
                {editingApp && (
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition"
                      onClick={() => void handleRotateSecret(editingApp.client_id)}
                    >
                      <KeyOutlined />
                      {tt.rotateSecretButton || 'Rotate Secret'}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
                      onClick={() => {
                        const clientId = editingApp.client_id;
                        setEditModalVisible(false);
                        setEditingApp(null);
                        resetEditForm();
                        void handleDeleteApp(clientId);
                      }}
                    >
                      <DeleteOutlined />
                      {tt.deleteButton || 'Delete'}
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className={modalCancelButtonClass}
                  onClick={() => {
                    setEditModalVisible(false);
                    setEditingApp(null);
                    resetEditForm();
                  }}
                >
                  {tt.cancelButton || 'Cancel'}
                </button>
                <button type="submit" className={modalSubmitButtonClass}>
                  {tt.saveSubmitButton || 'Save Changes'}
                </button>
              </div>
            </div>
          }
        />
      </Modal>
    </>
  );
}
