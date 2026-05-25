'use client';

import { oauthInputClass, oauthLabelClass } from '@/uikit/styles/oauthUiStyles';
import type { FormEvent, ReactNode } from 'react';

export type OAuthClientFormValues = {
  client_name: string;
  redirect_uris: string;
  client_uri: string;
};

export const emptyOAuthClientFormValues: OAuthClientFormValues = {
  client_name: '',
  redirect_uris: '',
  client_uri: ''
};

const textareaClass = `${oauthInputClass} resize-y min-h-[5.5rem]`;

export interface OAuthClientAppFormLabels {
  appNameLabel: string;
  appNameRequired: string;
  redirectUrisLabel: string;
  redirectUrisPlaceholder: string;
  redirectUrisHint: string;
  clientUriLabel: string;
}

export function OAuthClientAppForm(props: {
  formId: string;
  values: OAuthClientFormValues;
  fieldErrors?: Partial<Record<keyof OAuthClientFormValues, string>>;
  labels: OAuthClientAppFormLabels;
  onChange: (patch: Partial<OAuthClientFormValues>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  footer?: ReactNode | null;
}) {
  const {
    formId,
    values,
    fieldErrors = {},
    labels,
    onChange,
    onSubmit,
    footer
  } = props;

  return (
    <form
      data-testid="OAuthClientAppForm"
      id={formId}
      onSubmit={onSubmit}
      className="space-y-4"
      noValidate
    >
      <div>
        <label htmlFor={`${formId}-client_name`} className={oauthLabelClass}>
          {labels.appNameLabel} <span className="text-red-500">*</span>
        </label>
        <input
          id={`${formId}-client_name`}
          name="client_name"
          type="text"
          required
          value={values.client_name}
          onChange={(e) => onChange({ client_name: e.target.value })}
          placeholder="My Application"
          className={oauthInputClass}
          aria-invalid={!!fieldErrors.client_name}
          aria-describedby={
            fieldErrors.client_name ? `${formId}-client_name-error` : undefined
          }
        />
        {fieldErrors.client_name && (
          <p
            id={`${formId}-client_name-error`}
            className="text-red-500 mt-1 text-sm"
            role="alert"
          >
            {fieldErrors.client_name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${formId}-redirect_uris`} className={oauthLabelClass}>
          {labels.redirectUrisLabel} <span className="text-red-500">*</span>
        </label>
        <textarea
          id={`${formId}-redirect_uris`}
          name="redirect_uris"
          required
          rows={3}
          value={values.redirect_uris}
          onChange={(e) => onChange({ redirect_uris: e.target.value })}
          placeholder={labels.redirectUrisPlaceholder}
          className={textareaClass}
          aria-invalid={!!fieldErrors.redirect_uris}
          aria-describedby={
            fieldErrors.redirect_uris
              ? `${formId}-redirect_uris-error`
              : `${formId}-redirect_uris-hint`
          }
        />
        {fieldErrors.redirect_uris ? (
          <p
            id={`${formId}-redirect_uris-error`}
            className="text-red-500 mt-1 text-sm"
            role="alert"
          >
            {fieldErrors.redirect_uris}
          </p>
        ) : (
          <p
            id={`${formId}-redirect_uris-hint`}
            className="text-xs text-secondary-text mt-1"
          >
            {labels.redirectUrisHint}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${formId}-client_uri`} className={oauthLabelClass}>
          {labels.clientUriLabel}
        </label>
        <input
          id={`${formId}-client_uri`}
          name="client_uri"
          type="url"
          value={values.client_uri}
          onChange={(e) => onChange({ client_uri: e.target.value })}
          placeholder="https://your-app.com"
          className={oauthInputClass}
          aria-invalid={!!fieldErrors.client_uri}
        />
        {fieldErrors.client_uri && (
          <p className="text-red-500 mt-1 text-sm" role="alert">
            {fieldErrors.client_uri}
          </p>
        )}
      </div>

      {footer ?? null}
    </form>
  );
}
