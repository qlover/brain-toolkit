-- PAM CLI bearer token registry (jti allowlist / revoke)
-- Apply after 004-*. Existing 30d JWTs without jti will stop working after deploy (re-login).

create table if not exists public.n_pam_cli_tokens (
  id uuid primary key default gen_random_uuid(),
  jti text not null unique,
  user_id text not null,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  revoked_at timestamptz,
  login_method text,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_n_pam_cli_tokens_user
  on public.n_pam_cli_tokens (user_id);

create index if not exists idx_n_pam_cli_tokens_active
  on public.n_pam_cli_tokens (jti, revoked, expires_at);

comment on table public.n_pam_cli_tokens is
  'Issued PAM CLI JWTs by jti; revoke on logout or admin wipe.';

alter table public.n_pam_cli_tokens enable row level security;
