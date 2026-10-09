'use client';

import {
  BrainField,
  BrainTextareaField
} from '@/uikit/components/brain/BrainField';
import type { FormEvent, ReactNode } from 'react';

export type OAuthClientFormValues = {
  client_name: string;
  redirect_uris: string;
  client_uri: string;
  logo_uri: string;
  /** `true` = confidential; `false` = public (PKCE, no secret). Immutable after create. */
  confidential: boolean;
};

export const emptyOAuthClientFormValues: OAuthClientFormValues = {
  client_name: '',
  redirect_uris: '',
  client_uri: '',
  logo_uri: '',
  confidential: true
};

export interface OAuthClientAppFormLabels {
  appNameLabel: string;
  appNamePlaceholder: string;
  redirectUrisLabel: string;
  redirectUrisPlaceholder: string;
  redirectUrisHint: string;
  clientUriLabel: string;
  logoUriLabel: string;
  logoUriHint: string;
  clientTypeLabel: string;
  clientTypeConfidential: string;
  clientTypeConfidentialHint: string;
  clientTypePublic: string;
  clientTypePublicHint: string;
  clientTypeLockedHint: string;
  statusConfidential: string;
  statusPublic: string;
}

export function OAuthClientAppForm(props: {
  formId: string;
  values: OAuthClientFormValues;
  fieldErrors?: Partial<Record<keyof OAuthClientFormValues, string>>;
  labels: OAuthClientAppFormLabels;
  onChange: (patch: Partial<OAuthClientFormValues>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  /** Buttons rendered at the bottom of the form. */
  children?: ReactNode;
  /** Edit mode: client type is shown read-only. */
  lockClientType?: boolean;
  disabled?: boolean;
}) {
  const {
    formId,
    values,
    fieldErrors = {},
    labels,
    onChange,
    onSubmit,
    children,
    lockClientType = false,
    disabled = false
  } = props;

  const typeOptions = [
    {
      confidential: true,
      label: labels.clientTypeConfidential,
      hint: labels.clientTypeConfidentialHint
    },
    {
      confidential: false,
      label: labels.clientTypePublic,
      hint: labels.clientTypePublicHint
    }
  ];

  return (
    <form
      data-testid="OAuthClientAppForm"
      id={formId}
      onSubmit={onSubmit}
      noValidate
    >
      <BrainField
        id={`${formId}-client_name`}
        label={labels.appNameLabel}
        name="client_name"
        required
        disabled={disabled}
        value={values.client_name}
        onChange={(e) => onChange({ client_name: e.target.value })}
        placeholder={labels.appNamePlaceholder}
        invalid={!!fieldErrors.client_name}
        help={fieldErrors.client_name}
      />

      <div className="mb-[22px]">
        <span className="brain-label">{labels.clientTypeLabel}</span>
        {lockClientType ? (
          <div className="brain-type-fixed">
            <span className="brain-pill purple">
              {values.confidential
                ? labels.statusConfidential
                : labels.statusPublic}
            </span>
            <span className="brain-sub">{labels.clientTypeLockedHint}</span>
          </div>
        ) : (
          <div className="brain-choice" role="radiogroup">
            {typeOptions.map((option) => (
              <label
                data-testid="OAuthClientTypeOption"
                key={String(option.confidential)}
              >
                <input
                  type="radio"
                  name={`${formId}-confidential`}
                  checked={values.confidential === option.confidential}
                  disabled={disabled}
                  onChange={() =>
                    onChange({ confidential: option.confidential })
                  }
                />
                <span>
                  {option.label}
                  <small>{option.hint}</small>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <BrainTextareaField
        id={`${formId}-redirect_uris`}
        label={labels.redirectUrisLabel}
        name="redirect_uris"
        required
        rows={3}
        disabled={disabled}
        value={values.redirect_uris}
        onChange={(e) => onChange({ redirect_uris: e.target.value })}
        placeholder={labels.redirectUrisPlaceholder}
        invalid={!!fieldErrors.redirect_uris}
        help={fieldErrors.redirect_uris ?? labels.redirectUrisHint}
      />

      <BrainField
        id={`${formId}-client_uri`}
        label={labels.clientUriLabel}
        name="client_uri"
        type="url"
        disabled={disabled}
        value={values.client_uri}
        onChange={(e) => onChange({ client_uri: e.target.value })}
        placeholder="https://"
        invalid={!!fieldErrors.client_uri}
        help={fieldErrors.client_uri}
      />

      <BrainField
        id={`${formId}-logo_uri`}
        label={labels.logoUriLabel}
        name="logo_uri"
        type="url"
        disabled={disabled}
        value={values.logo_uri}
        onChange={(e) => onChange({ logo_uri: e.target.value })}
        placeholder="https://"
        invalid={!!fieldErrors.logo_uri}
        help={fieldErrors.logo_uri ?? labels.logoUriHint}
      />

      {children}
    </form>
  );
}
