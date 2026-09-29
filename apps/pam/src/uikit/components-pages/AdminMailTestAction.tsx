'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useCallback, useState } from 'react';
import { AdminMailApi } from '@/impls/appApi/AdminMailApi';
import { pamFormFieldClass } from '@/uikit/components/pam/PAMFormFieldStyles';
import { PermissionKey, useCan } from '@/uikit/hook/useHasPermission';
import { useIOC } from '@/uikit/hook/useIOC';
import type { AdminSettingsI18nInterface } from '@config/i18n-mapping/admin18n';
import { I } from '@config/ioc-identifiter';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AdminMailTestAction({
  tt,
  hasUnsavedChanges
}: {
  tt: AdminSettingsI18nInterface;
  hasUnsavedChanges: boolean;
}) {
  const mailApi = useIOC(AdminMailApi);
  const dialogHandler = useIOC(I.DialogHandler);
  const { allowed } = useCan(PermissionKey.admin_mail_test);
  const [to, setTo] = useState('');
  const [sending, setSending] = useState(false);

  const send = useCallback(async () => {
    if (hasUnsavedChanges) {
      dialogHandler.error(tt.mailTestUnsaved);
      return;
    }
    setSending(true);
    try {
      await mailApi.sendTest(to.trim());
      dialogHandler.success(tt.mailTestSuccess);
    } catch {
      // AppApiPlugin surfaces the API error dialog.
    } finally {
      setSending(false);
    }
  }, [dialogHandler, hasUnsavedChanges, mailApi, to, tt]);

  if (!allowed) {
    return null;
  }

  return (
    <div
      data-testid="AdminMailTestAction"
      className="flex w-full items-center gap-2 sm:w-auto"
    >
      <input
        type="email"
        value={to}
        onChange={(event) => setTo(event.target.value)}
        placeholder={tt.mailTestPlaceholder}
        className={`${pamFormFieldClass} min-w-0 sm:w-56`}
      />
      <button
        type="button"
        data-permission={PermissionKey.admin_mail_test}
        disabled={sending || !EMAIL_PATTERN.test(to.trim())}
        onClick={() => void send()}
        className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary-border px-3.5 py-2.5 text-sm font-medium text-primary-text transition hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? (
          <>
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            {tt.mailTestSending}
          </>
        ) : (
          tt.mailTestSend
        )}
      </button>
    </div>
  );
}
