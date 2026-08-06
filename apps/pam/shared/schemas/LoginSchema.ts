import { z } from 'zod';
import { loginProviders } from '@config/common';

/**
 * PAM login-with-provider query schema.
 *
 * Kit's `loginWithProviderSchema` only allows GitHub/Google; PAM also
 * supports Brain SSO via Supabase custom provider (`custom:brain`).
 */
export const loginWithProviderSchema = z.object({
  provider: z.enum(
    Object.values(loginProviders) as [
      (typeof loginProviders)[keyof typeof loginProviders],
      ...(typeof loginProviders)[keyof typeof loginProviders][]
    ]
  )
});

export type LoginWithProviderSchema = z.infer<typeof loginWithProviderSchema>;
