-- Allow pam_users.email to be null for phone-only accounts.
-- Real emails remain unique; placeholder *@phone.pam.local is not treated as business email.

ALTER TABLE public.pam_users
  ALTER COLUMN email DROP NOT NULL;

COMMENT ON COLUMN public.pam_users.email IS
  'Verified business email when present. Null for phone-only profiles. Do not store @phone.pam.local here.';

-- Unique among real emails (exclude null/empty/placeholder).
DROP INDEX IF EXISTS public.idx_pam_users_email_unique_real;
CREATE UNIQUE INDEX idx_pam_users_email_unique_real
  ON public.pam_users (lower(email))
  WHERE email IS NOT NULL
    AND btrim(email) <> ''
    AND lower(email) NOT LIKE '%@phone.pam.local';
