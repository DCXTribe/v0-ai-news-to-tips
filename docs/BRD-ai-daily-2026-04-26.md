# Business Requirements Document — AI Daily

**Document version:** 1.0
**Date:** April 26, 2026
**Status:** Current build (production candidate)
**Owner:** Product
**Repository:** `DCXTribe/v0-ai-news-to-tips`

---

## 1. Executive summary

AI Daily is a web product that turns each morning's news from official AI vendor blogs (OpenAI, Microsoft, Google, Anthropic, Perplexity, Moonshot AI, Alibaba, DeepSeek) into role-specific, copy-paste-ready tips that knowledge workers can apply in the next 10–20 minutes. Where most AI newsletters describe what shipped, AI Daily prescribes exactly what to do with it — with the source linked on every tip.

The product is built around three on-demand utilities (Unpack, Advisor, Ask) on top of a daily curated feed (Today) and a personal saved library (Library). All four authenticated surfaces are personalized by three signals captured during onboarding: **role**, **toolkit** (which AI products the user has access to), and **skill level**.

This BRD describes the current state of the product as of April 26, 2026, including everything shipped to date, the operating constraints, and the success criteria the team is currently optimizing against.

---

## 2. Project scope

### 2.1 In scope

1. **Today feed** — A daily edition of 5–8 tips drawn from the previous day's official AI vendor posts, published overnight by a scheduled cron and cached for fast first-paint. Filterable by category, searchable by keyword, with a personalization banner on the authenticated `/today` route.
2. **Unpack** — Paste a URL or article text, get 3–5 actionable tips with a one-line summary and copy-paste prompts. Uses Firecrawl (MCP) to scrape clean article content and a tuned LLM prompt to extract action-oriented tips.
3. **Advisor** — Describe a task in one line, get a "Best pick / Alternatives / Avoid" recommendation drawn only from the user's configured toolkit, with a copy-paste prompt for the recommended tool and source citations for tradeoff claims.
4. **Ask** — Open-ended question composer with an optional YouTube-walkthroughs toggle. Uses Tavily web search (MCP) to ground every tip in cited, real-time web sources.
5. **Library** — Saved-tip playbook with usage estimates, time-savings rollup, top-tool surface, and per-tip detail views. Saved tips link back to the original news source and to a tip detail page with the full prompt.
6. **Authentication** — Supabase Auth (email + password, password reset) gating personalization, save, and history.
7. **Onboarding** — Role + toolkit + skill-level capture at first login; revisitable from `/profile` or `/onboarding`.
8. **Anonymous trial** — Unsigned visitors get one free use of each of Unpack, Advisor, and Ask per rolling 7-day window, gated by an HTTP-only cookie.
9. **Tip persistence** — Logged-in user generations (Unpack/Advisor/Ask outputs) are stored in `ai_daily_tip_history`; saved tips live in `ai_daily_saved_tips` with linked metadata.
10. **Mobile-first responsive UI** — Bottom tab bar for the five primary post-login surfaces; condensed footer for authenticated users; full marketing footer for anonymous visitors.

### 2.2 Out of scope (this version)

1. Native iOS/Android apps.
2. Team accounts, shared libraries, or any multi-tenant org concept.
3. Paid subscription tiers, billing, or Stripe integration.
4. Direct integrations with the AI vendor APIs themselves (we read their public blogs and ground via web search; we do not call vendor models on the user's behalf to perform tasks).
5. User-generated content visible to other users (no comments, no public sharing).
6. Languages other than English.
7. SOC 2 / HIPAA / GDPR data-residency commitments beyond Vercel + Supabase defaults.

### 2.3 Assumptions

- Users have access to at least one major AI product (ChatGPT, Copilot, Gemini, Claude, Perplexity, Kimi, DeepSeek, or Qwen) and the time to copy a prompt into it.
- AI vendor blogs remain public, scrape-friendly, and updated at roughly the cadence observed during the prototype period.
- The Vercel AI Gateway, Firecrawl MCP, and Tavily MCP remain available and within the cost envelope assumed in section 8.

### 2.4 Dependencies

- **Vercel** — hosting, edge runtime, scheduled cron.
- **Supabase** — Postgres, Auth, RLS-enforced data layer.
- **Vercel AI Gateway** — LLM inference (default model selected per route, see `lib/ai/generate.ts`).
- **Firecrawl MCP** — HTML-to-markdown article scraping for Unpack.
- **Tavily MCP** — real-time grounded web search for Ask and Advisor.

---

## 3. Stakeholders

| Stakeholder | Interest | Decision authority |
|---|---|---|
| Product owner | Defines roadmap, accepts releases | Final on scope and prioritization |
| Engineering | Builds, owns infra cost and reliability | Final on technical approach |
| Design | Owns information architecture, visual system | Final on UX and brand |
| Content / Editorial | Owns the daily feed quality and source whitelist | Final on which sources are scraped |
| End users — knowledge workers | The audience the product serves | Influence via in-product feedback and analytics |
| Partner brands (AI vendors) | Their blog content is the input; we cite them | None (we only consume public content) |

---

## 4. Target audience

### 4.1 Primary persona — "The catch-up professional"

Knowledge workers in roles where AI fluency is now table-stakes: marketers, salespeople, managers, founders, designers, product managers, operations and customer-support leads. They feel they are falling behind on AI, follow a few newsletters, but cannot translate "OpenAI shipped X" into "here is what I do at 9 AM Monday." They have access to one or two paid AI tools and want to extract more value per minute spent.

**Day-in-the-life trigger:** opening laptop with coffee, 5–10 minutes before the first meeting, wanting one thing they can try today.

### 4.2 Secondary persona — "The on-demand operator"

People who arrive at the site mid-task with a specific question ("Which AI is best for sales email rewriting given that I have ChatGPT Plus and Claude Pro?") or a specific article they want to act on ("My boss sent me this Anthropic post — what does it mean for me?"). They use the on-demand utilities (Advisor, Unpack, Ask) more than the daily feed.

### 4.3 Tertiary persona — "The curious anonymous"

Visitors who land via search or social and are evaluating whether the product is for them. The free anonymous trial (one use per feature per 7 days) is designed for this segment. Conversion target is sign-up after the first successful generation.

### 4.4 Out-of-audience

- AI engineers / ML researchers (the tips are pragmatic, not technical).
- Enterprise procurement leads (no team or admin features in this version).
- Users who want AI to do the work for them via API automation (we deliver prompts, not actions).

---

## 5. Goals and success criteria

### 5.1 Business goals

| Goal | Measurement | 90-day target |
|---|---|---|
| Build a daily-habit product, not a newsletter | DAU / MAU ratio | ≥ 0.30 by day 90 |
| Convert anonymous trial to signed-up user | Sign-up rate after first successful generation | ≥ 25% |
| Make personalization the moat | % of authenticated sessions where role + toolkit are both set | ≥ 80% |
| Prove "tips are usable, not aspirational" | Saves per active user per week | ≥ 3 |

### 5.2 Product goals

1. **Time to first value < 60 seconds** on the marketing landing page — visitor sees today's tips above the fold without scrolling past hero copy.
2. **Every claim grounded.** No tip ships without a source link (vendor blog for Unpack/Today; web citations for Ask; tradeoff citations for Advisor).
3. **Toolkit-aware recommendations.** Advisor never recommends a tool the user does not have access to.
4. **Mobile parity.** Every primary surface ships with a touch-target-compliant layout and bottom-nav navigation; no feature is desktop-only.

### 5.3 Non-goals

- Maximizing time-on-site. We optimize for users leaving quickly *with a saved prompt*.
- Generating "thought leadership" content. We extract from official sources; we do not editorialize.

---

## 6. Functional requirements

Functional requirements are grouped by surface. Each requirement is uniquely numbered for traceability.

### 6.1 Marketing landing (`/`)

- **FR-LAND-01.** Anonymous users land on a hero with today's edition badge, a tagline, and three CTAs (See today's tips, Pick a tool, Ask a question).
- **FR-LAND-02.** Authenticated users are server-side redirected from `/` to `/today`.
- **FR-LAND-03.** A "Today's tips" feed grid renders inline below the hero so the value of the product is visible without sign-up.
- **FR-LAND-04.** A four-card CTA strip surfaces Unpack, Advisor (flagged as flagship), Ask, and Library.

### 6.2 Today (`/today` for auth, `/` for anon)

- **FR-TODAY-01.** Display today's edition (or the most recent edition if today's hasn't published yet, with a clear date label).
- **FR-TODAY-02.** Authenticated users see a "Tuned for you" personalization banner showing role, skill, and toolkit count, with an Edit link.
- **FR-TODAY-03.** Provide keyword search across tip headline, body, and prompt.
- **FR-TODAY-04.** Provide category filter chips with counts (All, Best practice, New feature, Industry, etc.); chips horizontally scroll on mobile.
- **FR-TODAY-05.** Each tip card shows source vendor, category, time-saved estimate when available, and a Save action for authenticated users.
- **FR-TODAY-06.** Saved state persists across sessions and reflects in real time on Save / Unsave actions.

### 6.3 Unpack (`/unpack`)

- **FR-UNPACK-01.** Accept either a URL (preferred) or pasted article text.
- **FR-UNPACK-02.** When given a URL, scrape via Firecrawl MCP and extract title, publisher, and clean body content.
- **FR-UNPACK-03.** Generate 3–5 tips plus a one-line summary, each tip carrying a copy-paste prompt and time-saved estimate when inferable.
- **FR-UNPACK-04.** Render a source verification card above the summary on success so the user can confirm the right article was scraped.
- **FR-UNPACK-05.** Anonymous users may run Unpack once per rolling 7-day window; logged-in users have no quota.
- **FR-UNPACK-06.** Logged-in user runs are persisted to `ai_daily_tip_history`.

### 6.4 Advisor (`/advisor`)

- **FR-ADVISOR-01.** Capture a one-line task description and an optional category from a tabbed sample list (Writing, Research, Analysis, Creative, Productivity).
- **FR-ADVISOR-02.** Show a visible "Choosing from (N)" toolkit chip strip listing the user's configured tools.
- **FR-ADVISOR-03.** Show a "Tailored for: <role>" badge when the user has a role configured.
- **FR-ADVISOR-04.** Generate a recommendation with three sections: Best pick (with prompt), Alternatives (with "when to use" guidance), and Avoid (with reasons and source citations).
- **FR-ADVISOR-05.** Recommendations must be drawn only from the user's configured toolkit; if the toolkit is empty, fall back to all major tools and disclose the fallback.
- **FR-ADVISOR-06.** Anonymous users may run Advisor once per rolling 7-day window.

### 6.5 Ask (`/ask`)

- **FR-ASK-01.** Accept an open-ended question via textarea with topic-chip prefills (the chips prefill question stems, not full questions).
- **FR-ASK-02.** Provide a prominent "Include YouTube walkthroughs" toggle near the top of the composer.
- **FR-ASK-03.** Use Tavily web search to ground the answer in real-time citations; every tip carries at least one source URL.
- **FR-ASK-04.** Show a "real-time sources" cue strip (Live web · Cited · Videos) above the composer differentiating Ask from Unpack and Advisor.
- **FR-ASK-05.** Anonymous users may run Ask once per rolling 7-day window.

### 6.6 Library (`/library`)

- **FR-LIB-01.** Show four KPI cards: total time saved across saved tips with estimates, projected monthly savings, total saved tips, and top-used tool.
- **FR-LIB-02.** Surface three primary actions inline (Advisor, Unpack, Ask) sized to a 44px minimum touch target on mobile.
- **FR-LIB-03.** Provide a list of saved tips with copy-prompt action, unsave action, and link to the source article.
- **FR-LIB-04.** Provide a generation history view at `/library/history/[id]` showing the full original generation a saved tip came from.

### 6.7 Authentication and onboarding

- **FR-AUTH-01.** Email + password sign-up and login backed by Supabase Auth.
- **FR-AUTH-02.** Forgot-password and reset-password flows.
- **FR-AUTH-03.** Onboarding captures role (single select), toolkit (multi-select grouped by Western / Asia-Pacific), and skill level (Beginner / Intermediate / Power user).
- **FR-AUTH-04.** Onboarding is revisitable from `/profile`; partial submissions are allowed.

### 6.8 Personalization

- **FR-PERS-01.** Today's feed copy and tip ordering give precedence to tips matching the user's role and toolkit.
- **FR-PERS-02.** Unpack, Advisor, and Ask all read role + toolkit + skill level on each request and inject them into the LLM prompt.
- **FR-PERS-03.** The Today personalization banner and Edit Preferences (in `/profile`) are the two surfaces from which a user can change personalization.

### 6.9 Anonymous trial system

- **FR-ANON-01.** A single HTTP-only cookie (`ai_daily_anon_usage`) tracks per-feature usage for unsigned visitors.
- **FR-ANON-02.** Each of Unpack, Advisor, Ask gets one free use per rolling 7-day window from first use.
- **FR-ANON-03.** Quota check runs before any expensive work (scrape, LLM, web search); a 429 with `code: "anon_quota_reached"` is returned when exhausted.
- **FR-ANON-04.** Cookie is written only after a successful generation, so transient failures do not burn the user's free use.
- **FR-ANON-05.** Logged-in users bypass the quota entirely.
- **FR-ANON-06.** A badge in each form shows remaining uses; an exhausted-state callout replaces the composer with a sign-up CTA.

### 6.10 Daily feed pipeline

- **FR-FEED-01.** A scheduled job (`/api/cron/daily-feed`) runs overnight in the project's primary region.
- **FR-FEED-02.** The job reads a whitelist of vendor blog URLs, scrapes via Firecrawl, deduplicates by URL, and generates 5–8 tips per edition.
- **FR-FEED-03.** Editions are written to `ai_daily_news_items` and `ai_daily_tips`.
- **FR-FEED-04.** The cached feed reader (`unstable_cache`) is invalidated by tag the moment a new edition is written.

---

## 7. Non-functional requirements

### 7.1 Performance

- **NFR-PERF-01.** Largest Contentful Paint on `/` (anonymous) ≤ 2.5 s on a 4G mobile connection.
- **NFR-PERF-02.** Today feed reads served from cache; cache hit-rate ≥ 95% across a normal day.
- **NFR-PERF-03.** Unpack end-to-end (scrape + LLM) target ≤ 12 s p50, ≤ 25 s p95. `maxDuration = 60`.
- **NFR-PERF-04.** Ask end-to-end (search + LLM) target ≤ 10 s p50, ≤ 20 s p95.
- **NFR-PERF-05.** Advisor end-to-end target ≤ 8 s p50, ≤ 15 s p95.

### 7.2 Reliability

- **NFR-REL-01.** Daily feed cron is idempotent; reruns within the same day deduplicate by URL and do not double-publish.
- **NFR-REL-02.** Anonymous quota cookie is written only after a successful generation.
- **NFR-REL-03.** Each upstream MCP call is wrapped in a timeout and a graceful error path that surfaces a recoverable message to the user.

### 7.3 Security and privacy

- **NFR-SEC-01.** Supabase Row Level Security is enabled on every user-owned table; users can only read and write their own rows.
- **NFR-SEC-02.** Auth uses HTTP-only cookies with the SameSite policy provided by `@supabase/ssr`.
- **NFR-SEC-03.** Secrets (Supabase service role, AI Gateway key, Firecrawl key, Tavily key, cron secret) are stored as Vercel project environment variables and never exposed to the client.
- **NFR-SEC-04.** The cron route checks a header secret (`CRON_SECRET`) before executing; any direct call without the secret returns 401.
- **NFR-SEC-05.** No third-party analytics or trackers ship to anonymous users by default.

### 7.4 Accessibility

- **NFR-A11Y-01.** Mobile touch targets meet the WCAG 44 × 44 px recommendation on all primary actions.
- **NFR-A11Y-02.** All interactive elements have accessible names; icon-only buttons use `aria-label` or `sr-only` text.
- **NFR-A11Y-03.** Color contrast meets WCAG AA on all text.
- **NFR-A11Y-04.** Keyboard navigation reaches every interactive element on every surface.

### 7.5 Responsiveness

- **NFR-RESP-01.** Mobile-first layout. Designed at 375 × 667 first; expands to tablet and desktop.
- **NFR-RESP-02.** A bottom tab bar provides primary navigation on mobile for the five post-login surfaces (Today, Unpack, Advisor, Ask, Library).
- **NFR-RESP-03.** The footer collapses to a single copyright line for authenticated users on mobile (the bottom nav and header user-menu cover everything else).

### 7.6 Observability

- **NFR-OBS-01.** Server logs include structured `[v0]` markers around critical paths (cron run, MCP scrape, MCP search, LLM call) for easy log search.
- **NFR-OBS-02.** Each route handler returns useful error codes (`anon_quota_reached`, etc.) so the client can render appropriate UI.

### 7.7 Maintainability

- **NFR-MAINT-01.** No ORM is used against the Supabase Postgres; SQL migrations live in `/scripts` and are versioned by filename.
- **NFR-MAINT-02.** Tools and roles live in a single source of truth (`lib/constants.ts`); adding a new tool there flows through the entire UI without further changes.
- **NFR-MAINT-03.** All MCP integrations live behind `lib/mcp/*` adapters so swapping providers is a one-file change.

---

## 8. Technical considerations

### 8.1 Stack

- **Framework:** Next.js (App Router), React 19, TypeScript, Tailwind v4.
- **Hosting:** Vercel (Edge + Serverless Functions; `maxDuration = 60` on long-running routes).
- **Database / Auth:** Supabase Postgres + Supabase Auth via `@supabase/ssr`.
- **AI inference:** Vercel AI Gateway (default zero-config providers).
- **MCP integrations:** Firecrawl (scrape), Tavily (search).

### 8.2 Data model (high level)

- `ai_daily_profiles` — one row per auth user; carries `role`, `tools[]`, `skill_level`.
- `ai_daily_news_items` — one row per scraped vendor article; deduplicated by URL.
- `ai_daily_tips` — tips belonging to a news item; carry headline, body, prompt, category, time-saved estimate.
- `ai_daily_saved_tips` — user-tip join table for the saved playbook.
- `ai_daily_tip_history` — full record of a user's Unpack / Ask / Advisor generations.

All user-owned tables enforce RLS keyed on `auth.uid() = user_id`.

### 8.3 Routing

| Path | Purpose | Auth required |
|---|---|---|
| `/` | Marketing landing (redirects authed users to `/today`) | No |
| `/today` | Authenticated daily feed with personalization | Yes |
| `/unpack` | Article-to-tips utility | No (gated) |
| `/advisor` | Toolkit-aware tool recommender | No (gated) |
| `/ask` | Grounded Q&A | No (gated) |
| `/library` | Saved-tip playbook | Yes |
| `/library/history/[id]` | Generation history detail | Yes |
| `/tips/[id]` | Tip detail page | No |
| `/profile` | Edit personalization | Yes |
| `/onboarding` | Capture personalization | Yes |
| `/auth/*` | Auth flows | No |
| `/api/*` | Route handlers | Mixed |

### 8.4 Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `AI_GATEWAY_API_KEY` (only required for non-zero-config providers)
- `FIRECRAWL_API_KEY`
- `TAVILY_API_KEY`
- `CRON_SECRET`

### 8.5 Cost envelope (planning baseline)

- LLM inference dominates cost; expected blended cost-per-generation across Unpack/Ask/Advisor ≤ $0.04.
- Daily feed cron costs ~$0.50 / day (5–8 tips × scrape + summarize).
- Supabase, Vercel, Tavily, Firecrawl all run in their respective free / starter tiers for the launch period.

---

## 9. User journeys

### 9.1 Anonymous → first value → sign-up

1. Visitor lands on `/` from search or social.
2. Sees today's tips inline; clicks one to copy a prompt or clicks a CTA into Unpack/Advisor/Ask.
3. Runs one free generation; sees the result and the badge "1 free use this week — sign up for unlimited."
4. Returns next day, hits the exhausted gate, signs up.
5. Gets redirected through onboarding (role + toolkit + skill); lands on `/today` with a personalization banner.

### 9.2 Returning logged-in habit

1. User opens `/today` with morning coffee.
2. Filters to the category that matches today's task (e.g., "New feature").
3. Saves 1–2 tips into Library.
4. Opens Library at end of week and reviews monthly time-savings rollup; this reinforces habit.

### 9.3 On-demand utility

1. User has a specific task ("Need to rewrite this sales email for tone and length, what should I use?").
2. Opens Advisor, pastes task, sees "Best pick: Claude Pro" with a copy-paste prompt and an "Avoid: ChatGPT for this — too casual on first pass" note with a source link.
3. Saves the tip into Library for next time.

---

## 10. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Vendor blog scraping breaks (HTML changes) | Medium | High | Firecrawl absorbs most parser changes; daily cron failure surfaces in logs and falls back to the previous edition. |
| MCP provider outage (Firecrawl or Tavily) | Low | High | User-visible error message + retry guidance; no silent failure. |
| LLM hallucination on Advisor recommendations | Medium | Medium | All tradeoff claims must cite a source; recommendations restricted to the user's toolkit; prompts bias toward "we don't know" over fabrication. |
| Anonymous quota bypass via cookie clearing | High | Low | Acceptable; the quota is a friction device, not a security measure. Server-side rate limiting can be added if abuse signal appears. |
| Cost overrun on LLM inference | Low | Medium | Quotas, caching, and route-level `maxDuration` ceilings; per-route cost monitored in Vercel observability. |

---

## 11. Timeline and milestones

The product is currently in a private candidate state. The target launch sequence:

| Milestone | Target date | Exit criteria |
|---|---|---|
| **M1 — Internal candidate (today)** | Apr 26, 2026 | All five surfaces functional; daily cron runs reliably for 7 consecutive days; anonymous quotas enforced. |
| **M2 — Private beta** | May 10, 2026 | 25 invited users active; feedback loop wired; first iteration on tip quality based on real-user saves. |
| **M3 — Public soft launch** | May 24, 2026 | `/` open to the web; sign-up active; analytics measuring sign-up rate, DAU/MAU, saves-per-user. |
| **M4 — General availability** | Jun 14, 2026 | Three weeks of stable daily editions; ≥ 25% post-trial sign-up rate; performance NFRs met at p95. |
| **M5 — First post-launch iteration** | Jul 12, 2026 | Decision on first paid tier, team accounts, or expanded source whitelist based on M4 data. |

---

## 12. Acceptance and sign-off

This BRD is accepted when:

1. Functional requirements in §6 each map to a shipped surface or a queued ticket with an owner.
2. Non-functional requirements in §7 are tracked in observability dashboards or a manual review checklist.
3. The risks register in §10 is reviewed at every milestone gate.

| Role | Name | Date |
|---|---|---|
| Product owner | _to be filled_ | |
| Engineering lead | _to be filled_ | |
| Design lead | _to be filled_ | |

---

*End of document.*
