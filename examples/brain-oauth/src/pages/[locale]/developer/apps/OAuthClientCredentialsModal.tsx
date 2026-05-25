'use client';

import { DeveloperOverlayModal } from '@/uikit/components-app/developer/DeveloperOverlayModal';
import {
  oauthLabelClass,
  oauthPrimaryButtonClass
} from '@/uikit/styles/oauthUiStyles';
import { CopyableCredential } from './CopyableCredential';

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
}

export function OAuthClientCredentialsModal(props: {
  open: boolean;
  credentials: OAuthCredentials | null;
  title: string;
  clientIdLabel: string;
  clientSecretLabel: string;
  secretWarning: string;
  confirmLabel: string;
  onCopyClientId: () => void;
  onCopySecret: () => void;
  onClose: () => void;
}) {
  const {
    open,
    credentials,
    title,
    clientIdLabel,
    clientSecretLabel,
    secretWarning,
    confirmLabel,
    onCopyClientId,
    onCopySecret,
    onClose
  } = props;

  return (
    <DeveloperOverlayModal
      open={open}
      title={title}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      closeOnBackdrop={false}
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            className={oauthPrimaryButtonClass}
            onClick={onClose}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      {credentials && (
        <div className="space-y-4">
          <div>
            <label className={oauthLabelClass}>{clientIdLabel}</label>
            <CopyableCredential
              value={credentials.clientId}
              onCopy={onCopyClientId}
            />
          </div>
          <div>
            <label className={oauthLabelClass}>{clientSecretLabel}</label>
            <CopyableCredential
              value={credentials.clientSecret}
              onCopy={onCopySecret}
            />
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              {secretWarning}
            </p>
          </div>
        </div>
      )}
    </DeveloperOverlayModal>
  );
}
