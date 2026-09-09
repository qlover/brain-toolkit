'use client';

import { useEffect, useMemo, useState } from 'react';
import { resolveUserDisplayLabel } from '@shared/utils/pamUserIdentity';
import type { PamSessionUser } from '@schemas/PamUserSchema';
import { AuthButtonUI } from './AuthButtonUI';
import { useUserAuth } from '../hook/useUserAuth';

const skeleton = (
  <div
    data-testid="AuthButton"
    className="h-9 w-9 animate-pulse rounded-full bg-elevated"
    aria-hidden
  />
);

/**
 * Header auth control: local UI only (login / logout).
 *
 * Renders a skeleton on both the server pass and the first client render
 * (before hydration completes) to avoid hydration mismatches. Once the
 * component mounts the real auth state is shown.
 */
export function AuthButton(props: {
  loginOnly?: boolean;
  showLogoutLabel?: boolean;
}) {
  const { loginOnly = false, showLogoutLabel = false } = props;
  const { success, loading, user } = useUserAuth();

  // Keep the skeleton until after hydration so the first client render
  // matches the server-rendered HTML exactly.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const sessionUser = user as PamSessionUser | undefined;
  const displayLabel = useMemo(
    () =>
      resolveUserDisplayLabel({
        displayName: sessionUser?.display_name,
        phone: sessionUser?.phone,
        email: sessionUser?.email,
        userId: sessionUser?.id
      }),
    [sessionUser]
  );
  const needsBindEmail = Boolean(
    success && !(sessionUser?.email && sessionUser.email.trim())
  );

  if (!mounted || loading) {
    return skeleton;
  }

  return (
    <AuthButtonUI
      hasAuth={success}
      displayLabel={displayLabel}
      needsBindEmail={needsBindEmail}
      loginOnly={loginOnly}
      showLogoutLabel={showLogoutLabel}
    />
  );
}
