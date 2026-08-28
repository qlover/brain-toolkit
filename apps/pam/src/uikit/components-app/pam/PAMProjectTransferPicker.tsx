'use client';

import { CheckIcon } from '@heroicons/react/20/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { PAMApi } from '@/impls/appApi/PAMApi';
import { pamFormFieldClass } from '@/uikit/components/pam/PAMFormFieldStyles';
import { DeveloperOverlayModal } from '@/uikit/components-app/developer/DeveloperOverlayModal';
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
  /** Confirm body shown when a recipient is selected; `[name]` / `[email]` replaced. */
  confirmHintTemplate?: string;
  projectName?: string;
  transferring: boolean;
  onConfirm: (user: PAMAuthUserSummary) => void | Promise<void>;
  /** Optional prefetched empty-query list (hover / focus). */
  initialUsers?: PAMAuthUserSummary[];
};

function emailInitial(email: string): string {
  const local = email.split('@')[0]?.trim();
  return (local?.[0] ?? '?').toUpperCase();
}

type ClientCacheEntry = {
  users: PAMAuthUserSummary[];
  at: number;
};

const CLIENT_CACHE_TTL_MS = 60_000;
const clientCache = new Map<string, ClientCacheEntry>();

function cacheKey(query: string): string {
  return query.trim().toLowerCase();
}

function readClientCache(query: string): PAMAuthUserSummary[] | null {
  const entry = clientCache.get(cacheKey(query));
  if (!entry) return null;
  if (Date.now() - entry.at > CLIENT_CACHE_TTL_MS) {
    clientCache.delete(cacheKey(query));
    return null;
  }
  return entry.users;
}

function writeClientCache(query: string, users: PAMAuthUserSummary[]): void {
  clientCache.set(cacheKey(query), { users, at: Date.now() });
}

/**
 * Prefetch empty-query users for transfer picker (call on hover/focus).
 */
export async function prefetchTransferUsers(
  pamApi: PAMApi
): Promise<PAMAuthUserSummary[]> {
  const cached = readClientCache('');
  if (cached) return cached;
  const users = await pamApi.searchUsersForTransfer();
  writeClientCache('', users);
  return users;
}

function filterCachedUsers(
  users: PAMAuthUserSummary[],
  query: string
): PAMAuthUserSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return users;
  return users.filter((user) =>
    (user.email || user.id).toLowerCase().includes(q)
  );
}

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
  confirmHintTemplate,
  projectName = '',
  transferring,
  onConfirm,
  initialUsers
}: PAMProjectTransferPickerProps) {
  const pamApi = useIOC(PAMApi);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<PAMAuthUserSummary[]>(
    () => initialUsers ?? readClientCache('') ?? []
  );
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PAMAuthUserSummary | null>(null);
  const [openedOnce, setOpenedOnce] = useState(0);
  const [confirmPending, setConfirmPending] = useState(false);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const hasUsersRef = useRef(users.length > 0);

  useEffect(() => {
    hasUsersRef.current = users.length > 0;
  }, [users.length]);

  useEffect(() => {
    if (!open) {
      setConfirmPending(false);
      return;
    }
    setQuery('');
    setSelected(null);
    const warm = initialUsers ?? readClientCache('') ?? [];
    if (warm.length > 0) {
      setUsers(warm);
      setLoading(false);
    }
    setOpenedOnce((n) => n + 1);
  }, [open, initialUsers]);

  useEffect(() => {
    if (!open || openedOnce === 0) {
      return;
    }

    const normalized = query.trim();
    const emptyCached = readClientCache('');

    // Local filter when we already have a full-enough empty list.
    if (normalized && emptyCached && emptyCached.length < 20) {
      setUsers(filterCachedUsers(emptyCached, normalized));
      setLoading(false);
      return;
    }

    const cached = readClientCache(normalized);
    if (cached) {
      setUsers(cached);
      setLoading(false);
      return;
    }

    const delayMs = normalized ? 180 : 0;
    const handle = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;

      if (!hasUsersRef.current) {
        setLoading(true);
      }

      void pamApi
        .searchUsersForTransfer(normalized || undefined)
        .then((next) => {
          if (controller.signal.aborted || requestId !== requestIdRef.current) {
            return;
          }
          writeClientCache(normalized, next);
          setUsers(next);
        })
        .catch(() => {
          if (controller.signal.aborted || requestId !== requestIdRef.current) {
            return;
          }
          if (!hasUsersRef.current) {
            setUsers([]);
          }
        })
        .finally(() => {
          if (requestId === requestIdRef.current) {
            setLoading(false);
          }
        });
    }, delayMs);

    return () => {
      window.clearTimeout(handle);
      abortRef.current?.abort();
    };
  }, [query, open, openedOnce, pamApi]);

  const confirmHint =
    selected && confirmHintTemplate
      ? confirmHintTemplate
          .replace('[name]', projectName)
          .replace('[email]', selected.email || selected.id)
      : '';
  const busy = transferring || confirmPending;

  return (
    <DeveloperOverlayModal
      open={open}
      title={title}
      onClose={busy ? () => undefined : onClose}
      closeOnBackdrop={!busy}
      maxWidthClass="max-w-lg"
      footer={
        <div className="flex w-full flex-col gap-3">
          {confirmHint ? (
            <p className="text-sm leading-snug text-secondary-text">
              {confirmHint}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              data-testid="PAMProjectTransferConfirm"
              disabled={!selected || busy}
              onClick={() => {
                if (!selected || busy) return;
                setConfirmPending(true);
                void Promise.resolve(onConfirm(selected)).finally(() => {
                  setConfirmPending(false);
                });
              }}
              className={clsx(
                'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition touch-manipulation sm:w-auto sm:min-w-28',
                'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {busy ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden />
                  {confirmText}
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="relative flex flex-col gap-3">
        {busy ? (
          <div
            className="absolute inset-0 z-10 rounded-xl bg-secondary/60"
            aria-hidden
          />
        ) : null}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          disabled={busy}
          className={clsx(pamFormFieldClass, 'min-h-11')}
          data-testid="PAMProjectTransferSearch"
          autoFocus
        />

        <div
          className="relative max-h-[min(50vh,20rem)] overflow-y-auto rounded-xl border border-primary-border bg-secondary/40 sm:max-h-72"
          data-testid="PAMProjectTransferUserList"
        >
          {loading && users.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-secondary-text">
              {loadingText}
            </p>
          ) : !loading && users.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-secondary-text">
              {emptyText}
            </p>
          ) : (
            <ul
              className={clsx(
                'divide-y divide-primary-border/70',
                loading && 'opacity-70'
              )}
            >
              {users.map((user) => {
                const isSelected = selected?.id === user.id;
                const label = user.email || user.id;
                return (
                  <li data-testid="PAMProjectTransferPicker" key={user.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setSelected(user)}
                      className={clsx(
                        'flex w-full items-center gap-3 px-3 py-3 text-left transition touch-manipulation',
                        isSelected
                          ? 'bg-brand/10'
                          : 'hover:bg-elevated active:bg-elevated'
                      )}
                      data-testid={`PAMProjectTransferUser-${user.id}`}
                    >
                      <span
                        className={clsx(
                          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                          isSelected
                            ? 'bg-brand text-on-brand'
                            : 'bg-elevated text-brand'
                        )}
                        aria-hidden
                      >
                        {emailInitial(label)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary-text">
                        {label}
                      </span>
                      {isSelected ? (
                        <CheckIcon
                          className="h-5 w-5 shrink-0 text-brand"
                          aria-hidden
                        />
                      ) : null}
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
