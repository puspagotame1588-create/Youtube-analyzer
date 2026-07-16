-- ---------------------------------------------------------------------------
-- MiraiPath Japan — Supabase schema (optional; the app runs without it)
--
-- Run this in the Supabase SQL editor. Then set in your environment:
--   NEXT_PUBLIC_SUPABASE_URL
--   NEXT_PUBLIC_SUPABASE_ANON_KEY
--
-- Design notes:
--  * The demo app only WRITES institution_leads. The remaining tables define
--    the production data model (profiles, consent, programs) so the schema
--    is ready when auth is added.
--  * Privacy: student_profiles rows are owned by auth.uid(); institutions
--    never get SELECT on identifiable profile columns — introductions flow
--    through consent_records.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- Institution partner inquiries (written by the public site)
create table if not exists institution_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  institution_name text not null,
  institution_type text not null,
  department text not null,
  contact_name text not null,
  role text not null,
  work_email text not null,
  phone text,
  recruitment_goals text not null,
  target_nationalities text not null,
  target_academic_year text not null,
  programs_to_promote text not null,
  current_challenge text not null,
  preferred_pilot_type text not null
    check (preferred_pilot_type in ('listing','events','introductions','insights'))
);

-- Student profiles (production; requires Supabase Auth)
create table if not exists student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_name text,
  current_country text not null,
  living_in_japan boolean not null default false,
  current_school_type text,
  expected_graduation text,
  nationality text,
  preferred_language text not null default 'en',
  highest_education text not null,
  previous_major text,
  jlpt_level text not null default 'none',
  eju_taken boolean,
  gpa text,
  attendance_percent numeric,
  preferred_field text not null,
  preferred_career text,
  school_type_preference text not null default 'either',
  preferred_region text,
  tuition_budget_jpy integer not null,
  family_support text,
  desired_start text,
  desired_salary_aspiration_jpy integer,
  priorities text[] not null default '{}',
  allow_institution_contact boolean not null default false
);

-- Consent records: every grant is explicit, scoped, and revocable
create table if not exists consent_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references student_profiles (id) on delete cascade,
  scope text not null
    check (scope in ('institution_contact','introduction_request','event_registration','information_request')),
  target_institution_id text,
  target_program_id text,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- Saved programs per profile
create table if not exists saved_programs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references student_profiles (id) on delete cascade,
  program_id text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, program_id)
);

-- Institution events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  institution_id text not null,
  title text not null,
  title_ja text,
  event_date date not null,
  format text not null check (format in ('on_campus','online')),
  description text
);

-- Direct consultation requests ("Consult us directly").
-- The public site inserts these; an advisor reviews them in the backoffice.
create table if not exists student_consultations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  created_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new','in_review','contacted','closed')),
  profile_id text,
  full_name text not null,
  email text not null,
  contact_method text not null
    check (contact_method in ('email','line','whatsapp','phone')),
  contact_handle text,
  preferred_language text not null default 'en',
  current_country text not null,
  living_in_japan boolean not null default false,
  highest_education text not null,
  jlpt_level text not null default 'none',
  preferred_field text not null,
  school_type_preference text not null default 'either',
  tuition_budget_jpy integer not null,
  desired_start text,
  message text not null,
  shortlisted_program_ids text[] not null default '{}',
  consent_to_record boolean not null default false,
  consent_to_contact boolean not null default false
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table institution_leads enable row level security;
alter table student_profiles enable row level security;
alter table consent_records enable row level security;
alter table saved_programs enable row level security;
alter table events enable row level security;
alter table student_consultations enable row level security;

-- Anyone may submit a lead; nobody may read them via the anon key.
create policy "leads: public insert" on institution_leads
  for insert with check (true);

-- Anyone may submit a consultation request; only consent-to-record rows are
-- accepted. Nobody may read them via the anon key (advisor uses a service role).
create policy "consultations: public insert" on student_consultations
  for insert with check (consent_to_record = true);

-- Students own their profile rows.
create policy "profiles: owner all" on student_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "consents: owner all" on consent_records
  for all using (
    exists (select 1 from student_profiles p where p.id = profile_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from student_profiles p where p.id = profile_id and p.user_id = auth.uid())
  );

create policy "saved: owner all" on saved_programs
  for all using (
    exists (select 1 from student_profiles p where p.id = profile_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from student_profiles p where p.id = profile_id and p.user_id = auth.uid())
  );

-- Events are public reads.
create policy "events: public read" on events for select using (true);
