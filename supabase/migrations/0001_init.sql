-- CareerVerse — initial schema (Supabase Postgres)
-- Beta runs on the local storage adapter; this migration is the production
-- persistence target. Apply with: supabase db push (or psql -f).

create extension if not exists "uuid-ossp";

-- ---------- enums ----------
create type verification_status as enum ('draft','reviewed','published','outdated','archived');
create type source_type as enum ('official','government','licensed','partner','manual');
create type institution_type as enum ('university','vocational');
create type route_kind as enum ('university','vocational','employment');
create type jlpt_level as enum ('none','n5','n4','n3','n2','n1');
create type ticket_status as enum ('open','answered','closed');
create type tracker_status as enum ('interested','preparing','applied','interview','result');

-- ---------- identity ----------
-- auth.users comes from Supabase Auth.
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  age_confirmed boolean not null default false,
  nationality text,
  current_country text,
  current_city text,
  residence_status text,
  residence_expires_on date,
  language_school text,
  expected_graduation date,
  attendance_min numeric, attendance_max numeric,
  interface_language text not null default 'en',
  explanation_language text not null default 'en',
  notification_email boolean not null default true,
  beta_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table education_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null, major text, grades text,
  graduated_on date, years_since_graduation int
);

create table language_qualifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,               -- jlpt / eju / english
  level text not null,              -- n2, 640, ielts-6.5 …
  expected boolean not null default false,  -- "expecting N2"
  achieved_on date
);

create table skills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, level text
);

create table work_experience (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, company text, years numeric, description text
);

create table financial_situations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_min_jpy bigint, budget_expected_jpy bigint, budget_max_jpy bigint,
  family_support_note text, updated_at timestamptz not null default now()
);

create table preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_fields text[] not null default '{}',
  preferred_city text,
  desired_salary_jpy bigint,
  risk_tolerance text,
  lifestyle_note text,
  family_responsibilities text,
  accessibility_needs text
);

-- ---------- reference data (admin-managed) ----------
create table sources (
  id text primary key,
  name_en text not null, name_ja text not null,
  url text not null,
  type source_type not null,
  retrieved_at date not null,
  reviewer text not null,
  notes text
);

create table schools (
  id text primary key,
  institution_type institution_type not null,
  name_en text not null, name_ja text not null,
  city text not null,
  fields text[] not null,
  first_year_cost_jpy bigint not null,
  annual_tuition_jpy bigint not null,
  program_years int not null,
  jlpt_required jlpt_level not null,
  eju_required boolean not null default false,
  intl_support text not null default 'basic',
  employment_outcome numeric,
  employment_outcome_is_demo boolean not null default true,
  application_months int[] not null default '{}',
  description_en text not null default '', description_ja text not null default '',
  living_cost_monthly_jpy bigint,
  career_support_en text, career_support_ja text,
  sponsored boolean not null default false,
  is_demo boolean not null default true,
  verification verification_status not null default 'draft',
  last_verified date, review_due_at date, reviewer text, confidence text,
  created_at timestamptz not null default now()
);
create index schools_city_idx on schools(city);
create index schools_verification_idx on schools(verification);

create table school_sources (
  school_id text references schools(id) on delete cascade,
  source_id text references sources(id),
  primary key (school_id, source_id)
);

create table courses (
  id uuid primary key default uuid_generate_v4(),
  school_id text not null references schools(id) on delete cascade,
  name_en text not null, name_ja text not null,
  field text not null, years int not null
);

create table tuition_records (
  id uuid primary key default uuid_generate_v4(),
  school_id text not null references schools(id) on delete cascade,
  year int not null, amount_jpy bigint not null, note text,
  verification verification_status not null default 'draft'
);

create table scholarships (
  id text primary key,
  name_en text not null, name_ja text not null,
  provider text not null,
  amount_jpy bigint not null,
  per text not null,               -- month / year / once
  eligibility_en text, eligibility_ja text,
  deadline_en text, deadline_ja text,
  region text not null,
  institution_types text[] not null,
  nationality_restricted boolean not null default false,
  min_jlpt jlpt_level not null default 'none',
  is_demo boolean not null default true,
  verification verification_status not null default 'draft',
  last_verified date, review_due_at date, reviewer text, confidence text
);

create table career_profiles (
  id text primary key,
  field text not null,
  name_en text not null, name_ja text not null,
  daily_work_en text, daily_work_ja text,
  demand_score int not null,
  min_jlpt_entry jlpt_level not null,
  pathway_university boolean not null default true,
  pathway_vocational boolean not null default true,
  pathway_direct boolean not null default false,
  work_life_en text, work_life_ja text,
  settlement_en text, settlement_ja text,
  is_demo boolean not null default true,
  verification verification_status not null default 'draft',
  last_verified date, reviewer text
);

create table career_levels (
  id text primary key,
  career_id text not null references career_profiles(id) on delete cascade,
  title_en text not null, title_ja text not null,
  years_from_entry int not null,
  salary_min_jpy bigint, salary_max_jpy bigint, salary_is_demo boolean default true,
  jlpt_typical jlpt_level,
  skills_en text[], skills_ja text[],
  qualifications_en text[], qualifications_ja text[],
  obstacles_en text, obstacles_ja text,
  visa_note_en text, visa_note_ja text
);

create table job_listings (
  id text primary key,
  career_id text references career_profiles(id),
  title_en text not null, title_ja text not null,
  company text not null, city text not null,
  salary_min_jpy bigint, salary_max_jpy bigint,
  jlpt jlpt_level, apply_url text not null,
  is_demo boolean not null default true,
  verification verification_status not null default 'draft',
  last_verified date
);

-- ---------- simulations ----------
create table scenarios (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  engine_version text not null,
  weights jsonb not null,
  profile_snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index scenarios_user_idx on scenarios(user_id);

create table scenario_assumptions (
  id uuid primary key default uuid_generate_v4(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  label text not null, value text not null,
  origin text not null check (origin in ('user','default','ai-confirmed'))
);

create table routes (
  id uuid primary key default uuid_generate_v4(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  kind route_kind not null,
  name_en text not null, name_ja text not null, custom_name text,
  career_id text references career_profiles(id),
  months_to_job int not null,
  cost_min_jpy bigint, cost_expected_jpy bigint, cost_max_jpy bigint,
  feasibility text not null, evidence text not null,
  data_freshness date
);
create index routes_scenario_idx on routes(scenario_id);

create table route_milestones (
  id uuid primary key default uuid_generate_v4(),
  route_id uuid not null references routes(id) on delete cascade,
  kind text not null,
  title_en text not null, title_ja text not null,
  detail_en text, detail_ja text,
  month_offset int not null,
  cost_jpy bigint, risk_en text, risk_ja text
);

create table route_scores (
  id uuid primary key default uuid_generate_v4(),
  route_id uuid not null references routes(id) on delete cascade,
  case_name text not null check (case_name in ('conservative','expected','optimistic')),
  total int not null,
  breakdown jsonb not null
);

-- ---------- user activity ----------
create table application_trackers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_id text not null references schools(id),
  status tracker_status not null default 'interested',
  note text not null default '',
  deadline date,
  created_at timestamptz not null default now()
);
create index trackers_user_idx on application_trackers(user_id);

create table documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('resume','transcript','jlpt','eju','attendance','brochure','job-listing')),
  filename text not null,
  storage_path text,                 -- null => original deleted after extraction
  keep_original boolean not null default false,
  uploaded_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table extracted_fields (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  field text not null, value text not null,
  confirmed boolean not null default false,   -- user must confirm before use
  corrected_value text
);

create table verification_reviews (
  id uuid primary key default uuid_generate_v4(),
  record_type text not null, record_id text not null,
  kind text not null check (kind in ('scheduled','correction-report','ai-extraction')),
  message text,
  reporter_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz, resolver text
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title_en text not null, title_ja text not null,
  body_en text, body_ja text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications(user_id, read);

create table support_tickets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null,
  message text not null,
  email text,
  status ticket_status not null default 'open',
  escalated boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- AI plumbing ----------
create table prompt_versions (
  id text primary key,               -- e.g. explain-route@v1
  task text not null,
  version text not null,
  created_at timestamptz not null default now()
);

create table ai_jobs (
  id uuid primary key default uuid_generate_v4(),
  task text not null,
  model text not null,
  prompt_version text,
  latency_ms int,
  input_tokens int, output_tokens int,
  validation_ok boolean not null,
  failure_reason text,
  created_at timestamptz not null default now()
);
-- retention: delete ai_jobs older than 90 days (pg_cron or scheduled function)

create table audit_events (
  id uuid primary key default uuid_generate_v4(),
  actor text not null,               -- admin id / 'system'
  action text not null,
  record_type text, record_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index audit_events_created_idx on audit_events(created_at);

create table feature_flags (
  key text primary key,
  enabled boolean not null default false,
  note text
);
insert into feature_flags (key, enabled, note) values
  ('payments', false, 'Stripe integration — off for private beta'),
  ('consultation-booking', false, 'Human consultation booking placeholder'),
  ('document-upload', true, 'Document extraction pipeline'),
  ('dark-mode', false, 'Beta default is light mode');

-- ---------- RLS ----------
alter table profiles enable row level security;
alter table education_history enable row level security;
alter table language_qualifications enable row level security;
alter table skills enable row level security;
alter table work_experience enable row level security;
alter table financial_situations enable row level security;
alter table preferences enable row level security;
alter table scenarios enable row level security;
alter table scenario_assumptions enable row level security;
alter table routes enable row level security;
alter table route_milestones enable row level security;
alter table route_scores enable row level security;
alter table application_trackers enable row level security;
alter table documents enable row level security;
alter table extracted_fields enable row level security;
alter table notifications enable row level security;
alter table support_tickets enable row level security;

-- Owner-only access for personal tables.
create policy "own profile" on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own education" on education_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own languages" on language_qualifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own skills" on skills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own work" on work_experience for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own finances" on financial_situations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own preferences" on preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own scenarios" on scenarios for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own trackers" on application_trackers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own documents" on documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notifications" on notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tickets" on support_tickets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Child tables inherit ownership through their parents.
create policy "own scenario assumptions" on scenario_assumptions for all
  using (exists (select 1 from scenarios s where s.id = scenario_id and s.user_id = auth.uid()));
create policy "own routes" on routes for all
  using (exists (select 1 from scenarios s where s.id = scenario_id and s.user_id = auth.uid()));
create policy "own milestones" on route_milestones for all
  using (exists (select 1 from routes r join scenarios s on s.id = r.scenario_id where r.id = route_id and s.user_id = auth.uid()));
create policy "own scores" on route_scores for all
  using (exists (select 1 from routes r join scenarios s on s.id = r.scenario_id where r.id = route_id and s.user_id = auth.uid()));
create policy "own extracted fields" on extracted_fields for all
  using (exists (select 1 from documents d where d.id = document_id and d.user_id = auth.uid()));

-- Reference data: public read of published records only; writes via service role.
alter table schools enable row level security;
alter table scholarships enable row level security;
alter table career_profiles enable row level security;
alter table career_levels enable row level security;
alter table job_listings enable row level security;
alter table sources enable row level security;
create policy "read published schools" on schools for select using (verification = 'published');
create policy "read published scholarships" on scholarships for select using (verification = 'published');
create policy "read published careers" on career_profiles for select using (verification = 'published');
create policy "read career levels" on career_levels for select using (true);
create policy "read published jobs" on job_listings for select using (verification = 'published');
create policy "read sources" on sources for select using (true);
