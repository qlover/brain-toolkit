'use client';

import { useEffect, useState } from 'react';
import { AuthButtonUI } from './AuthButtonUI';
import { useUserAuth } from '../hook/useUserAuth';

const skeleton = (
  <div
    data-testid="AuthButton"
    className="h-8 w-10 sm:h-9 sm:w-16 animate-pulse rounded-lg bg-elevated border border-primary-border/60"
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
  const { success, loading } = useUserAuth();

  // Keep the skeleton until after hydration so the first client render
  // matches the server-rendered HTML exactly.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return skeleton;
  }

  return (
    <AuthButtonUI
      hasAuth={success}
      loginOnly={loginOnly}
      showLogoutLabel={showLogoutLabel}
    />
  );
}
