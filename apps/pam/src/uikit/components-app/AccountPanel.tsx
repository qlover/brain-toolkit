'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { ExecutorError } from '@qlover/fe-corekit/executor';
import { isI18nKey, type TranslateFn } from '@qlover/next-kit/common';
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState
} from 'react';

import { BindEmailForm } from '@/uikit/components-app/BindEmailForm';
import { AppUserGateway } from '@/impls/AppUserGateway';
import type { UserService } from '@/impls/UserService';
import { useIOC } from '@/uikit/hook/useIOC';
import { useUserAuth } from '@/uikit/hook/useUserAuth';
import { useWarnTranslations } from '@/uikit/hook/useWarnTranslations';
import { I } from '@config/ioc-identifiter';
import {
  maskPhoneForDisplay,
  resolveUserDisplayLabel,
  toBusinessEmail
} from '@shared/utils/pamUserIdentity';
import type { AccountI18nInterface } from '@config/i18n-mapping/accountI18n';
import {
  isValidDisplayName,
  pamDisplayNameUpdateSchema,
  type PamSessionUser
} from '@schemas/PamUserSchema';

const inputClass =
  'border-primary-border text-primary-text placeholder:text-tertiary-text focus:border-brand focus:ring-brand w-full max-w-sm rounded-xl border bg-bg-container px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-offset-0';

const inputErrorClass =
  'border-(--fe-color-error) focus:border-(--fe-color-error) focus:ring-(--fe-color-error)';

function resolveError(err: unknown, fallback: string, t: TranslateFn): string {
  if (err instanceof ExecutorError && isI18nKey(err.id)) {
    return t(err.id);
  }
  if (err instanceof Error) {
    if (isI18nKey(err.message)) {
      return t(err.message);
    }
    return err.message || fallback;
  }
  return fallback;
}

function FieldRow(props: { label: string; children: ReactNode }) {
  return (
    <div
      data-testid="FieldRow"
      className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4"
    >
      <dt className="w-28 shrink-0 text-sm text-secondary-text">
        {props.label}
      </dt>
      <dd className="min-w-0 flex-1 text-sm font-medium text-primary-text">
        {props.children}
      </dd>
    </div>
  );
}

export function AccountPanel({ tt }: { tt: AccountI18nInterface }) {
  const { user, loading, success } = useUserAuth();
  const sessionUser = user as PamSessionUser | undefined;
  const gateway = useIOC(AppUserGateway);
  const userService = useIOC(I.UserServiceInterface) as UserService;
  const dialog = useIOC(I.DialogHandler);
  const t = useWarnTranslations();

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

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

  const storedRawName = sessionUser?.display_name ?? '';
  const draftValid = isValidDisplayName(draftName);
  const canSave =
    !savingName && draftValid && draftName !== storedRawName;

  useEffect(() => {
    if (!editingName) {
      setDraftName(storedRawName);
      setNameError(null);
    }
  }, [editingName, storedRawName]);

  const businessEmail = toBusinessEmail(sessionUser?.email) ?? '';
  const phone = sessionUser?.phone?.trim() ?? '';
  const needsBindEmail = Boolean(success && !businessEmail);

  const validateDraft = (value: string): string | null => {
    if (value.length === 0) {
      return tt.displayNameInvalid;
    }
    if (!isValidDisplayName(value)) {
      return tt.displayNameInvalid;
    }
    return null;
  };

  const onStartEditName = () => {
    setDraftName(storedRawName);
    setNameError(null);
    setEditingName(true);
  };

  const onCancelEditName = () => {
    setEditingName(false);
    setDraftName(storedRawName);
    setNameError(null);
  };

  const onDraftChange = (value: string) => {
    setDraftName(value);
    setNameError(validateDraft(value));
  };

  const onSaveDisplayName = async (event: FormEvent) => {
    event.preventDefault();
    const invalid = validateDraft(draftName);
    if (invalid) {
      setNameError(invalid);
      return;
    }
    const parsed = pamDisplayNameUpdateSchema.safeParse({
      display_name: draftName
    });
    if (!parsed.success) {
      setNameError(tt.displayNameInvalid);
      return;
    }
    const next = parsed.data.display_name;
    if (next === storedRawName) {
      setEditingName(false);
      return;
    }
    setNameError(null);
    setSavingName(true);
    try {
      const updatedUser = await gateway.updateDisplayName({
        display_name: next
      });
      userService.applySessionUser(updatedUser);
      dialog.success(tt.displayNameSuccess);
      setEditingName(false);
    } catch (err) {
      setNameError(resolveError(err, tt.displayNameError, t));
    } finally {
      setSavingName(false);
    }
  };

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
          <FieldRow label={tt.displayNameLabel}>
            {editingName ? (
              <form
                className="flex w-full flex-col gap-2"
                onSubmit={onSaveDisplayName}
                noValidate
              >
                <input
                  type="text"
                  value={draftName}
                  maxLength={32}
                  disabled={savingName}
                  placeholder={tt.displayNamePlaceholder}
                  aria-invalid={Boolean(nameError)}
                  className={`${inputClass}${nameError ? ` ${inputErrorClass}` : ''}`}
                  autoFocus
                  onChange={(e) => onDraftChange(e.target.value)}
                />
                {nameError ? (
                  <p className="text-sm text-(--fe-color-error)">{nameError}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={!canSave}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-3 py-1.5 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingName ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : null}
                    {tt.save}
                  </button>
                  <button
                    type="button"
                    disabled={savingName}
                    onClick={onCancelEditName}
                    className="cursor-pointer rounded-xl border border-primary-border px-3 py-1.5 text-sm font-medium text-primary-text hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {tt.cancel}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="break-all">
                  {displayName || tt.valueEmpty}
                </span>
                <button
                  type="button"
                  onClick={onStartEditName}
                  className="text-sm font-medium text-brand hover:text-brand-hover"
                >
                  {tt.displayNameEdit}
                </button>
              </div>
            )}
          </FieldRow>
          <FieldRow label={tt.phoneLabel}>
            <span className="break-all">
              {phone ? maskPhoneForDisplay(phone) : tt.valueEmpty}
            </span>
          </FieldRow>
          <FieldRow label={tt.emailLabel}>
            <span className="break-all">
              {businessEmail
                ? `${businessEmail} · ${tt.emailBound}`
                : tt.valueEmpty}
            </span>
          </FieldRow>
          <FieldRow label={tt.userIdLabel}>
            <span className="break-all">
              {sessionUser.id || tt.valueEmpty}
            </span>
          </FieldRow>
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
