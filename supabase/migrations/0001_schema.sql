-- Moonshot GenUI schema. All tables have RLS on and NO policies for anon/authenticated:
-- raw records are only readable by the generate-screen Edge Function (service role),
-- which applies the scope wall before anything reaches a model or a client.
create table public.companies (id text primary key, name text not null, employees int not null, period text not null, avg_salary int, training_costs int);
create table public.teams (id text primary key, company_id text not null references public.companies(id), name text not null, lead_id text, headcount int not null, nps int[] not null, goals_achieved int, avg_skills numeric);
create table public.people (id text primary key, company_id text not null references public.companies(id), name text not null, role text not null, team_id text references public.teams(id), manager_id text references public.people(id), credits int not null default 0, endorsement_series int[] not null default '{}');
create table public.entries (id text primary key, person_id text not null references public.people(id) on delete cascade, kind text not null check (kind in ('job','education','course','event','lesson')), title text not null, org text not null, period text not null, body text, endorsements int not null default 0, credits_earned int not null default 0, visibility text not null check (visibility in ('public','private')), created_at timestamptz not null default now());
create table public.feedback (id text primary key, person_id text not null references public.people(id) on delete cascade, author_id text not null references public.people(id), text text not null, theme text not null, visibility text not null check (visibility in ('public','private')), date date not null);
create table public.one_on_ones (id text primary key, person_id text not null references public.people(id) on delete cascade, with_id text not null references public.people(id), date date not null, notes text not null);
create table public.key_results (id text primary key, company_id text not null references public.companies(id), team_id text references public.teams(id), objective text not null, text text not null, progress int not null, expected int not null);
create table public.org_changes (id text primary key, company_id text not null references public.companies(id), kind text not null, team_id text references public.teams(id), date date not null, person_name text, reports_without_1on1 int, engagement_drop int);
-- Rate limiting + audit for model calls (no prompt/response content stored).
create table public.generation_log (id bigint generated always as identity primary key, created_at timestamptz not null default now(), ip_hash text not null, context text not null, generator text not null, accepted int, rejected int, input_tokens int, output_tokens int);
create index generation_log_ip_time on public.generation_log (ip_hash, created_at desc);
create index on public.entries (person_id);
create index on public.feedback (person_id);
create index on public.one_on_ones (person_id);
alter table public.companies enable row level security;
alter table public.teams enable row level security;
alter table public.people enable row level security;
alter table public.entries enable row level security;
alter table public.feedback enable row level security;
alter table public.one_on_ones enable row level security;
alter table public.key_results enable row level security;
alter table public.org_changes enable row level security;
alter table public.generation_log enable row level security;
