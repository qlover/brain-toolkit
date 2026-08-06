'use client';

import { LoginForm } from '@/uikit/components/LoginForm';
import type { LoginI18nInterface } from '@config/i18n-mapping/loginI18n';

/**
 * Login UI — password only for now.
 * Phone OTP / Email OTP are stubbed server-side; keep them off the UI.
 */
export function LoginTabSwitch({ tt }: { tt: LoginI18nInterface }) {
  return (
    <div data-testid="LoginTabSwitch" className="w-full">
      <LoginForm tt={tt} />
    </div>
  );
}
