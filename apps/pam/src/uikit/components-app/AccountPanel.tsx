'use client';

import { useMemo } from 'react';
import { BindEmailForm } from '@/uikit/components-app/BindEmailForm';
import { useUserAuth } from '@/uikit/hook/useUserAuth';
import {
  maskPhoneForDisplay,
  resolveUserDisplayLabel,
  toBusinessEmail
} from '@shared/utils/pamUserIdentity';
import type { AccountI18nInterface } from '@config/i18n-mapping/accountI18n';
import type { PamSessionUser } from '@schemas/PamUserSchema';

function FieldRow(props: { label: string; value: string }) {
  return (
    <div
      data-testid="FieldRow"
      className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4"
    >
      <dt className="w-28 shrink-0 text-sm text-secondary-text">
        {props.label}
      </dt>
      <dd className="min-w-0 break-all text-sm font-medium text-primary-text">
        {props.value}
      </dd>
    </div>
  );
}

export function AccountPanel({ tt }: { tt: AccountI18nInterface }) {
  const { user, loading, success } = useUserAuth();
  const sessionUser = user as PamSessionUser | undefined;

  const displayName = useMemo(
    () =>
      resolveUserDisplayLabel({
        displayName: sessionUser?.display_name,
        phone: sessionUser?.phone,
        email: sessionUser?.email,
        userId: sessionUser?.id
      }),
    [sessionUser]
  );

  const businessEmail = toBusinessEmail(sessionUser?.email) ?? '';
  const phone = sessionUser?.phone?.trim() ?? '';
  const needsBindEmail = Boolean(success && !businessEmail);

  if (loading && !sessionUser) {
    return (
      <div
        data-testid="AccountPanel"
        className="animate-pulse rounded-2xl border border-primary-border bg-elevated/40 p-6"
      >
        <div className="mb-4 h-5 w-32 rounded bg-elevated" />
        <div className="space-y-3">
          <div className="h-4 w-full max-w-sm rounded bg-elevated" />
          <div className="h-4 w-2/3 max-w-xs rounded bg-elevated" />
        </div>
      </div>
    );
  }

  if (!success || !sessionUser) {
    return null;
  }

  return (
    <div
      data-testid="AccountPanel"
      className={
        needsBindEmail
          ? 'grid w-full gap-6 lg:grid-cols-2 lg:items-start'
          : 'w-full max-w-3xl'
      }
    >
      <section className="rounded-2xl border border-primary-border bg-primary p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-primary-text">
          {tt.sectionTitle}
        </h2>
        <dl className="space-y-3">
          <FieldRow
            label={tt.displayNameLabel}
            value={displayName || tt.valueEmpty}
          />
          <FieldRow
            label={tt.phoneLabel}
            value={phone ? maskPhoneForDisplay(phone) : tt.valueEmpty}
          />
          <FieldRow
            label={tt.emailLabel}
            value={
              businessEmail
                ? `${businessEmail} · ${tt.emailBound}`
                : tt.valueEmpty
            }
          />
          <FieldRow
            label={tt.userIdLabel}
            value={sessionUser.id || tt.valueEmpty}
          />
        </dl>
        {needsBindEmail ? (
          <p className="mt-4 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2 text-sm text-primary-text">
            {tt.bindHint}
          </p>
        ) : null}
      </section>

      {needsBindEmail ? (
        <section className="rounded-2xl border border-primary-border bg-primary p-5 sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-primary-text">
            {tt.bindSectionTitle}
          </h2>
          <BindEmailForm
            labels={{
              description: tt.bindDescription,
              mergeHint: tt.bindMergeHint,
              emailPlaceholder: tt.bindEmailPlaceholder,
              otpPlaceholder: tt.bindOtpPlaceholder,
              sendCode: tt.bindSendCode,
              resendCode: tt.bindResendCode,
              verify: tt.bindVerify,
              successBound: tt.bindSuccess,
              successMerged: tt.bindSuccessMerged,
              errorFallback: tt.bindError
            }}
          />
        </section>
      ) : null}
    </div>
  );
}
