# Product Requirements Document: AI Daily

**Document Version:** 1.1 (MCP-grounded)
**Created:** April 25, 2026, 14:30 UTC
**Revised:** April 25, 2026, 15:30 UTC
**Status:** v1 Shipped • v1.1 In Spec
**Owner:** Product Team
**Stack:** Next.js 16, Supabase (Auth + Postgres), AI SDK 6, Vercel AI Gateway, **Firecrawl MCP, Tavily MCP**

> **What changed in v1.1.** The v1.0 daily feed was generated entirely from the LLM's training data — i.e., the "news" was synthesised, not real. v1.1 introduces a thin MCP-grounded ingestion layer (Firecrawl for known URLs, Tavily for open-web search) so every tip is anchored to a real, dated source. This closes the hallucinated-news risk, removes the paywall failure mode on `/translate`, and makes `/ask` honest about features that may not exist in the LLM's training cutoff. No schema-breaking changes; one new table, two new env vars.

---

## 1. Executive Summary

**AI Daily** is a B2B-style productivity web app that translates real, dated AI news into copy-paste-ready, role-specific tips that knowledge workers can apply on Monday morning. It bridges the gap between "AI headlines" and "what do I actually do with this today?"

The app supports the most widely used AI assistants — **Microsoft Copilot (Free & Pro/M365), ChatGPT (Free & Plus), Google Gemini (Free & Advanced), Claude (Free & Pro), and Perplexity (Free & Pro)** — and tailors every tip to the user's job role and the tools they have access to.

### Core Value Proposition

> "Stop reading AI news. Start using AI."

Most workers see AI headlines but don't translate them into action. AI Daily ingests today's actual posts from official AI vendor blogs, then generates a daily set of practical tips — each with a ready-to-paste prompt, a real workplace scenario, a before/after comparison, and a citation back to the source article.

### What's New in v1.1

- **Real news pipeline.** Firecrawl scrapes a curated registry of official vendor blogs every morning. The LLM translates *real posts*, not its memory.
- **Paywall fallback solved.** `/translate` uses Firecrawl as the primary URL fetcher (clean Markdown, JS-rendered, paywalls handled by Firecrawl's stealth mode where permitted) before falling back to user paste.
- **`/ask` is grounded.** Tavily search runs on every question; tips are generated against fresh search results with inline source citations, not from training data.
- **Source citation.** Every tip card now carries a `source_url` and `source_published_at`. Stale tips become discoverable.

---

## 2. Problem Statement

### The Gap
- AI tools ship new features weekly, but adoption among non-technical workers is shallow.
- News articles describe *what* AI can do, not *how to use it on a specific task this morning*.
- Free vs. paid tier confusion: users don't know what their tools can actually do.
- Generic prompt libraries don't account for role context.
- **(New in v1.1)** Any AI-generated daily product without a grounded ingestion layer is vulnerable to fabricated headlines — a credibility risk for a tool whose core promise is "translate the news."

### The User Pain
- "I see Copilot got a new feature but I don't know if I have it or how to use it."
- "I'd like to use ChatGPT more at work but I don't know what to type."
- "I tried a prompt I saw on LinkedIn and it didn't fit what I do."
- "I read your tip yesterday and the feature it described doesn't exist." *(v1.0 risk; v1.1 mitigates)*

### The Opportunity
A focused, daily, role-aware utility that turns real AI capability releases into immediate, applied workflow change — with the source receipts to prove it.

---

## 3. Goals & Success Metrics

### Primary Goals (v1.1)
1. Deliver at least **5 high-quality, copy-paste-ready tips per day**, each anchored to a real source published in the last 72 hours.
2. Allow any visitor to translate an AI article (URL or text) or question into role-relevant tips in under **30 seconds**.
3. Give signed-up users a personal library of tips they have saved and tried, with source attribution preserved.

### Success Metrics
| Metric | Target (90 days post-launch) |
| --- | --- |
| Daily active visitors | 1,000 |
| Sign-up conversion (visit → account) | 8% |
| Onboarding completion rate | 70% of signups |
| Tips saved per active user / week | 3+ |
| "Tried it" rate on saved tips | 40% |
| Translate / Ask actions per session | 1.5+ |
| **(New)** % of feed tips with source published in last 72h | **≥ 90%** |
| **(New)** Source-link click-through rate | **≥ 15%** |

### Non-Goals (v1.1)
- Real-time streaming ingestion (the daily cron is sufficient).
- Team / multi-seat workspaces.
- Mobile native apps.
- Browser extensions.
- Public sharing / social feed.
- Paid subscription tier.

---

## 4. Target Users

### Primary Persona: "AI-Curious Knowledge Worker"
Marketers, salespeople, managers, HR, finance, ops, teachers. Has access to at least one AI tool (often via employer). Uses AI 1–3x per week. Reads AI news headlines but rarely acts on them. Wants concrete, fast wins.

### Secondary Persona: "AI Power User Looking for Inspiration"
Already uses AI daily. Wants new prompts and patterns. Builds a personal prompt collection in the Library.

### Out of Scope for v1.1
- Developers building AI products.
- Children / consumer leisure use cases.

---

## 5. Product Principles

1. **Practical over impressive.** Every tip must answer "what do I paste, where, and what happens?"
2. **Role-aware by default.** A finance manager and a teacher should see different tips for the same news item.
3. **Tool-honest.** Never suggest a feature the user's tier doesn't have. Tag every tip with the tools it works on.
4. **Fast to value.** Logged-out visitors see tips on the homepage immediately. No gating before value.
5. **Calm, professional UI.** This is a Monday-morning utility, not a hype machine.
6. **(New) Source-anchored.** Every tip cites the article that motivated it. No tip ships without a `source_url` and a publication date.

---

## 6. Feature Scope (v1.1)

### 6.1 Today's Feed (Homepage `/`)

**Description:** Auto-generated daily collection of 5–6 AI news items, each translated into a tip card. **Generation is now grounded in real, scraped sources.**

**v1.1 Behaviour:**
1. **06:00 UTC daily** — a Vercel Cron job triggers `lib/ai/daily-feed-job.ts`.
2. The job loads the active source list from `ai_daily_news_sources`.
3. For each source, the **Firecrawl MCP** `scrape` tool fetches the latest blog index page; the job filters items published in the last 72 hours.
4. The top ~12 fresh items are passed to `Firecrawl.scrape` again to fetch full Markdown content.
5. The LLM (`generateText` + structured output) translates each into a tip card, applying editorial rules and the daily-feed system prompt.
6. The 5–6 best tips are written to `ai_daily_feed` and `ai_daily_tips`, with `source_url` and `source_published_at` populated.
7. **Cold-start fallback:** if a visitor lands before 06:00 UTC has run (e.g., new region, missed cron), the request triggers an on-demand generation with the same MCP-grounded path. Cached for 24h afterwards.

**Tip Card Contents:**
- Headline news item (1 line)
- 1-paragraph "what's new" summary
- Title of the actionable tip
- Tools the tip works with (badge tags)
- Roles the tip is most useful for (badge tags)
- Estimated time saved
- **(New)** Source publisher + publication date + permalink to original

**Public — no auth required to read.**

### 6.2 Translate an Article (`/translate`)

**Description:** Paste a URL or full article text → receive 3–5 personalised tips.

**v1.1 Inputs:**
- URL (now fetched via **Firecrawl MCP** `scrape` for clean Markdown, JS rendering, and paywall handling where permitted) **OR** raw article text.
- Optional override of role / tools (defaults from user profile if logged in).

**Fetch order on URL submission:**
1. **Firecrawl** scrape with `formats: ["markdown"]`, timeout 15s.
2. On Firecrawl failure (hard paywall, 4xx, timeout): show a friendly banner "We couldn't read this URL — paste the article text below" and reveal the textarea.

**Output:**
- 3–5 tip cards in the standard format.
- If logged in, results are saved to `ai_daily_history` with the `source_url` preserved.

**Public — no auth required.**

### 6.3 Ask a Question (`/ask`)

**Description:** Free-form question input → AI returns relevant, **search-grounded** tips.

**v1.1 Behaviour:**
1. User submits a question (e.g., "How do I summarise meetings in ChatGPT Free?").
2. The route calls **Tavily MCP** `search` with `search_depth: "advanced"`, `max_results: 5`, `topic: "general"`, `include_answer: true`.
3. The top results (with their snippets) are injected into the LLM prompt as grounded context.
4. The LLM produces tips that cite specific search results in `source_url`.
5. Saved to history when logged in.

**Examples shown as clickable chips:**
- "How can I use Copilot in Excel as a finance manager?"
- "What's the best way to summarise meetings in ChatGPT Free?"
- "How do I use Gemini for lesson planning?"

**Public — no auth required.**

### 6.4 Onboarding (`/onboarding`)

Unchanged from v1.0. 3-step setup: Role → AI tools → Skill level. Stored in `ai_daily_profiles`.

### 6.5 Library (`/library`, auth-protected)

Unchanged from v1.0 in structure. Tip cards now display the source citation in the saved view.

### 6.6 Tip Detail (`/tips/[id]`)

Unchanged from v1.0 in structure. Adds a "Read original article" link to `source_url` and a publication-date stamp. If `source_published_at` is older than 90 days, a soft "This tip references an older article — features may have changed" badge appears.

### 6.7 Authentication

Unchanged from v1.0. Email + password via Supabase Auth.

---

## 7. Tip Anatomy (Editorial Spec)

Every tip the AI generates **must** include:

| Field | Description | Example |
| --- | --- | --- |
| `news_headline` | The short news item that motivated the tip. | "ChatGPT now supports persistent memory across chats" |
| `summary` | 1-2 sentence plain-English explanation. | "ChatGPT can now remember your role and preferences between sessions, so you don't have to re-explain context every time." |
| `tip_title` | Action-oriented title. | "Tell ChatGPT once who you are, save 5 minutes per chat" |
| `scenario` | Real workplace situation. | "You're a Marketing Manager who writes 10 emails per week. Each time you have to explain your tone and audience." |
| `before` | Manual / pre-AI workflow. | "Re-explain audience and tone in every chat. ~5 min lost per email." |
| `after` | AI-assisted workflow with the new tip. | "Save audience profile to memory once. Future drafts arrive in your tone instantly." |
| `prompt` | Copy-paste-ready, with `[PLACEHOLDERS]`. | `Remember: I'm a Marketing Manager at [COMPANY]. Our audience is [AUDIENCE]. Our tone is [TONE]. Apply these to all future drafts.` |
| `tools` | Array of tool slugs the tip works on. | `["chatgpt_plus", "chatgpt_free"]` |
| `roles` | Array of relevant role slugs. | `["marketing", "sales"]` |
| `time_saved_minutes` | Realistic estimate. | `5` |
| **(New)** `source_url` | Permalink to the article that motivated the tip. Required. | `https://openai.com/blog/chatgpt-memory` |
| **(New)** `source_publisher` | Name of the publisher (e.g., "OpenAI Blog"). | `"OpenAI Blog"` |
| **(New)** `source_published_at` | ISO 8601 publication date. Required. | `"2026-04-23T15:00:00Z"` |

### Editorial Rules (enforced in the system prompt)
- Copy-paste prompts must use `[BRACKETED]` placeholders for any user-specific input.
- No jargon ("LLM", "context window", "RAG") in user-facing copy.
- Never recommend a feature that requires a paid tier the user does not own.
- Time savings must be realistic (1–30 minutes), not "10x productivity."
- Scenarios must be concrete and grounded in everyday office tasks.
- **(New) Every tip must cite a real source. If the source's claim is ambiguous, drop the tip rather than fabricating specifics.**
- **(New) Do not invent product features. If grounded context doesn't confirm a feature exists at the user's tier, do not suggest it.**

---

## 8. Technical Architecture

### 8.1 Stack
- **Framework:** Next.js 16 (App Router, RSC, Server Actions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Auth & DB:** Supabase (Postgres + Auth + RLS)
- **AI:** AI SDK 6 with default Vercel AI Gateway, model `openai/gpt-5-mini`
- **(New) Ingestion MCPs:** Firecrawl MCP (`https://mcp.firecrawl.dev/v1/sse`), Tavily MCP (`https://mcp.tavily.com/sse`)
- **Hosting:** Vercel (Cron enabled)

### 8.2 Database Schema

All tables namespaced with `ai_daily_` prefix.

| Table | Purpose | RLS |
| --- | --- | --- |
| `ai_daily_profiles` | One row per user — role, tools, skill level. FK to `auth.users`. | User can only read/write own row. |
| `ai_daily_feed` | One row per day — cached generated feed. | Public read. |
| `ai_daily_tips` | All tips ever generated (feed, translate, ask). Now includes `source_url`, `source_publisher`, `source_published_at`. | Public read for `source = 'feed'`; owner-only otherwise. |
| `ai_daily_saves` | Join table: user ↔ saved tip, "tried it" flag. | User-owned. |
| `ai_daily_history` | User's translate/ask requests. Now stores the resolved `source_url` for translate. | User-owned. |
| **(New)** `ai_daily_news_sources` | Registry of vendor blogs scraped daily. Columns: `slug`, `name`, `index_url`, `category` (`vendor` / `analyst` / `community`), `is_active`, `last_scraped_at`. | Admin-only write; service-role read. |

A trigger `on_auth_user_created` auto-creates a profile row on signup.

### 8.3 API Routes

| Route | Method | Purpose | MCP used |
| --- | --- | --- | --- |
| `/api/translate` | POST | Generate tips from URL/text | Firecrawl (URL path only) |
| `/api/ask` | POST | Generate tips from a question | Tavily |
| `/api/save` | POST / DELETE | Save / unsave a tip, toggle "tried it" | — |
| **(New)** `/api/cron/daily-feed` | GET (Vercel Cron) | Trigger daily feed generation at 06:00 UTC | Firecrawl |

### 8.4 AI Generation Layer (`lib/ai/generate.ts`)
- Uses `generateText` + `Output.object()` with a Zod schema enforcing the Tip Anatomy (now including the three source fields, all required).
- Three prompt variants: `generateDailyFeed`, `translateFromArticle`, `askFromQuestion`.
- Single source-of-truth system prompt with editorial rules.
- All schema fields are required (`nullable` instead of `optional` for OpenAI strict mode compatibility).
- **(New)** Each variant receives a `groundedContext` string parameter — the assembled scraped/searched content that the LLM must translate from. The system prompt forbids generating tips outside this context.

### 8.5 (New) MCP Integration Layer (`lib/mcp/`)

**Files:**
- `lib/mcp/firecrawl.ts` — thin wrapper around AI SDK 6's `experimental_createMCPClient`, exposing two helpers: `scrapeUrl(url)` and `scrapeMany(urls[])`.
- `lib/mcp/tavily.ts` — thin wrapper exposing `search(query, opts)`.
- `lib/mcp/index.ts` — re-exports + shared error types (`McpFetchError`, `McpTimeoutError`).

**Connection model:**
- MCP clients are instantiated **per-request** (not pooled), to keep edge-runtime compatibility and avoid stale-session bugs.
- All MCP calls are wrapped in a 15-second timeout. Failures are caught and logged to `ai_daily_history.error_log` (translate/ask) or to the cron run record (feed).

**Why MCP and not direct API calls?** Two reasons. First, AI SDK 6 has first-class MCP tool integration — wiring Firecrawl/Tavily as MCP tools means the LLM can call them inside `generateText` if we ever want fully agentic flows (deferred to v2). Second, swapping providers later (e.g., Bright Data for Firecrawl, Exa for Tavily) is a one-line change.

**Firecrawl scrape config:**
```ts
{
  formats: ["markdown"],
  onlyMainContent: true,
  timeout: 15000,
  // For paywalled sources, set to 'stealth' where ToS permits
  proxy: "basic",
}
```

**Tavily search config:**
```ts
{
  search_depth: "advanced",
  max_results: 5,
  topic: "general",
  include_answer: true,
  include_raw_content: false,
  days: 30, // bias toward recent results for /ask
}
```

### 8.6 (New) Daily Feed Job (`lib/ai/daily-feed-job.ts`)

Runs at `0 6 * * *` UTC via `vercel.json` cron config.

**Pseudocode:**
```ts
async function runDailyFeed() {
  const sources = await getActiveSources();          // ai_daily_news_sources
  const indexPages = await firecrawl.scrapeMany(
    sources.map(s => s.index_url)
  );

  const recentItems = parseRecentLinks(indexPages, { withinHours: 72 });
  const articles = await firecrawl.scrapeMany(
    recentItems.slice(0, 12).map(i => i.url)
  );

  const tips = await generateDailyFeed({
    groundedContext: articles,
    targetCount: 6,
  });

  await persistFeed(tips);
}
```

### 8.7 Personalization Pipeline
1. User completes onboarding → `ai_daily_profiles` updated.
2. On every Translate / Ask / Tip-detail request, the route reads the user's profile.
3. Role + tools are injected into the AI system prompt.
4. Tools that the user does not own are explicitly excluded from suggestions.
5. **(New)** Tip recommendations on the feed are re-ranked client-side by overlap of user role/tools — no extra MCP calls needed.

### 8.8 Auth Flow

Unchanged from v1.0.

---

## 9. Design System

Unchanged from v1.0. Adds:
- **Source citation row** on every tip card: small caps publisher name + relative date ("OpenAI Blog · 2 days ago"), linking to `source_url` with `target="_blank" rel="noopener"`.
- **Stale-source badge** on Tip Detail when `source_published_at` is older than 90 days.

---

## 10. User Journeys

Journeys A, B, C from v1.0 unchanged. One new journey:

### Journey D: Skeptic Verifying a Tip
1. Reads a tip on the homepage that says "Copilot now supports X."
2. Notices the citation row: "Microsoft 365 Blog · 1 day ago."
3. Clicks the source link → lands on the original Microsoft post.
4. Confirms the feature is real, returns, copies the prompt with confidence.

This journey is the entire reason v1.1 exists.

---

## 11. Risks & Mitigations

| Risk | Mitigation | v1.1 status |
| --- | --- | --- |
| ~~AI generates inaccurate tier claims~~ | ~~Strong editorial rules + manual review~~ | **Largely resolved** by grounded context. Editorial rules retained as belt-and-braces. |
| ~~Cold-start latency on first daily visitor~~ | ~~24h caching~~ | **Resolved** — Vercel Cron at 06:00 UTC. 24h cache retained as fallback. |
| Generic / repetitive tips over time. | Track recently-used news topics in `ai_daily_feed`, prompt to avoid repeats. | Carried forward. |
| ~~Article scraping fails on paywalls~~ | ~~Fall back to user-pasted text~~ | **Largely resolved** — Firecrawl handles JS-rendered + many paywall types. Manual paste retained as final fallback. |
| RLS misconfiguration leaks user history. | Schema reviewed; all user-owned tables have `auth.uid() = user_id` policies. | Carried forward. |
| AI Gateway rate limit. | Cache feed; rate-limit per-IP on `/api/ask` and `/api/translate`. | Per-IP rate limit promoted to v1.1 (was v1.1 already). |
| **(New)** Firecrawl/Tavily MCP downtime breaks the feed. | (a) Each MCP call is timeout-wrapped (15s); (b) on `/translate` and `/ask`, failure is surfaced gracefully to the user; (c) the daily feed cron retries up to 2 times with 5-min spacing; (d) if all retries fail, yesterday's cached feed continues to serve. |
| **(New)** Vendor blog scrape ToS / robots.txt. | Source registry is curated to public, scrape-permitted vendor blogs only (OpenAI, Microsoft, Anthropic, Google, Perplexity official channels). User-submitted URLs on `/translate` are scraped per-request, on the user's behalf. |
| **(New)** Firecrawl / Tavily cost spikes. | Daily feed = ~12 Firecrawl scrapes/day = bounded cost. `/ask` = 1 Tavily search per call, rate-limited per IP. Budget alerts configured in Firecrawl/Tavily dashboards. |

---

## 12. Roadmap

### v1.1 (This spec — ships in 2 weeks)
- **Firecrawl MCP** integration for daily feed + `/translate` URL fetch.
- **Tavily MCP** integration for `/ask` grounding.
- `ai_daily_news_sources` registry table + 8 seeded sources.
- Vercel Cron at 06:00 UTC for daily feed.
- Source citation fields on all tips.
- Per-IP rate limiting on `/api/ask` and `/api/translate`.
- Email digest (weekly top 5 tips for your role).

### v1.2 (Next 8 weeks)
- "Tried it" with optional rating + notes.
- Admin moderation panel for feed items + source registry.
- Share-tip public OG images.
- Browser extension for one-click "Translate this page".
- Move feed generation to background queue (Inngest or Trigger.dev) to remove cron latency from edge.

### v2.0 (Q3 2026)
- Team workspaces with shared libraries.
- Custom org prompts (legal / brand voice presets).
- Slack & Teams integrations to push the daily digest into channels (via their respective MCP servers).
- Paid Pro tier ($9/mo) — unlimited translations, team library, custom roles, custom source registry per team.
- Optional agentic flow: LLM calls Firecrawl/Tavily as tools mid-generation, deepening on a topic when the first read is thin.

---

## 13. Open Questions

1. Should we display "tier required" copy on tips even when the user has the tier (for educational purposes)? **Decision needed.**
2. Long-term, do we want user-generated tips (community)? Risk of quality dilution. **Defer to v2.**
3. Localisation — English-only at launch. When do non-English markets get prioritised? **Track demand.**
4. **(New)** Should the daily feed include analyst commentary (Stratechery, Ben's Bites, etc.) alongside vendor blogs, or stay vendor-only for v1.1? **Recommend vendor-only for launch; revisit after 30 days of usage.**

---

## 14. Appendix

### 14.1 Supported AI Tools (v1.1)
- `copilot_free` — Microsoft Copilot Free (web, copilot.microsoft.com)
- `copilot_pro` — Microsoft Copilot Pro / M365 Copilot
- `chatgpt_free` — ChatGPT Free
- `chatgpt_plus` — ChatGPT Plus / Pro
- `gemini_free` — Google Gemini Free
- `gemini_advanced` — Google Gemini Advanced
- `claude_free` — Claude Free
- `claude_pro` — Claude Pro
- `perplexity_free` — Perplexity Free
- `perplexity_pro` — Perplexity Pro

### 14.2 Supported Roles (v1.1)
Marketing, Sales, Management, Engineering, Education, Human Resources, Finance, Operations, Customer Support, Other.

### 14.3 (New) Seeded News Source Registry (v1.1 launch)

Inserted into `ai_daily_news_sources` at deploy time. All public, scrape-permitted vendor channels.

| slug | name | index_url | category |
| --- | --- | --- | --- |
| `openai_blog` | OpenAI Blog | `https://openai.com/news/` | vendor |
| `anthropic_news` | Anthropic News | `https://www.anthropic.com/news` | vendor |
| `google_workspace` | Google Workspace Updates | `https://workspaceupdates.googleblog.com/` | vendor |
| `microsoft_365` | Microsoft 365 Blog | `https://www.microsoft.com/en-us/microsoft-365/blog/` | vendor |
| `microsoft_copilot` | Microsoft Copilot Blog | `https://blogs.microsoft.com/blog/category/ai/` | vendor |
| `gemini_blog` | Google Gemini Blog | `https://blog.google/products/gemini/` | vendor |
| `perplexity_blog` | Perplexity Blog | `https://www.perplexity.ai/hub/blog` | vendor |
| `m365_roadmap` | Microsoft 365 Roadmap (Copilot filter) | `https://www.microsoft.com/en-us/microsoft-365/roadmap?filters=&searchterms=copilot` | vendor |

### 14.4 (New) Environment Variables (additions)

```
FIRECRAWL_API_KEY=fc-...
FIRECRAWL_MCP_URL=https://mcp.firecrawl.dev/v1/sse
TAVILY_API_KEY=tvly-...
TAVILY_MCP_URL=https://mcp.tavily.com/sse
CRON_SECRET=...                    # Vercel Cron auth
DAILY_FEED_TARGET_COUNT=6
SOURCE_FRESHNESS_HOURS=72
```

### 14.5 File Structure (key paths, v1.1)
```
app/
  page.tsx                          # Today's feed
  translate/page.tsx
  ask/page.tsx
  library/page.tsx
  onboarding/page.tsx
  tips/[id]/page.tsx
  auth/
    login, sign-up, sign-up-success, error, callback, sign-out
  api/
    translate/route.ts              # uses Firecrawl
    ask/route.ts                    # uses Tavily
    save/route.ts
    cron/
      daily-feed/route.ts           # NEW: cron entry, uses Firecrawl
components/
  site-header.tsx, site-footer.tsx, user-menu.tsx
  tip-card.tsx                      # updated: shows source citation
  copy-button.tsx, save-button.tsx
  translate-form.tsx, ask-form.tsx, onboarding-form.tsx
  source-citation.tsx               # NEW: shared citation chip
lib/
  constants.ts                      # Tools + roles registry
  ai/
    generate.ts                     # accepts groundedContext
    daily-feed-job.ts               # NEW: orchestrates the cron run
  mcp/                              # NEW
    firecrawl.ts
    tavily.ts
    index.ts
  supabase/
    client.ts, server.ts, service.ts, proxy.ts
scripts/
  100_create_ai_daily_schema.sql
  110_add_source_fields.sql         # NEW: source_url, source_publisher, source_published_at
  120_create_news_sources.sql       # NEW: ai_daily_news_sources + seed data
docs/
  PRD-ai-daily-2026-04-25-1430.md         # v1.0 (shipped)
  PRD-ai-daily-v1.1-mcp-2026-04-25.md     # this file
vercel.json                         # NEW or updated: cron schedule
```

### 14.6 (New) `vercel.json` cron entry

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-feed",
      "schedule": "0 6 * * *"
    }
  ]
}
```

---

## 15. (New) Implementation Notes

### Order of work (recommended for v0.dev / v1.1 build)
1. **Schema first.** Run `110_add_source_fields.sql` and `120_create_news_sources.sql`. Seed the 8 sources.
2. **MCP wrappers second.** Build `lib/mcp/firecrawl.ts` and `lib/mcp/tavily.ts` with hard-coded test calls. Verify connectivity outside the AI flow.
3. **`/translate` first.** Easiest end-to-end test: paste a known URL, get clean Markdown back via Firecrawl, confirm the LLM produces a tip with a real `source_url`.
4. **`/ask` second.** Wire Tavily, confirm grounded answers cite real URLs.
5. **Daily feed last.** This is the highest-stakes path because cron failures are silent. Test by manually hitting `/api/cron/daily-feed` with `Authorization: Bearer $CRON_SECRET` for a week before relying on the schedule.

### What to verify before shipping
- Source citations render on every tip card.
- Stale-source badge appears for `source_published_at` > 90 days.
- Firecrawl timeout produces a graceful error on `/translate`.
- Tavily timeout produces a graceful error on `/ask`.
- Cron failure does not poison the cache — yesterday's feed continues to serve.

---

**End of PRD v1.1**
