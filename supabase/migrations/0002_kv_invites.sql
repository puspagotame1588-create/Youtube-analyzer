-- CareerVerse — durable invite tracking, rate limiting, and support queue.
-- Used by the Supabase KV adapter (src/lib/storage/kv.ts). Service-role only.

create table if not exists invites (
  hash text primary key,                    -- sha256 of the code; raw codes are never stored
  expires_at timestamptz,
  max_uses int,
  uses int not null default 0,
  tester_label text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- Atomic use: increments only while under the cap and not revoked/expired.
create or replace function use_invite(p_hash text, p_max_uses int)
returns boolean language plpgsql security definer as $$
declare
  affected int;
begin
  insert into invites (hash, max_uses) values (p_hash, p_max_uses)
    on conflict (hash) do nothing;
  update invites
     set uses = uses + 1
   where hash = p_hash
     and revoked_at is null
     and (expires_at is null or expires_at > now())
     and (max_uses is null or uses < max_uses);
  get diagnostics affected = row_count;
  return affected = 1;
end $$;

create table if not exists kv_rate_limits (
  scope text not null,
  key text not null,
  count int not null default 0,
  window_ends_at timestamptz not null,
  primary key (scope, key)
);

create or replace function kv_rate_limit(p_scope text, p_key text, p_max int, p_window_seconds int)
returns int language plpgsql security definer as $$
declare
  new_count int;
begin
  insert into kv_rate_limits (scope, key, count, window_ends_at)
       values (p_scope, p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (scope, key) do update
       set count = case when kv_rate_limits.window_ends_at < now() then 1 else kv_rate_limits.count + 1 end,
           window_ends_at = case when kv_rate_limits.window_ends_at < now()
                                 then now() + make_interval(secs => p_window_seconds)
                                 else kv_rate_limits.window_ends_at end
  returning count into new_count;
  return new_count;
end $$;

create table if not exists kv_docs (
  id uuid primary key default gen_random_uuid(),
  list_key text not null,
  doc jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists kv_docs_list_idx on kv_docs(list_key, created_at desc);

alter table invites enable row level security;
alter table kv_rate_limits enable row level security;
alter table kv_docs enable row level security;
-- no public policies: service-role access only
