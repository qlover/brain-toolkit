-- Unified request / operation log (API calls, auth events, etc.) (Supabase / Postgres)
-- Server-only: written and read with the service role; the app filters by user_id.

create table public.brain_oauth_request_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  event_category text not null,
  event_type text not null,
  success boolean not null default true,
  request_id uuid,
  record_type text,
  payload jsonb
);

comment on table public.brain_oauth_request_logs is 'Append-only API / auth log. Server-only (service role); user_id = brain_oauth_users.id, filtered by the app.';

comment on column public.brain_oauth_request_logs.created_at is 'Row insert time (event recorded at).';
comment on column public.brain_oauth_request_logs.updated_at is 'Last update time; append-only rows typically match created_at.';
comment on column public.brain_oauth_request_logs.event_category is 'High-level group, e.g. api, auth, system.';
comment on column public.brain_oauth_request_logs.event_type is 'Concrete event, e.g. http.request, login, logout.';
comment on column public.brain_oauth_request_logs.request_id is 'Optional correlation id for an API/request lifecycle (e.g. AppApiResult.requestId); auth-only rows may be null.';
comment on column public.brain_oauth_request_logs.record_type is 'Optional log record kind (e.g. brain-oauth for OAuth-related traffic in this app); null when unspecified.';
comment on column public.brain_oauth_request_logs.payload is 'Event-specific context: HTTP fields, IP, errors, correlation_id, auth_provider, etc.';

create index idx_brain_oauth_request_logs_user_id on public.brain_oauth_request_logs (user_id);
create index idx_brain_oauth_request_logs_created_at on public.brain_oauth_request_logs (created_at desc);
create index idx_brain_oauth_request_logs_category on public.brain_oauth_request_logs (event_category);
create index idx_brain_oauth_request_logs_event_type on public.brain_oauth_request_logs (event_type);
create index idx_brain_oauth_request_logs_request_id on public.brain_oauth_request_logs (request_id);

-- RLS on with no policies: anon / authenticated keys see nothing.
alter table public.brain_oauth_request_logs enable row level security;
