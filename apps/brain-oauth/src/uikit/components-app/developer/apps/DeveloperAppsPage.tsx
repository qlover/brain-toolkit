'use client';

import {
  ArrowPathIcon,
  BeakerIcon,
  ClipboardDocumentIcon,
  KeyIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useLocale } from 'next-intl';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent
} from 'react';
import { LocaleLink } from '@/uikit/components/LocaleLink';
import {
  DeveloperConfirmDialog,
  type DeveloperConfirmOptions
} from '@/uikit/components-app/developer/DeveloperConfirmDialog';
import { DeveloperOverlayModal } from '@/uikit/components-app/developer/DeveloperOverlayModal';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { useIOC } from '@/uikit/hook/useIOC';
import {
  oauthCardClass,
  oauthElevatedPanelClass,
  oauthPrimaryButtonClass,
  oauthSecondaryButtonClass
} from '@config/component';
import { developerAppsI18n } from '@config/i18n-mapping/developerAppsI18n';
import { I } from '@config/ioc-identifiter';
import {
  API_CLIENTS,
  apiClientDetail,
  apiClientRotateSecret,
  ROUTE_OAUTH_PLAYGROUND
} from '@config/route';
import {
  OAuthClientAppForm,
  emptyOAuthClientFormValues,
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

function parseRedirectUris(raw: string): string[] {
  return raw
    .split('\n')
    .map((uri) => uri.trim())
    .filter((uri) => uri.length > 0);
}

function AppListLogo({
  name,
  logoUri
}: {
  name: string;
  logoUri?: string | null;
}) {
  const [broken, setBroken] = useState(false);
  const initial = (name.trim().charAt(0) || '?').toUpperCase();
  const src = logoUri?.trim();
  const boxClass =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary-border bg-secondary text-sm font-semibold text-brand sm:h-9 sm:w-9';

  useEffect(() => {
    setBroken(false);
  }, [src]);

  if (!src || broken) {
    return (
      <div
        data-testid="DeveloperAppsPageLogoFallback"
        className={boxClass}
        aria-hidden
      >
        {initial}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external logo URL from developer input
    <img
      data-testid="DeveloperAppsPageLogo"
      src={src}
      alt=""
      className="h-8 w-8 shrink-0 rounded-lg border border-primary-border object-cover bg-secondary sm:h-9 sm:w-9"
      onError={() => setBroken(true)}
    />
  );
}

export interface DeveloperAppsPageProps {
  initialApps: OAuthClientListItem[];
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function DeveloperAppsPageComponent({
  initialApps
}: DeveloperAppsPageProps) {
  const locale = useLocale();
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
  const [credentialsModalVisible, setCredentialsModalVisible] = useState(false);
  const [confirmOptions, setConfirmOptions] =
    useState<DeveloperConfirmOptions | null>(null);
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
  const editLoadSeqRef = useRef(0);

  const formLabels = useMemo(
    () => ({
      appNameLabel: tt.appNameLabel || 'Application Name',
      appNameRequired: tt.appNameRequired || 'Please enter application name',
      redirectUrisLabel: tt.redirectUrisLabel || 'Redirect URIs (one per line)',
      redirectUrisRequired:
        tt.redirectUrisRequired || 'Please enter at least one redirect URI',
      redirectUrisPlaceholder:
        tt.redirectUrisPlaceholder ||
        'https://your-app.com/callback\nhttps://localhost:3000/callback',
      redirectUrisHint:
        tt.redirectUrisHint ||
        'Multiple callback URLs supported, one per line. Must use HTTPS (http://localhost allowed for local development).',
      clientUriLabel:
        tt.clientUriLabel || 'Application Homepage URL (Optional)',
      logoUriLabel: tt.logoUriLabel || 'Logo image URL (Optional)',
      logoUriHint:
        tt.logoUriHint ||
        'Public image URL shown on the consent screen and app list',
      logoUriInvalid: tt.logoUriInvalid || 'Please enter a valid image URL',
      clientTypeLabel: tt.clientTypeLabel || 'Client type',
      clientTypeConfidential:
        tt.clientTypeConfidential || 'Confidential (client_secret)',
      clientTypePublic: tt.clientTypePublic || 'Public (PKCE, no secret)',
      clientTypeHint:
        tt.clientTypeHint ||
        'Public clients require PKCE. Type cannot be changed after creation.',
      clientTypeLockedHint:
        tt.clientTypeLockedHint || 'Client type is fixed after creation.'
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
      errors.redirect_uris = formLabels.redirectUrisRequired;
    }
    const logoUri = values.logo_uri.trim();
    if (logoUri) {
      try {
        new URL(logoUri);
      } catch {
        errors.logo_uri = formLabels.logoUriInvalid;
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
      dialogHandler.error(
        tt.toastError || 'Operation failed, please try again later'
      );
    } finally {
      setLoading(false);
    }
  }, [dialogHandler, tt.toastError]);

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
      dialogHandler.success(tt.copyClientIdSuccess || 'Client ID copied');
    } catch {
      dialogHandler.error(
        tt.toastError || 'Operation failed, please try again later'
      );
    }
  };

  const handleCopyFromCredentialsModal = async (field: 'id' | 'secret') => {
    if (!credentials) return;
    try {
      if (field === 'id') {
        await copyText(credentials.clientId);
        dialogHandler.success(tt.copyClientIdSuccess || 'Client ID copied');
      } else if (credentials.clientSecret) {
        await copyText(credentials.clientSecret);
        dialogHandler.success(tt.copySecretSuccess || 'Client Secret copied');
      }
    } catch {
      dialogHandler.error(
        tt.toastError || 'Operation failed, please try again later'
      );
    }
  };

  const closeCredentialsModal = () => {
    setCredentialsModalVisible(false);
    setCredentials(null);
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

      setApps((prev) => [...prev, newApp]);
      setCreateModalVisible(false);
      resetCreateForm();

      showCredentialsModal({
        clientId: data.client_id,
        clientSecret: data.client_secret,
        confidential: data.confidential
      });
    } catch (error) {
      console.error('Create app error:', error);
      dialogHandler.error(
        tt.toastError || 'Operation failed, please try again later'
      );
    } finally {
      setCreateSubmitting(false);
    }
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

      setEditModalVisible(false);
      setEditingApp(null);
      resetEditForm();

      dialogHandler.success(
        tt.toastUpdateSuccess || 'Application updated successfully'
      );
    } catch (error) {
      console.error('Update app error:', error);
      dialogHandler.error(
        tt.toastError || 'Operation failed, please try again later'
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleRotateSecret = (clientId: string, confidential = true) => {
    if (!confidential) {
      dialogHandler.warn(
        tt.publicClientNote ||
          'Public clients do not have a client_secret to rotate.'
      );
      return;
    }
    setConfirmOptions({
      title: tt.rotateSecretConfirmTitle || 'Rotate Secret',
      content:
        tt.rotateSecretConfirmContent ||
        'Rotating the secret will immediately invalidate the old one. Continue?',
      okText: tt.rotateSecretButton || 'Rotate Secret',
      cancelText: tt.cancelButton || 'Cancel',
      variant: 'default',
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
          showCredentialsModal({
            clientId,
            clientSecret: data.client_secret,
            confidential: true
          });
        } catch (error) {
          console.error('Rotate secret error:', error);
          dialogHandler.error(
            tt.toastError || 'Operation failed, please try again later'
          );
          throw error;
        }
      }
    });
  };

  const handleDeleteApp = (clientId: string) => {
    setConfirmOptions({
      title: tt.deleteConfirmTitle || 'Delete Application',
      content:
        tt.deleteConfirmContent ||
        'Permanently delete this application? This action cannot be undone.',
      okText: tt.deleteButton || 'Delete',
      cancelText: tt.cancelButton || 'Cancel',
      variant: 'danger',
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
          dialogHandler.success(tt.toastDeleteSuccess || 'Application deleted');
        } catch (error) {
          console.error('Delete app error:', error);
          dialogHandler.error(
            tt.toastError || 'Operation failed, please try again later'
          );
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
        dialogHandler.error(
          tt.toastError || 'Operation failed, please try again later'
        );
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

  const closeEditModal = () => {
    if (editSubmitting) return;
    editLoadSeqRef.current += 1;
    setEditModalVisible(false);
    setEditingApp(null);
    setEditDetailLoading(false);
    resetEditForm();
  };

  const openCreateModal = () => {
    resetCreateForm();
    setCreateSubmitting(false);
    setCreateModalVisible(true);
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="max-w-5xl mx-auto w-full px-4 py-8 sm:py-10">
          <div className={oauthCardClass} data-testid="DeveloperAppsPage">
            <div className="p-6 sm:p-8 border-b border-primary-border">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-secondary-text mb-1">
                    {tt.consoleSubtitle || 'Developer Console'}
                  </p>
                  <h1 className="text-xl sm:text-2xl font-semibold text-primary-text">
                    {tt.title || 'My OAuth Applications'}
                  </h1>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  <LocaleLink
                    href={ROUTE_OAUTH_PLAYGROUND}
                    locale={locale}
                    title={tt.playgroundLink || 'OAuth playground'}
                    className={clsx(
                      oauthSecondaryButtonClass,
                      'w-full justify-center sm:w-auto'
                    )}
                  >
                    <BeakerIcon className="h-4 w-4" />
                    {tt.playgroundLink || 'OAuth playground'}
                  </LocaleLink>
                  <button
                    type="button"
                    className={clsx(
                      oauthPrimaryButtonClass,
                      'w-full justify-center sm:w-auto'
                    )}
                    onClick={openCreateModal}
                  >
                    <PlusIcon className="h-4 w-4" />
                    {tt.createButton || 'Create New App'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-secondary-text">
                  <ArrowPathIcon className="h-8 w-8 text-2xl text-brand animate-spin" />
                  <span className="text-sm">
                    {tt.loading || 'Loading applications'}
                  </span>
                </div>
              ) : apps.length === 0 ? (
                <div
                  className={clsx(
                    oauthElevatedPanelClass,
                    'text-center py-12 px-4 border-dashed'
                  )}
                >
                  <p className="text-secondary-text text-sm leading-relaxed">
                    {tt.emptyState ||
                      'No applications yet. Click "Create New App" to get started.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {apps.map((app) => (
                    <article
                      data-testid="DeveloperAppsPageComponent"
                      key={app.client_id}
                      className={clsx(
                        oauthElevatedPanelClass,
                        'space-y-3 p-3 transition-colors hover:border-brand/30 sm:p-5'
                      )}
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <AppListLogo
                          name={app.client_name}
                          logoUri={app.logo_uri}
                        />
                        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
                          <h2 className="truncate text-xl font-semibold leading-tight text-primary-text sm:text-2xl">
                            {app.client_name}
                          </h2>
                          <span
                            className={clsx(
                              'hidden shrink-0 items-center rounded-full px-1.5 py-px text-[10px] font-semibold leading-4 sm:inline-flex',
                              app.confidential
                                ? 'bg-[#1d4ed8] text-[#ffffff]'
                                : 'bg-[#6d28d9] text-[#ffffff]'
                            )}
                          >
                            {app.confidential
                              ? tt.statusConfidential || 'Confidential'
                              : tt.statusPublic || 'Public'}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#7c3aed] bg-[#7c3aed] text-[#ffffff] transition hover:bg-[#6d28d9] sm:h-8 sm:w-auto sm:gap-1 sm:rounded-lg sm:px-2 sm:py-1 sm:text-xs sm:font-semibold"
                            onClick={() => openEditModal(app)}
                            title={tt.editButton || 'Edit'}
                            aria-label={tt.editButton || 'Edit'}
                          >
                            <PencilSquareIcon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">
                              {tt.editButton || 'Edit'}
                            </span>
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#d97706] bg-[#d97706] text-[#ffffff] transition hover:bg-[#b45309] disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:w-auto sm:gap-1 sm:rounded-lg sm:px-2 sm:py-1 sm:text-xs sm:font-semibold"
                            onClick={() =>
                              handleRotateSecret(
                                app.client_id,
                                app.confidential
                              )
                            }
                            disabled={!app.confidential}
                            title={
                              !app.confidential
                                ? tt.publicClientNote
                                : tt.rotateSecretButton || 'Rotate Secret'
                            }
                            aria-label={
                              tt.rotateSecretButton || 'Rotate Secret'
                            }
                          >
                            <KeyIcon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">
                              {tt.rotateSecretButton || 'Rotate Secret'}
                            </span>
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#dc2626] bg-[#dc2626] text-[#ffffff] transition hover:bg-[#b91c1c] sm:h-8 sm:w-auto sm:gap-1 sm:rounded-lg sm:px-2 sm:py-1 sm:text-xs sm:font-semibold"
                            onClick={() => handleDeleteApp(app.client_id)}
                            title={tt.deleteButton || 'Delete'}
                            aria-label={tt.deleteButton || 'Delete'}
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">
                              {tt.deleteButton || 'Delete'}
                            </span>
                          </button>
                        </div>
                      </div>
                      <span
                        className={clsx(
                          'inline-flex w-fit items-center rounded-full px-1.5 py-px text-[10px] font-semibold leading-4 sm:hidden',
                          app.confidential
                            ? 'bg-[#1d4ed8] text-[#ffffff]'
                            : 'bg-[#6d28d9] text-[#ffffff]'
                        )}
                      >
                        {app.confidential
                          ? tt.statusConfidential || 'Confidential'
                          : tt.statusPublic || 'Public'}
                      </span>

                      <dl className="space-y-2.5 border-t border-primary-border/60 pt-3 text-sm">
                        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
                          <dt className="shrink-0 text-xs font-medium text-secondary-text sm:w-28 sm:pt-1 sm:uppercase sm:tracking-wide">
                            {tt.clientIdLabel || 'Client ID'}
                          </dt>
                          <dd className="flex min-w-0 flex-1 items-center gap-2">
                            <code className="min-w-0 flex-1 break-all rounded-lg border border-primary-border/40 bg-secondary px-2 py-1.5 font-mono text-xs text-primary-text sm:break-normal sm:overflow-x-auto sm:whitespace-nowrap sm:text-sm">
                              {app.client_id}
                            </code>
                            <button
                              type="button"
                              onClick={() =>
                                void handleCopyClientId(app.client_id)
                              }
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary-border text-brand transition hover:bg-brand/10"
                              aria-label={
                                tt.copyClientIdSuccess || 'Copy Client ID'
                              }
                            >
                              <ClipboardDocumentIcon className="h-4 w-4" />
                            </button>
                          </dd>
                        </div>
                        {app.client_uri ? (
                          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
                            <dt className="shrink-0 text-xs font-medium text-secondary-text sm:w-28 sm:pt-0.5 sm:uppercase sm:tracking-wide">
                              {tt.clientUriLabel || 'Homepage'}
                            </dt>
                            <dd className="min-w-0 flex-1">
                              <a
                                href={app.client_uri}
                                target="_blank"
                                rel="noreferrer"
                                className="break-all text-brand hover:underline sm:break-normal sm:block sm:overflow-x-auto sm:whitespace-nowrap"
                              >
                                {app.client_uri}
                              </a>
                            </dd>
                          </div>
                        ) : null}
                        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
                          <dt className="shrink-0 text-xs font-medium text-secondary-text sm:w-28 sm:pt-1 sm:uppercase sm:tracking-wide">
                            {tt.redirectUrisLabel || 'Redirect URIs'}
                          </dt>
                          <dd className="min-w-0 flex-1 space-y-1.5">
                            {app.redirect_uris.map((uri) => (
                              <code
                                data-testid="DeveloperAppsPageComponent"
                                key={uri}
                                className="block break-all rounded-lg border border-primary-border/40 bg-secondary px-2 py-1.5 font-mono text-xs text-primary-text sm:break-normal sm:overflow-x-auto sm:whitespace-nowrap"
                              >
                                {uri}
                              </code>
                            ))}
                          </dd>
                        </div>
                        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                          <dt className="shrink-0 text-xs font-medium text-secondary-text sm:w-28 sm:uppercase sm:tracking-wide">
                            {tt.createdAtLabel || 'Created at'}
                          </dt>
                          <dd className="text-secondary-text">
                            {new Date(app.created_at).toLocaleDateString()}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
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
        publicClientNote={tt.publicClientNote}
        confirmLabel={tt.credentialsConfirm || 'I have saved it, close'}
        onCopyClientId={() => void handleCopyFromCredentialsModal('id')}
        onCopySecret={() => void handleCopyFromCredentialsModal('secret')}
        onClose={closeCredentialsModal}
      />

      <DeveloperConfirmDialog
        open={confirmOptions != null}
        options={confirmOptions}
        onClose={() => setConfirmOptions(null)}
      />

      <DeveloperOverlayModal
        open={createModalVisible}
        title={tt.createModalTitle || 'Create OAuth Application'}
        onClose={closeCreateModal}
        closeOnBackdrop={!createSubmitting}
        maxWidthClass="max-w-xl"
        footer={
          <div className="flex gap-2 sm:justify-end">
            <button
              type="button"
              className={clsx(
                oauthSecondaryButtonClass,
                'min-w-0 flex-1 justify-center sm:flex-none'
              )}
              onClick={closeCreateModal}
              disabled={createSubmitting}
            >
              {tt.cancelButton || 'Cancel'}
            </button>
            <button
              type="submit"
              form="create-oauth-client"
              className={clsx(
                oauthPrimaryButtonClass,
                'min-w-0 flex-1 justify-center sm:flex-none'
              )}
              disabled={createSubmitting}
            >
              {createSubmitting ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : null}
              {createSubmitting
                ? tt.saving || 'Saving...'
                : tt.createSubmitButton || 'Create Application'}
            </button>
          </div>
        }
      >
        <OAuthClientAppForm
          formId="create-oauth-client"
          values={createValues}
          fieldErrors={createFieldErrors}
          labels={formLabels}
          disabled={createSubmitting}
          onChange={(patch) => {
            setCreateValues((prev) => ({ ...prev, ...patch }));
            setCreateFieldErrors((prev) => {
              const next = { ...prev };
              for (const key of Object.keys(
                patch
              ) as (keyof OAuthClientFormValues)[]) {
                delete next[key];
              }
              return next;
            });
          }}
          onSubmit={handleCreateApp}
          footer={null}
        />
      </DeveloperOverlayModal>

      <DeveloperOverlayModal
        open={editModalVisible}
        title={tt.editModalTitle || 'Edit Application'}
        onClose={closeEditModal}
        closeOnBackdrop={!editSubmitting && !editDetailLoading}
        maxWidthClass="max-w-xl"
        footer={
          <div className="flex items-center gap-2">
            {editingApp ? (
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d97706]/30 bg-[#fff7ed] text-[#c2410c] transition hover:bg-[#ffedd5] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:gap-1.5 sm:px-2.5"
                  onClick={() =>
                    void handleRotateSecret(
                      editingApp.client_id,
                      editValues.confidential
                    )
                  }
                  disabled={
                    !editValues.confidential ||
                    editDetailLoading ||
                    editSubmitting
                  }
                  title={tt.rotateSecretButton || 'Rotate Secret'}
                  aria-label={tt.rotateSecretButton || 'Rotate Secret'}
                >
                  <KeyIcon className="h-4 w-4" />
                  <span className="hidden text-xs font-medium sm:inline">
                    {tt.rotateSecretButton || 'Rotate Secret'}
                  </span>
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#dc2626]/25 bg-[#fef2f2] text-[#b91c1c] transition hover:bg-[#fee2e2] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:gap-1.5 sm:px-2.5"
                  onClick={() => {
                    const clientId = editingApp.client_id;
                    closeEditModal();
                    handleDeleteApp(clientId);
                  }}
                  disabled={editDetailLoading || editSubmitting}
                  title={tt.deleteButton || 'Delete'}
                  aria-label={tt.deleteButton || 'Delete'}
                >
                  <TrashIcon className="h-4 w-4" />
                  <span className="hidden text-xs font-medium sm:inline">
                    {tt.deleteButton || 'Delete'}
                  </span>
                </button>
              </div>
            ) : null}
            <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
              <button
                type="button"
                className={clsx(
                  oauthSecondaryButtonClass,
                  'h-9 min-w-0 flex-1 justify-center px-3 sm:flex-none'
                )}
                onClick={closeEditModal}
                disabled={editSubmitting}
              >
                {tt.cancelButton || 'Cancel'}
              </button>
              <button
                type="submit"
                form="edit-oauth-client"
                className={clsx(
                  oauthPrimaryButtonClass,
                  'h-9 min-w-0 flex-1 justify-center px-3 sm:flex-none'
                )}
                disabled={editDetailLoading || editSubmitting}
              >
                {editSubmitting || editDetailLoading ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : null}
                {editSubmitting
                  ? tt.saving || 'Saving...'
                  : editDetailLoading
                    ? tt.loading || 'Loading...'
                    : tt.saveSubmitButton || 'Save Changes'}
              </button>
            </div>
          </div>
        }
      >
        {editDetailLoading ? (
          <div
            data-testid="DeveloperAppsEditLoading"
            className="flex flex-col items-center justify-center gap-3 py-10 text-secondary-text"
          >
            <ArrowPathIcon className="h-8 w-8 animate-spin text-brand" />
            <span className="text-sm">{tt.loading || 'Loading...'}</span>
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
              setEditFieldErrors((prev) => {
                const next = { ...prev };
                for (const key of Object.keys(
                  patch
                ) as (keyof OAuthClientFormValues)[]) {
                  delete next[key];
                }
                return next;
              });
            }}
            onSubmit={handleEditApp}
            footer={null}
          />
        )}
      </DeveloperOverlayModal>
    </>
  );
}
