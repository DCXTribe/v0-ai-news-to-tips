-- AI Daily app schema. Namespaced with `ai_daily_*` to avoid collisions
-- with existing tables in this Supabase project.

-- 1) User profile (per-user onboarding + preferences)
create table if not exists public.ai_daily_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text,
  tools text[] default '{}'::text[],
  skill_level text default 'beginner',
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ai_daily_profiles enable row level security;

drop policy if exists "ai_daily_profiles_select_own" on public.ai_daily_profiles;
drop policy if exists "ai_daily_profiles_insert_own" on public.ai_daily_profiles;
drop policy if exists "ai_daily_profiles_update_own" on public.ai_daily_profiles;
drop policy if exists "ai_daily_profiles_delete_own" on public.ai_daily_profiles;

create policy "ai_daily_profiles_select_own" on public.ai_daily_profiles
  for select using (auth.uid() = id);
create policy "ai_daily_profiles_insert_own" on public.ai_daily_profiles
  for insert with check (auth.uid() = id);
create policy "ai_daily_profiles_update_own" on public.ai_daily_profiles
  for update using (auth.uid() = id);
create policy "ai_daily_profiles_delete_own" on public.ai_daily_profiles
  for delete using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_ai_daily_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ai_daily_profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_ai_daily_auth_user_created on auth.users;
create trigger on_ai_daily_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_ai_daily_new_user();

-- 2) Daily feed - one row per news item per day (publicly readable)
create table if not exists public.ai_daily_feed (
  id uuid primary key default gen_random_uuid(),
  feed_date date not null,
  headline text not null,
  summary text not null,
  category text,
  source_label text,
  created_at timestamptz default now()
);

create index if not exists ai_daily_feed_date_idx on public.ai_daily_feed (feed_date desc);

alter table public.ai_daily_feed enable row level security;

drop policy if exists "ai_daily_feed_select_all" on public.ai_daily_feed;
create policy "ai_daily_feed_select_all" on public.ai_daily_feed
  for select using (true);
-- inserts/updates only via service role (bypasses RLS)

-- 3) Tips - belong to a feed item (public) OR to a user (private generation)
create table if not exists public.ai_daily_tips (
  id uuid primary key default gen_random_uuid(),
  feed_id uuid references public.ai_daily_feed(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null,
  why_it_matters text,
  prompt text not null,
  scenario text,
  before_text text,
  after_text text,
  tools text[] default '{}'::text[],
  roles text[] default '{}'::text[],
  time_saved text,
  created_at timestamptz default now(),
  constraint ai_daily_tips_owner_or_feed check (feed_id is not null or owner_id is not null)
);

create index if not exists ai_daily_tips_feed_idx on public.ai_daily_tips (feed_id);
create index if not exists ai_daily_tips_owner_idx on public.ai_daily_tips (owner_id);

alter table public.ai_daily_tips enable row level security;

drop policy if exists "ai_daily_tips_select_public_or_own" on public.ai_daily_tips;
drop policy if exists "ai_daily_tips_insert_own" on public.ai_daily_tips;
drop policy if exists "ai_daily_tips_update_own" on public.ai_daily_tips;
drop policy if exists "ai_daily_tips_delete_own" on public.ai_daily_tips;

create policy "ai_daily_tips_select_public_or_own" on public.ai_daily_tips
  for select using (feed_id is not null or auth.uid() = owner_id);
create policy "ai_daily_tips_insert_own" on public.ai_daily_tips
  for insert with check (auth.uid() = owner_id);
create policy "ai_daily_tips_update_own" on public.ai_daily_tips
  for update using (auth.uid() = owner_id);
create policy "ai_daily_tips_delete_own" on public.ai_daily_tips
  for delete using (auth.uid() = owner_id);

-- 4) Saved tips (user library). status: 'saved' or 'tried'
create table if not exists public.ai_daily_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  tip_id uuid not null references public.ai_daily_tips(id) on delete cascade,
  status text not null default 'saved',
  notes text,
  created_at timestamptz default now(),
  primary key (user_id, tip_id)
);

alter table public.ai_daily_saves enable row level security;

drop policy if exists "ai_daily_saves_owner_all" on public.ai_daily_saves;
create policy "ai_daily_saves_owner_all" on public.ai_daily_saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5) History - track past translations/asks
create table if not exists public.ai_daily_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null, -- 'paste' or 'ask'
  input text not null,
  summary text,
  tip_ids uuid[] default '{}'::uuid[],
  created_at timestamptz default now()
);

create index if not exists ai_daily_history_user_idx on public.ai_daily_history (user_id, created_at desc);

alter table public.ai_daily_history enable row level security;

drop policy if exists "ai_daily_history_owner_all" on public.ai_daily_history;
create policy "ai_daily_history_owner_all" on public.ai_daily_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
