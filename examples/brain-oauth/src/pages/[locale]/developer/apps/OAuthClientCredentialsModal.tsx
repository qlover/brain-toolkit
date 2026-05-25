'use client';

import { Modal, Button } from 'antd';
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
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={
        <div className="flex justify-end">
          <Button type="primary" onClick={onClose}>
            {confirmLabel}
          </Button>
        </div>
      }
      width={520}
      destroyOnClose
      maskClosable={false}
    >
      {credentials && (
        <div className="space-y-4">
          <div>
            <label className="text-primary-text mb-1.5 block text-sm font-medium">
              {clientIdLabel}
            </label>
            <CopyableCredential
              value={credentials.clientId}
              onCopy={onCopyClientId}
            />
          </div>
          <div>
            <label className="text-primary-text mb-1.5 block text-sm font-medium">
              {clientSecretLabel}
            </label>
            <CopyableCredential
              value={credentials.clientSecret}
              onCopy={onCopySecret}
            />
            <p className="text-xs text-red-500 dark:text-red-400 mt-2">
              {secretWarning}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
