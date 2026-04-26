# Newt

**Your overnight AI research agent.**

While you sleep, Newt reads eight official AI vendor blogs, distills the news, and ships copy-paste-ready tips with cited sources by morning. Three more agents stand by during the day to unpack any article you paste, route a task to the right AI in your toolkit, and ground questions in the live web.

[**Live demo →**](https://v0-ai-news-to-tips.vercel.app/)

![Built with v0](https://img.shields.io/badge/Built_with-v0-black) ![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black) ![Powered by AI Gateway](https://img.shields.io/badge/Inference-Vercel_AI_Gateway-black) ![MCP](https://img.shields.io/badge/MCP-Firecrawl_+_Tavily-black) ![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E)

---

## What Newt does

Most AI newsletters tell you what shipped. They don't tell you what to do with it.

Newt is an autonomous research agent for knowledge workers drowning in AI news. Every night a scheduled job reads the official blogs of OpenAI, Anthropic, Google, Microsoft, Perplexity, Moonshot AI (Kimi), Alibaba (Qwen) and DeepSeek through **Firecrawl MCP**, deduplicates by canonical URL, distills the articles through **Vercel AI Gateway**, and writes the day's edition to Supabase before sunrise.

By the time you open your laptop with coffee, today's tips are already there — each one a one-line summary, a categorized scenario, a copy-paste prompt, and a working link back to the source.

Three on-demand agents stand by during the day:

- **Unpack** — paste any article URL or text. Firecrawl scrapes it, an LLM extracts 3–5 actionable tips with prompts already written.
- **Advisor** — describe a task in one line. Newt picks the best AI from your personal toolkit ("Best pick / Alternatives / Avoid"), with tradeoff sources cited. Recommendations are constrained to tools you actually have access to — never "go buy GPT-4o Pro Max."
- **Ask** — open-ended question composer. Tavily MCP searches the live web, every answer carries cited sources, optional YouTube walkthroughs.

Personalized by **role**, **toolkit**, and **skill level** — captured at onboarding, injected into every LLM prompt. Free for today's edition; paid unlocks 60 days of agent history.

**Differentiator:** the only Zero-to-Agent submission that fluently routes between Western (OpenAI, Anthropic, Google, Microsoft, Perplexity) and Asia-Pacific (Kimi, Qwen, DeepSeek) AI tools. Asia-Pacific support is built into the toolkit picker and the Advisor reasoning, not bolted on.

---

## How the agent works

```mermaid
flowchart LR
    A[Cron 04:00 MYT] --> B[Firecrawl MCP<br/>scrape 8 vendor blogs]
    B --> C[Dedupe by URL]
    C --> D[Vercel AI Gateway<br/>distill to 5-8 tips]
    D --> E[(Supabase<br/>news_items + tips)]
    E --> F[Personalize<br/>role + toolkit + skill]
    F --> G[/today]

    H[User pastes article] --> I[/unpack/]
    I --> B
    J[User asks question] --> K[/ask/]
    K --> L[Tavily MCP<br/>live web search]
    L --> D
    M[User describes task] --> N[/advisor/]
    N --> D
```

Four agents share one tool stack. The overnight one runs whether anyone is watching; the three on-demand ones run when you ask.

---

## Tech stack

| Layer | Tech | Why |
|---|---|---|
| **Build tool** | [v0](https://v0.app) | The contest brief, and a fast way to iterate on UI |
| **Framework** | Next.js 15 (App Router) + React 19 + TypeScript | Server components for fast first-paint, route handlers for the cron and on-demand agents |
| **Styling** | Tailwind v4 | Single source of truth for design tokens |
| **Hosting** | [Vercel](https://vercel.com) | Edge runtime, scheduled cron via `vercel.json`, observability for `[v0]` log markers |
| **LLM inference** | [Vercel AI Gateway](https://vercel.com/ai-gateway) | Zero-config provider routing, single API key, model fallback |
| **Article scraping** | [Firecrawl MCP](https://www.firecrawl.dev/) | Robust HTML-to-markdown across vendor blog formats |
| **Live web search** | [Tavily MCP](https://tavily.com/) | Real-time grounding with citation metadata |
| **Database + Auth** | [Supabase](https://supabase.com) | Postgres + RLS for tier gating, Auth via `@supabase/ssr`, run history via `cron.job_run_details` |

---

## The four surfaces

| Route | Purpose | Auth | Tier |
|---|---|---|---|
| `/today` | Daily feed of agent-written tips | No (gated for save/personalize) | Free + |
| `/today/[date]` | A past edition by date | Yes | Paid |
| `/history` | Calendar of last 60 editions | Yes | Paid |
| `/unpack` | Paste an article, get tips | No (1/week anon) | Free + |
| `/advisor` | Toolkit-aware tool recommender | No (1/week anon) | Free + |
| `/ask` | Grounded Q&A with live web | No (1/week anon) | Free + |
| `/library` | Saved-tip playbook with KPIs | Yes | Free + |

---

## Local development

### Prerequisites

- Node.js 20+
- pnpm (or npm / yarn)
- A Supabase project ([free tier works](https://supabase.com))
- API keys for [Firecrawl](https://firecrawl.dev), [Tavily](https://tavily.com), and [Vercel AI Gateway](https://vercel.com/ai-gateway)

### Setup

```bash
# Clone
git clone https://github.com/DCXTribe/v0-ai-news-to-tips.git
cd v0-ai-news-to-tips

# Install
pnpm install

# Configure
cp .env.example .env.local
# fill in the values (see below)

# Run database migrations
pnpm supabase db push

# Start the dev server
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Environment variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI inference
AI_GATEWAY_API_KEY=

# MCP integrations
FIRECRAWL_API_KEY=
TAVILY_API_KEY=

# Cron auth
CRON_SECRET=
```

### Triggering the agent locally

The overnight pipeline runs at 04:00 MYT (20:00 UTC) by Vercel Cron. To bootstrap an edition manually during development, hit the cron route directly:

```bash
# In a browser tab against the dev server:
http://localhost:3000/api/cron/daily-feed?secret=YOUR_CRON_SECRET

# Or with curl in production:
curl -i "https://your-domain.vercel.app/api/cron/daily-feed?secret=$CRON_SECRET"
```

The route reads the vendor whitelist from `lib/constants.ts`, scrapes each source via Firecrawl in parallel, generates tips through AI Gateway, writes to `ai_daily_news_items` and `ai_daily_tips`, and purges the cache so `/today` shows the new edition immediately.

---

## Project structure

```
v0-ai-news-to-tips/
├── app/
│   ├── (marketing)/           # / and shared marketing surfaces
│   ├── today/                 # the daily feed
│   ├── unpack/                # article-to-tips agent
│   ├── advisor/               # toolkit-aware recommender agent
│   ├── ask/                   # grounded Q&A agent
│   ├── library/               # saved-tip playbook
│   ├── auth/                  # Supabase auth flows
│   └── api/
│       ├── cron/daily-feed/   # the overnight agent route
│       ├── unpack/            # Unpack route handler
│       ├── advisor/           # Advisor route handler
│       └── ask/               # Ask route handler
├── components/                # UI components (shadcn-derived)
├── lib/
│   ├── ai/generate.ts         # AI Gateway wrapper, model selection
│   ├── mcp/
│   │   ├── firecrawl.ts       # Firecrawl MCP adapter
│   │   └── tavily.ts          # Tavily MCP adapter
│   ├── supabase/              # Server + browser clients
│   └── constants.ts           # Vendor whitelist + tool catalog
├── scripts/                   # SQL migrations
└── vercel.json                # Cron schedule
```

---

## Data model

Five tables, all with Row Level Security:

- **`ai_daily_profiles`** — `role`, `tools[]`, `skill_level`, `is_paid`, `paid_until`
- **`ai_daily_news_items`** — one row per scraped article. Carries `source_url` (NOT NULL), `vendor`, `edition_date` (the user-facing MYT date)
- **`ai_daily_tips`** — tips joined to news items. `headline`, `body`, `prompt`, `category`, `time_saved_estimate`
- **`ai_daily_saved_tips`** — user × tip join for the saved playbook
- **`ai_daily_tip_history`** — full record of Unpack / Advisor / Ask generations

Tier gating is enforced at the database layer via an RLS policy on `ai_daily_news_items`:

```sql
create policy "tier-gated read on news items"
  on ai_daily_news_items for select
  using (
    edition_date = (now() at time zone 'Asia/Kuala_Lumpur')::date
    or exists (
      select 1 from ai_daily_profiles p
      where p.user_id = auth.uid()
        and p.is_paid = true
        and (p.paid_until is null or p.paid_until > now())
    )
  );
```

Free users always see today's edition. Past editions are paid-only. The check is at the database, not the app — a forgotten check at a route handler can't leak content.

---

## Roadmap (post-contest)

The current build is the Vercel Zero to Agent submission. The next iterations:

- **Migrate cron orchestration to Supabase pg_cron + pg_net** — keep the route handler on Vercel, move scheduling and run-history visibility to Supabase. One dashboard for data and scheduling.
- **Stripe integration** — formalize the paid tier with metered billing. Promo codes ship in the contest version.
- **Expand the source whitelist** — add Hugging Face, Mistral, and selected research labs once the eight-vendor pipeline is stable for two weeks.
- **Daily email digest (opt-in)** — for users who want push, not pull.
- **Team accounts** — shared Library, role-aware tip distribution.

---

## Built for Vercel Zero to Agent

Newt was built during [Vercel Zero to Agent](https://community.vercel.com/hackathons/zero-to-agent) (April 24 – May 3, 2026), submitted in the **v0 + MCPs** track. The whole product was built with v0, deployed on Vercel, and uses two MCP servers (Firecrawl and Tavily) to do its actual work.

Why the agent framing: the contest evaluates *agent usefulness*. Newt isn't a chatbot wrapper or a static newsletter — it's a scheduled autonomous pipeline plus three on-demand agents that share a tool stack. The "agent" word in the description maps to real, demonstrable autonomous behavior, visible in the live agent activity strip on every page.

---

## Continue working on v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below — start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_RCpGTH89Dstlv0yWAsh4FRFek44x)

---

## Acknowledgments

- [Vercel](https://vercel.com) for v0, the AI Gateway, and the contest itself.
- [Firecrawl](https://firecrawl.dev) and [Tavily](https://tavily.com) for the MCP servers that turn Newt from a UI into an agent.
- [Supabase](https://supabase.com) for the database, auth, and the cleanest RLS story in the business.
- The eight AI vendors whose public blogs are the input. Newt is not affiliated with any of them; it reads their public content and links back.

---

## License

MIT — do whatever, but if you ship a fork please don't call it Newt.

---

*Built in Kuala Lumpur with too much coffee.*
