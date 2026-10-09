'use client';

import {
  KeyIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent
} from 'react';
import { BrainAvatar } from '@/uikit/components/brain/BrainAvatar';
import { BrainButton } from '@/uikit/components/brain/BrainButton';
import { BrainCode } from '@/uikit/components/brain/BrainCode';
import { BrainModal } from '@/uikit/components/brain/BrainModal';
import {
  DeveloperConfirmDialog,
  type DeveloperConfirmOptions
} from '@/uikit/components-app/developer/DeveloperConfirmDialog';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { useIOC } from '@/uikit/hook/useIOC';
import { developerAppsI18n } from '@config/i18n-mapping/developerAppsI18n';
import { I } from '@config/ioc-identifiter';
import {
  API_CLIENTS,
  apiClientDetail,
  apiClientRotateSecret
} from '@config/route';
import {
  OAuthClientAppForm,
  emptyOAuthClientFormValues,
  type OAuthClientAppFormLabels,
  type OAuthClientFormValues
} from './OAuthClientAppForm';
import {
  OAuthClientCredentialsModal,
  type OAuthCredentials
} from './OAuthClientCredentialsModal';
import { readAppApiJson } from './readAppApiJson';
import type { DialogHandler } from '@qlover/next-kit/client';
import type {
  OAuthClientListItem,
  OAuthClientCreate,
  OAuthClientCreateResponse,
  OAuthClientDetail,
  OAuthClientSecretRotateResponse,
  OAuthClientUpdate
} from '@qlover/oauth-wrapper';

type FieldErrors = Partial<Record<keyof OAuthClientFormValues, string>>;

function parseRedirectUris(raw: string): string[] {
  return raw
    .split('\n')
    .map((uri) => uri.trim())
    .filter((uri) => uri.length > 0);
}

function withoutErrors(
  errors: FieldErrors,
  patch: Partial<OAuthClientFormValues>
): FieldErrors {
  const next = { ...errors };
  for (const key of Object.keys(patch) as (keyof OAuthClientFormValues)[]) {
    delete next[key];
  }
  return next;
}

export interface DeveloperAppsPageProps {
  initialApps: OAuthClientListItem[];
}

export function DeveloperAppsPageComponent({
  initialApps
}: DeveloperAppsPageProps) {
  const tt = useI18nMapping(developerAppsI18n);
  const dialogHandler = useIOC(I.DialogHandler) as DialogHandler;
  const [apps, setApps] = useState<OAuthClientListItem[]>(initialApps);
  const [loading, setLoading] = useState(initialApps.length === 0);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDetailLoading, setEditDetailLoading] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editingApp, setEditingApp] = useState<OAuthClientListItem | null>(
    null
  );
  const [credentials, setCredentials] = useState<OAuthCredentials | null>(null);
  const [confirmOptions, setConfirmOptions] =
    useState<DeveloperConfirmOptions | null>(null);
  const [createValues, setCreateValues] = useState<OAuthClientFormValues>(
    emptyOAuthClientFormValues
  );
  const [createFieldErrors, setCreateFieldErrors] = useState<FieldErrors>({});
  const [editValues, setEditValues] = useState<OAuthClientFormValues>(
    emptyOAuthClientFormValues
  );
  const [editFieldErrors, setEditFieldErrors] = useState<FieldErrors>({});
  const editLoadSeqRef = useRef(0);

  const formLabels = useMemo<OAuthClientAppFormLabels>(
    () => ({
      appNameLabel: tt.appNameLabel,
      appNamePlaceholder: tt.appNamePlaceholder,
      redirectUrisLabel: tt.redirectUrisLabel,
      redirectUrisPlaceholder: tt.redirectUrisPlaceholder,
      redirectUrisHint: tt.redirectUrisHint,
      clientUriLabel: tt.clientUriLabel,
      logoUriLabel: tt.logoUriLabel,
      logoUriHint: tt.logoUriHint,
      clientTypeLabel: tt.clientTypeLabel,
      clientTypeConfidential: tt.clientTypeConfidential,
      clientTypeConfidentialHint: tt.clientTypeConfidentialHint,
      clientTypePublic: tt.clientTypePublic,
      clientTypePublicHint: tt.clientTypePublicHint,
      clientTypeLockedHint: tt.clientTypeLockedHint,
      statusConfidential: tt.statusConfidential,
      statusPublic: tt.statusPublic
    }),
    [tt]
  );

  const showError = useCallback(() => {
    dialogHandler.error(tt.toastError);
  }, [dialogHandler, tt.toastError]);

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
  ): FieldErrors | null => {
    const errors: FieldErrors = {};
    if (!values.client_name.trim()) {
      errors.client_name = tt.appNameRequired;
    }
    if (parseRedirectUris(values.redirect_uris).length === 0) {
      errors.redirect_uris = tt.redirectUrisRequired;
    }
    const logoUri = values.logo_uri.trim();
    if (logoUri) {
      try {
        new URL(logoUri);
      } catch {
        errors.logo_uri = tt.logoUriInvalid;
      }
    }
    return Object.keys(errors).length > 0 ? errors : null;
  };

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_CLIENTS, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to load applications');
      }
      const data = await readAppApiJson<OAuthClientListItem[]>(response);
      setApps(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load apps error:', error);
      showError();
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void loadApps();
  }, [loadApps]);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      dialogHandler.success(
        value === credentials?.clientSecret
          ? tt.copySecretSuccess
          : tt.copyClientIdSuccess
      );
    } catch {
      showError();
    }
  };

  const handleCreateApp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createSubmitting) return;
    const validationErrors = validateFormValues(createValues);
    if (validationErrors) {
      setCreateFieldErrors(validationErrors);
      return;
    }
    setCreateFieldErrors({});
    setCreateSubmitting(true);

    try {
      const redirectUris = parseRedirectUris(createValues.redirect_uris);
      const logoUri = createValues.logo_uri.trim();
      const payload = {
        client_name: createValues.client_name.trim(),
        client_uri: createValues.client_uri.trim() || undefined,
        logo_uri: logoUri || undefined,
        redirect_uris: redirectUris,
        confidential: createValues.confidential
      } satisfies OAuthClientCreate & { logo_uri?: string };

      const response = await fetch(API_CLIENTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        logo_uri: logoUri || null,
        redirect_uris: data.redirect_uris,
        confidential: data.confidential,
        created_at: data.created_at,
        updated_at: data.created_at
      };

      setApps((prev) => [newApp, ...prev]);
      setCreateModalVisible(false);
      resetCreateForm();

      setCredentials({
        clientId: data.client_id,
        clientSecret: data.client_secret,
        confidential: data.confidential
      });
    } catch (error) {
      console.error('Create app error:', error);
      showError();
    } finally {
      setCreateSubmitting(false);
    }
  };

  const closeEditModal = () => {
    if (editSubmitting) return;
    editLoadSeqRef.current += 1;
    setEditModalVisible(false);
    setEditingApp(null);
    setEditDetailLoading(false);
    resetEditForm();
  };

  const handleEditApp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingApp || editSubmitting || editDetailLoading) return;

    const validationErrors = validateFormValues(editValues);
    if (validationErrors) {
      setEditFieldErrors(validationErrors);
      return;
    }
    setEditFieldErrors({});
    setEditSubmitting(true);

    try {
      const redirectUris = parseRedirectUris(editValues.redirect_uris);
      const logoUri = editValues.logo_uri.trim();
      const payload = {
        client_name: editValues.client_name.trim(),
        client_uri: editValues.client_uri.trim() || undefined,
        logo_uri: logoUri || '',
        redirect_uris: redirectUris
      } satisfies OAuthClientUpdate & { logo_uri?: string };

      const response = await fetch(apiClientDetail(editingApp.client_id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
                logo_uri: (updatedApp.logo_uri ?? logoUri) || null,
                redirect_uris: updatedApp.redirect_uris,
                updated_at: updatedApp.updated_at
              }
            : app
        )
      );

      editLoadSeqRef.current += 1;
      setEditModalVisible(false);
      setEditingApp(null);
      resetEditForm();

      dialogHandler.success(tt.toastUpdateSuccess);
    } catch (error) {
      console.error('Update app error:', error);
      showError();
    } finally {
      setEditSubmitting(false);
    }
  };

  const askRotateSecret = (clientId: string) => {
    setConfirmOptions({
      title: tt.rotateSecretConfirmTitle,
      content: tt.rotateSecretConfirmContent,
      okText: tt.rotateSecretButton,
      cancelText: tt.cancelButton,
      onConfirm: async () => {
        try {
          const response = await fetch(apiClientRotateSecret(clientId), {
            method: 'POST',
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error('Failed to rotate secret');
          }

          const data =
            await readAppApiJson<OAuthClientSecretRotateResponse>(response);
          setCredentials({
            clientId,
            clientSecret: data.client_secret,
            confidential: true
          });
        } catch (error) {
          console.error('Rotate secret error:', error);
          showError();
          throw error;
        }
      }
    });
  };

  const askDeleteApp = (clientId: string) => {
    setConfirmOptions({
      title: tt.deleteConfirmTitle,
      content: tt.deleteConfirmContent,
      okText: tt.deleteButton,
      cancelText: tt.cancelButton,
      onConfirm: async () => {
        try {
          const response = await fetch(apiClientDetail(clientId), {
            method: 'DELETE',
            credentials: 'include'
          });

          if (!response.ok && response.status !== 204) {
            throw new Error('Failed to delete application');
          }

          setApps((prev) => prev.filter((app) => app.client_id !== clientId));
          if (editingApp?.client_id === clientId) {
            editLoadSeqRef.current += 1;
            setEditModalVisible(false);
            setEditingApp(null);
            setEditDetailLoading(false);
            resetEditForm();
          }
          dialogHandler.success(tt.toastDeleteSuccess);
        } catch (error) {
          console.error('Delete app error:', error);
          showError();
          throw error;
        }
      }
    });
  };

  const openEditModal = (app: OAuthClientListItem) => {
    const loadSeq = ++editLoadSeqRef.current;
    setEditingApp(app);
    setEditFieldErrors({});
    setEditSubmitting(false);
    setEditDetailLoading(true);
    setEditValues({
      client_name: app.client_name,
      client_uri: app.client_uri || '',
      logo_uri: app.logo_uri || '',
      redirect_uris: app.redirect_uris.join('\n'),
      confidential: app.confidential ?? true
    });
    setEditModalVisible(true);

    void (async () => {
      try {
        const detailResponse = await fetch(apiClientDetail(app.client_id), {
          credentials: 'include'
        });
        if (!detailResponse.ok) {
          throw new Error('Failed to load application detail');
        }
        const detail = await readAppApiJson<OAuthClientDetail>(detailResponse);
        if (loadSeq !== editLoadSeqRef.current) return;
        setEditValues({
          client_name: detail.client_name,
          client_uri: detail.client_uri || '',
          logo_uri: detail.logo_uri || '',
          redirect_uris: detail.redirect_uris.join('\n'),
          confidential: detail.confidential
        });
      } catch (error) {
        if (loadSeq !== editLoadSeqRef.current) return;
        console.error('Load edit detail error:', error);
        showError();
      } finally {
        if (loadSeq === editLoadSeqRef.current) {
          setEditDetailLoading(false);
        }
      }
    })();
  };

  const closeCreateModal = () => {
    if (createSubmitting) return;
    setCreateModalVisible(false);
    resetCreateForm();
  };

  const openCreateModal = () => {
    resetCreateForm();
    setCreateSubmitting(false);
    setCreateModalVisible(true);
  };

  const createButton = (
    <BrainButton type="button" size="sm" auto onClick={openCreateModal}>
      <PlusIcon className="h-4 w-4" aria-hidden />
      {tt.createButton}
    </BrainButton>
  );

  return (
    <>
      <div data-testid="DeveloperAppsPage" className="brain-content">
        <div className="brain-console-head">
          <div>
            <h1 className="brain-title">{tt.title}</h1>
            <p className="brain-desc">{tt.description}</p>
          </div>
          {createButton}
        </div>

        {loading ? (
          <div className="brain-empty" aria-busy>
            <span className="brain-spinner" aria-hidden />
          </div>
        ) : apps.length === 0 ? (
          <div className="brain-card flat brain-empty">
            <div className="brain-empty-sphere" aria-hidden />
            <p>{tt.emptyState}</p>
            {createButton}
          </div>
        ) : (
          <div className="brain-apps">
            {apps.map((app) => (
              <article
                data-testid="DeveloperAppsPageComponent"
                key={app.client_id}
                className="brain-card flat brain-app-card"
              >
                <div className="brain-row">
                  <div className="brain-who">
                    <BrainAvatar name={app.client_name} src={app.logo_uri} />
                    <h2 className="brain-name m-0 font-normal">
                      {app.client_name}
                      <span className="brain-pill ok">{tt.statusEnabled}</span>
                      <span className="brain-pill purple">
                        {app.confidential
                          ? tt.statusConfidential
                          : tt.statusPublic}
                      </span>
                    </h2>
                  </div>
                  <div className="brain-app-actions">
                    <button
                      type="button"
                      className="brain-link"
                      onClick={() => openEditModal(app)}
                    >
                      <PencilSquareIcon aria-hidden />
                      {tt.editButton}
                    </button>
                    {app.confidential && (
                      <button
                        type="button"
                        className="brain-link"
                        onClick={() => askRotateSecret(app.client_id)}
                      >
                        <KeyIcon aria-hidden />
                        {tt.rotateSecretButton}
                      </button>
                    )}
                    <button
                      type="button"
                      className="brain-link danger"
                      onClick={() => askDeleteApp(app.client_id)}
                    >
                      <TrashIcon aria-hidden />
                      {tt.deleteButton}
                    </button>
                  </div>
                </div>
                <dl className="brain-meta">
                  <dt>{tt.clientIdLabel}</dt>
                  <dd>
                    <BrainCode
                      value={app.client_id}
                      onCopy={(value) => void handleCopy(value)}
                      copyLabel={tt.copy}
                    />
                  </dd>
                  <dt>{tt.redirectUrisLabel}</dt>
                  <dd>
                    {app.redirect_uris.map((uri) => (
                      <BrainCode key={uri} value={uri} />
                    ))}
                  </dd>
                  <dt>{tt.createdAtLabel}</dt>
                  <dd>{new Date(app.created_at).toLocaleDateString()}</dd>
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>

      <BrainModal
        open={createModalVisible}
        title={tt.createModalTitle}
        onClose={createSubmitting ? undefined : closeCreateModal}
        wide
        data-testid="DeveloperAppsCreateModal"
      >
        <OAuthClientAppForm
          formId="create-oauth-client"
          values={createValues}
          fieldErrors={createFieldErrors}
          labels={formLabels}
          disabled={createSubmitting}
          onChange={(patch) => {
            setCreateValues((prev) => ({ ...prev, ...patch }));
            setCreateFieldErrors((prev) => withoutErrors(prev, patch));
          }}
          onSubmit={handleCreateApp}
        >
          <div className="brain-modal-actions">
            <BrainButton
              type="button"
              variant="ghost"
              size="sm"
              auto
              disabled={createSubmitting}
              onClick={closeCreateModal}
            >
              {tt.cancelButton}
            </BrainButton>
            <BrainButton
              type="submit"
              size="sm"
              auto
              loading={createSubmitting}
            >
              {tt.createSubmitButton}
            </BrainButton>
          </div>
        </OAuthClientAppForm>
      </BrainModal>

      <BrainModal
        open={editModalVisible}
        title={tt.editModalTitle}
        onClose={editSubmitting ? undefined : closeEditModal}
        wide
        data-testid="DeveloperAppsEditModal"
      >
        {editDetailLoading ? (
          <div
            data-testid="DeveloperAppsEditLoading"
            className="brain-empty"
            aria-busy
          >
            <span className="brain-spinner" aria-hidden />
          </div>
        ) : (
          <OAuthClientAppForm
            formId="edit-oauth-client"
            values={editValues}
            fieldErrors={editFieldErrors}
            labels={formLabels}
            lockClientType
            disabled={editSubmitting}
            onChange={(patch) => {
              setEditValues((prev) => ({ ...prev, ...patch }));
              setEditFieldErrors((prev) => withoutErrors(prev, patch));
            }}
            onSubmit={handleEditApp}
          >
            <div className="brain-edit-foot">
              {editingApp && (
                <div className="flex gap-[18px]">
                  {editValues.confidential && (
                    <button
                      type="button"
                      className="brain-link"
                      disabled={editSubmitting}
                      onClick={() => askRotateSecret(editingApp.client_id)}
                    >
                      <KeyIcon aria-hidden />
                      {tt.rotateSecretButton}
                    </button>
                  )}
                  <button
                    type="button"
                    className="brain-link danger"
                    disabled={editSubmitting}
                    onClick={() => askDeleteApp(editingApp.client_id)}
                  >
                    <TrashIcon aria-hidden />
                    {tt.deleteButton}
                  </button>
                </div>
              )}
              <div className="brain-modal-actions">
                <BrainButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  auto
                  disabled={editSubmitting}
                  onClick={closeEditModal}
                >
                  {tt.cancelButton}
                </BrainButton>
                <BrainButton
                  type="submit"
                  size="sm"
                  auto
                  loading={editSubmitting}
                >
                  {tt.saveSubmitButton}
                </BrainButton>
              </div>
            </div>
          </OAuthClientAppForm>
        )}
      </BrainModal>

      <DeveloperConfirmDialog
        open={confirmOptions != null}
        options={confirmOptions}
        onClose={() => setConfirmOptions(null)}
      />

      <OAuthClientCredentialsModal
        open={credentials != null}
        credentials={credentials}
        title={tt.credentialsModalTitle}
        clientIdLabel={tt.clientIdLabel}
        clientSecretLabel={tt.clientSecretLabel}
        secretWarning={tt.secretWarning}
        publicClientNote={tt.publicClientNote}
        confirmLabel={tt.credentialsConfirm}
        copyLabel={tt.copy}
        onCopy={(value) => void handleCopy(value)}
        onClose={() => setCredentials(null)}
      />
    </>
  );
}
