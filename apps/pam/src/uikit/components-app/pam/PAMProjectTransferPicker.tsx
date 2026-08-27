'use client';

import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { DeveloperOverlayModal } from '@/uikit/components-app/developer/DeveloperOverlayModal';
import { pamFormFieldClass } from '@/uikit/components/pam/PAMFormFieldStyles';
import { PAMApi } from '@/impls/appApi/PAMApi';
import { useIOC } from '@/uikit/hook/useIOC';
import type { PAMAuthUserSummary } from '@schemas/PAMProjectSchema';

export type PAMProjectTransferPickerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  searchPlaceholder: string;
  loadingText: string;
  emptyText: string;
  confirmText: string;
  transferring: boolean;
  onConfirm: (user: PAMAuthUserSummary) => void;
};

/**
 * Modal: load Auth users on open, search/filter, select, confirm.
 */
export function PAMProjectTransferPicker({
  open,
  onClose,
  title,
  searchPlaceholder,
  loadingText,
  emptyText,
  confirmText,
  transferring,
  onConfirm
}: PAMProjectTransferPickerProps) {
  const pamApi = useIOC(PAMApi);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<PAMAuthUserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PAMAuthUserSummary | null>(null);
  const [openedOnce, setOpenedOnce] = useState(0);

  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery('');
    setSelected(null);
    setOpenedOnce((n) => n + 1);
  }, [open]);

  useEffect(() => {
    if (!open || openedOnce === 0) {
      return;
    }
    const handle = window.setTimeout(
      () => {
        setLoading(true);
        void pamApi
          .searchUsersForTransfer(query)
          .then(setUsers)
          .catch(() => setUsers([]))
          .finally(() => setLoading(false));
      },
      query ? 250 : 0
    );
    return () => window.clearTimeout(handle);
  }, [query, open, openedOnce, pamApi]);

  return (
    <DeveloperOverlayModal
      open={open}
      title={title}
      onClose={transferring ? () => undefined : onClose}
      closeOnBackdrop={!transferring}
      maxWidthClass="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            data-testid="PAMProjectTransferConfirm"
            disabled={!selected || transferring}
            onClick={() => {
              if (selected) onConfirm(selected);
            }}
            className={clsx(
              'rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-700',
              'hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-amber-300'
            )}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          disabled={transferring}
          className={pamFormFieldClass}
          data-testid="PAMProjectTransferSearch"
          autoFocus
        />
        <div
          className="max-h-72 overflow-y-auto rounded-lg border border-primary-border"
          data-testid="PAMProjectTransferUserList"
        >
          {loading ? (
            <p className="px-3 py-6 text-center text-sm text-secondary-text">
              {loadingText}
            </p>
          ) : users.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-secondary-text">
              {emptyText}
            </p>
          ) : (
            <ul className="divide-y divide-primary-border">
              {users.map((user) => {
                const isSelected = selected?.id === user.id;
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      disabled={transferring}
                      onClick={() => setSelected(user)}
                      className={clsx(
                        'flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition',
                        isSelected
                          ? 'bg-brand/10 text-primary-text'
                          : 'hover:bg-elevated text-primary-text'
                      )}
                      data-testid={`PAMProjectTransferUser-${user.id}`}
                    >
                      <span className="text-sm font-medium">
                        {user.email || user.id}
                      </span>
                      <span className="font-mono text-[11px] text-secondary-text">
                        {user.id}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </DeveloperOverlayModal>
  );
}
