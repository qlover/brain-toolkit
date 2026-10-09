'use client';

import {
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { BrainButton } from '@/uikit/components/brain/BrainButton';
import { BrainCode } from '@/uikit/components/brain/BrainCode';
import { BrainModal } from '@/uikit/components/brain/BrainModal';

export interface OAuthCredentials {
  clientId: string;
  clientSecret?: string;
  confidential: boolean;
}

/** Shown after create / rotate; the secret is visible only here, once. */
export function OAuthClientCredentialsModal(props: {
  open: boolean;
  credentials: OAuthCredentials | null;
  title: string;
  clientIdLabel: string;
  clientSecretLabel: string;
  secretWarning: string;
  publicClientNote: string;
  confirmLabel: string;
  copyLabel: string;
  onCopy: (value: string) => void;
  onClose: () => void;
}) {
  const {
    open,
    credentials,
    title,
    clientIdLabel,
    clientSecretLabel,
    secretWarning,
    publicClientNote,
    confirmLabel,
    copyLabel,
    onCopy,
    onClose
  } = props;

  const hasSecret = !!credentials?.confidential && !!credentials.clientSecret;

  return (
    <BrainModal
      open={open && !!credentials}
      title={title}
      wide
      data-testid="OAuthClientCredentialsModal"
    >
      {credentials && (
        <>
          <div className="brain-cred-row">
            <span className="brain-label">{clientIdLabel}</span>
            <BrainCode
              value={credentials.clientId}
              onCopy={onCopy}
              copyLabel={copyLabel}
            />
          </div>
          {hasSecret ? (
            <>
              <div className="brain-cred-row">
                <span className="brain-label">{clientSecretLabel}</span>
                <BrainCode
                  value={credentials.clientSecret!}
                  onCopy={onCopy}
                  copyLabel={copyLabel}
                />
              </div>
              <div className="brain-note warn">
                <ExclamationTriangleIcon />
                <span>{secretWarning}</span>
              </div>
            </>
          ) : (
            <div className="brain-note">
              <InformationCircleIcon />
              <span>{publicClientNote}</span>
            </div>
          )}
          <BrainButton type="button" className="mt-6" onClick={onClose}>
            {confirmLabel}
          </BrainButton>
        </>
      )}
    </BrainModal>
  );
}
