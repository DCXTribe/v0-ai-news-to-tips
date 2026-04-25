-- v1.1: Add grounding/source fields to ai_daily_tips, plus a news sources registry
-- Idempotent: safe to run multiple times.

-- 1. Add source/grounding columns to ai_daily_tips
alter table public.ai_daily_tips
  add column if not exists source_url text,
  add column if not exists source_title text,
  add column if not exists source_publisher text,
  add column if not exists source_published_at timestamptz,
  add column if not exists citations jsonb not null default '[]'::jsonb,
  add column if not exists confidence text not null default 'medium' check (confidence in ('low','medium','high')),
  add column if not exists is_stale boolean not null default false;

create index if not exists ai_daily_tips_source_url_idx on public.ai_daily_tips (source_url);
create index if not exists ai_daily_tips_source_published_at_idx on public.ai_daily_tips (source_published_at desc);

-- 2. News sources registry (vendor blogs we scrape daily)
create table if not exists public.ai_daily_news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null unique,
  publisher text not null,
  vendor text not null check (vendor in ('openai','microsoft','google','anthropic','perplexity','other')),
  is_active boolean not null default true,
  last_scraped_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.ai_daily_news_sources enable row level security;

-- Public read so the homepage can show "sources we monitor"
drop policy if exists "ai_daily_news_sources_select_public" on public.ai_daily_news_sources;
create policy "ai_daily_news_sources_select_public"
  on public.ai_daily_news_sources
  for select
  using (true);

-- Seed with the canonical vendor blogs
insert into public.ai_daily_news_sources (name, url, publisher, vendor) values
  ('OpenAI News',          'https://openai.com/news/',                                'OpenAI',    'openai'),
  ('Microsoft Copilot Blog','https://www.microsoft.com/en-us/microsoft-copilot/blog/','Microsoft', 'microsoft'),
  ('Google Workspace Updates','https://workspaceupdates.googleblog.com/',             'Google',    'google'),
  ('Google AI Blog',       'https://blog.google/technology/ai/',                      'Google',    'google'),
  ('Anthropic News',       'https://www.anthropic.com/news',                          'Anthropic', 'anthropic'),
  ('Perplexity Blog',      'https://www.perplexity.ai/hub/blog',                      'Perplexity','perplexity')
on conflict (url) do nothing;

-- 3. Track which source a feed entry came from (for staleness/dedup)
alter table public.ai_daily_feed
  add column if not exists source_id uuid references public.ai_daily_news_sources(id) on delete set null,
  add column if not exists source_url text;

create index if not exists ai_daily_feed_source_url_idx on public.ai_daily_feed (source_url);
