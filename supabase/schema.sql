create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  category text,
  default_rest_seconds integer default 90,
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  name text not null,
  order_index integer not null default 0,
  target_sets integer not null default 3,
  target_reps integer,
  target_weight numeric,
  superset_group text,
  drop_set boolean not null default false,
  rest_pause_notes text,
  notes text,
  rest_seconds integer default 90,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  name text not null,
  session_notes text,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  set_number integer not null,
  target_reps integer,
  target_weight numeric,
  actual_reps integer,
  actual_weight numeric,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.workouts enable row level security;
alter table public.exercises enable row level security;
alter table public.sessions enable row level security;
alter table public.set_logs enable row level security;

drop policy if exists "users_owner" on public.users;
create policy "users_owner" on public.users
for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "workouts_owner" on public.workouts;
create policy "workouts_owner" on public.workouts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "exercises_owner" on public.exercises;
create policy "exercises_owner" on public.exercises
for all
using (
  exists (
    select 1 from public.workouts w
    where w.id = exercises.workout_id and w.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workouts w
    where w.id = exercises.workout_id and w.user_id = auth.uid()
  )
);

drop policy if exists "sessions_owner" on public.sessions;
create policy "sessions_owner" on public.sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "set_logs_owner" on public.set_logs;
create policy "set_logs_owner" on public.set_logs
for all
using (
  exists (
    select 1 from public.sessions s
    where s.id = set_logs.session_id and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.sessions s
    where s.id = set_logs.session_id and s.user_id = auth.uid()
  )
);
