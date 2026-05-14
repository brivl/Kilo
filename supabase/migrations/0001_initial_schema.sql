-- Kilo cloud sync — initial schema
-- Mirrors WatermelonDB tables. Run this once in the Supabase SQL editor.

-- food_entries
create table public.food_entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  meal_type text not null,
  food_name text not null,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  quantity numeric not null,
  unit text not null,
  source text not null,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index food_entries_user_id_idx on public.food_entries(user_id);

-- workout_sessions
create table public.workout_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  name text not null,
  notes text,
  duration_min numeric,
  plan_id text,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index workout_sessions_user_id_idx on public.workout_sessions(user_id);

-- workout_sets
create table public.workout_sets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  exercise_name text not null,
  set_number numeric not null,
  reps numeric not null,
  weight_kg numeric not null,
  rpe numeric,
  rest_seconds numeric,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index workout_sets_user_id_idx on public.workout_sets(user_id);

-- body_weight_entries
create table public.body_weight_entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  weight_kg numeric not null,
  notes text,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index body_weight_entries_user_id_idx on public.body_weight_entries(user_id);

-- meal_templates
create table public.meal_templates (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index meal_templates_user_id_idx on public.meal_templates(user_id);

-- meal_template_items
create table public.meal_template_items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_template_id text not null,
  food_name text not null,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  quantity numeric not null,
  unit text not null,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index meal_template_items_user_id_idx on public.meal_template_items(user_id);

-- training_plans
create table public.training_plans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index training_plans_user_id_idx on public.training_plans(user_id);

-- training_plan_exercises
create table public.training_plan_exercises (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null,
  day text not null,
  exercise_name text not null,
  target_sets numeric not null,
  target_reps numeric not null,
  target_weight_kg numeric not null,
  order_index numeric not null,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index training_plan_exercises_user_id_idx on public.training_plan_exercises(user_id);

-- Row-level security: every table, every action gated on user_id = auth.uid()
alter table public.food_entries enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.body_weight_entries enable row level security;
alter table public.meal_templates enable row level security;
alter table public.meal_template_items enable row level security;
alter table public.training_plans enable row level security;
alter table public.training_plan_exercises enable row level security;

create policy "users access own rows" on public.food_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users access own rows" on public.workout_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users access own rows" on public.workout_sets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users access own rows" on public.body_weight_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users access own rows" on public.meal_templates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users access own rows" on public.meal_template_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users access own rows" on public.training_plans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users access own rows" on public.training_plan_exercises
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Trigger: bump updated_at on UPDATE
create or replace function public.bump_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bump_updated_at before update on public.food_entries
  for each row execute function public.bump_updated_at();
create trigger bump_updated_at before update on public.workout_sessions
  for each row execute function public.bump_updated_at();
create trigger bump_updated_at before update on public.workout_sets
  for each row execute function public.bump_updated_at();
create trigger bump_updated_at before update on public.body_weight_entries
  for each row execute function public.bump_updated_at();
create trigger bump_updated_at before update on public.meal_templates
  for each row execute function public.bump_updated_at();
create trigger bump_updated_at before update on public.meal_template_items
  for each row execute function public.bump_updated_at();
create trigger bump_updated_at before update on public.training_plans
  for each row execute function public.bump_updated_at();
create trigger bump_updated_at before update on public.training_plan_exercises
  for each row execute function public.bump_updated_at();
