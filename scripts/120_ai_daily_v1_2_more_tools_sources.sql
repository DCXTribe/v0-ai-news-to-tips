-- v1.2: Expand vendor coverage + add Kimi/DeepSeek/Qwen + YouTube news channels.
-- Idempotent: safe to run multiple times.

-- 1) Relax the vendor CHECK constraint to include the new providers + youtube.
alter table public.ai_daily_news_sources
  drop constraint if exists ai_daily_news_sources_vendor_check;

alter table public.ai_daily_news_sources
  add constraint ai_daily_news_sources_vendor_check
  check (vendor in (
    'openai','microsoft','google','anthropic','perplexity',
    'kimi','deepseek','qwen','youtube','other'
  ));

-- 2) Seed Kimi (Moonshot AI), DeepSeek, and Qwen official news pages.
--    Tavily will use `includeDomains` to keep results scoped to each vendor.
insert into public.ai_daily_news_sources (name, url, publisher, vendor) values
  ('Moonshot AI (Kimi) News', 'https://www.moonshot.ai/',                'Moonshot AI', 'kimi'),
  ('DeepSeek News',           'https://api-docs.deepseek.com/news/',     'DeepSeek',    'deepseek'),
  ('Qwen Blog',               'https://qwenlm.github.io/blog/',          'Alibaba Qwen','qwen')
on conflict (url) do nothing;

-- 3) Seed YouTube channel landing pages for major vendors so the cron has a
--    "video-first" path. Tavily can return YouTube video URLs when these are
--    used as `includeDomains` targets.
insert into public.ai_daily_news_sources (name, url, publisher, vendor) values
  ('OpenAI on YouTube',     'https://www.youtube.com/@OpenAI',     'OpenAI on YouTube',    'youtube'),
  ('Anthropic on YouTube',  'https://www.youtube.com/@anthropic-ai','Anthropic on YouTube','youtube'),
  ('Google AI on YouTube',  'https://www.youtube.com/@Google',     'Google on YouTube',    'youtube')
on conflict (url) do nothing;

-- 4) Quick sanity index for filtering by vendor (used by /ask YouTube toggle).
create index if not exists ai_daily_news_sources_vendor_idx
  on public.ai_daily_news_sources (vendor);
