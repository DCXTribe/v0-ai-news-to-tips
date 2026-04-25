# AskZentern v1.2 BRD — Review & Enhancement Notes

**Document version:** 1.0
**Date:** 25 April 2026, 19:15 UTC
**Owner:** v0 / Engineering review
**Companion to:** `BRD-askzentern-v1.2-2026-04-25-1900.md`
**Status:** Review notes — proposed additions to the canonical BRD

---

## 0. Purpose of this document

The v1.2 BRD is strong on positioning, IA, copy, and component anatomy. This companion document catalogs **gaps, risks, and ambiguities** found during a structured engineering and product review. Each finding is paired with a concrete proposed enhancement.

These are not rewrites of what already works — they are additions to harden the spec for the implementation team and de-risk the launch.

**How to use this:**
- Treat each numbered item as a single discussable proposal.
- DCX confirms which to fold back into the canonical BRD as a v1.3 amendment.
- Items can be implemented incrementally during Phases 2–6 without blocking Phase 1 (rebrand).

---

## 1. Overall assessment

| Area | Rating | Notes |
|---|---|---|
| Brand & positioning (§1–§2) | **Strong** | Voice rules and palette are tight; jade accent is well-scoped to Tool Advisor only. |
| Information architecture (§3) | **Strong** | Clear page list, sensible nav. Bottom nav at 5 tabs needs an overflow plan (item 24). |
| Page specifications (§5) | **Mostly strong** | Tool Advisor (§5.4) is well-specced; Playbook search behavior is missing (item 16). |
| Component anatomy (§6) | **Strong** | TipCard variants are precise; YouTube embed UX is clear. |
| Tool Advisor (§7) | **Strong with gaps** | Honesty rules are excellent but edge cases (item 5) and fair-use enforcement (item 23) need detail. |
| Contributor model (§8) | **Strong** | Philosophy is coherent; conversion moments are well-scoped. Stripe webhook resilience missing (item 9). |
| Data model (§10) | **Strong** | Idempotent additions; preserves v1.1 namespace. |
| Build sequence (§12) | **Reasonable** | 10–15 day estimate is realistic for a single operator with all decisions pre-made. Open decisions (§15) could add 2–3 days. |
| Acceptance criteria (§14) | **Tight** | Functional but doesn't specify performance budgets (item 1). |

**Top 5 risks if these gaps are not closed before launch:**

1. **Tool Advisor edge-case failure modes** (item 5) — the flagship feature could embarrass the product on tasks it can't recommend a tool for.
2. **Stripe webhook race conditions** (item 9) — users could pay and not see contributor status, or vice versa.
3. **Confidence-label criteria undefined** (item 6) — the LLM will be inconsistent across tips, undermining the trust surface that the contributor model depends on.
4. **No moderation policy** (item 8) — first malicious prompt becomes a screenshot.
5. **No analytics plan** (item 2) — v1.2 ships with no way to measure whether Tool Advisor is the flagship the BRD claims it is.

---

## 2. Proposed enhancements (numbered)

### Item 1 — Performance budgets (add to §14 Acceptance criteria)

**Gap:** Acceptance criteria are functional only. No performance ceilings.

**Proposed addition:**

```
14.11  Today's Feed home page Largest Contentful Paint < 2.0s on
       Vercel production at the 75th percentile (mobile, 4G).

14.12  Tool Advisor end-to-end response (submit → output card render)
       < 12s at the 90th percentile, < 20s at the 99th percentile.

14.13  Daily cron pipeline completes within the 60s Vercel Hobby
       budget. Source-level failures must not block the run; partial
       success is logged and surfaced on /methodology with the date
       and which sources failed.

14.14  Cumulative Layout Shift on Today's Feed < 0.1.

14.15  Lighthouse mobile accessibility score >= 95 on every public page.
```

---

### Item 2 — Analytics & success metrics (add as new §16)

**Gap:** v1.2 launches three new strategic surfaces (Tool Advisor, Playbook rebrand, Contributor) with no measurement plan. There's no way to validate whether Tool Advisor is the flagship.

**Proposed addition: new §16 "Success metrics for v1.2."**

```
North-star metric:
   Weekly Active Contributors (WAC) — users who used at least
   one of Today / Ask / Unpack / Tool Advisor in the past 7 days
   AND saved at least one tip. Target: 200 WAC by 90 days post-launch.

Tool Advisor adoption:
   - Tool Advisor runs / Total generations across Ask + Unpack + Advisor
   - Target: >= 25% by day 30
   - If < 10% by day 30: rethink homepage promotion

Free → Contributor conversion rate:
   - Sustaining Contributor signups / Active Free Accounts per week
   - Target: 1.5–3% steady state
   - If > 5%: contributor pricing may be too low; if < 0.5%: Free tier
     is too generous or value perception unclear

Activation (sign-up → first save):
   - % of new accounts who save a tip within 7 days
   - Target: >= 60%

Retention:
   - W1, W4, W12 retention (account creation cohort)
   - Targets: 40% / 25% / 15%

Time-saved storytelling:
   - Median "time saved per use" across saved items
   - Tracks credibility of the value claim; should be 25–50 min
   - If skewed by outliers, add cap at 90 min in the LLM output

Tool Advisor honesty signal:
   - Fraction of recommendations that include a populated
     `when_not_to_use` (per §7.5)
   - Target: 100%. If < 100%, a regression in the system prompt.
```

Tooling: PostHog (already in the connected MCPs) for product analytics. Privacy notice (§5.11) needs an addendum acknowledging anonymized event tracking — phrasing already partially covered in §5.11 final paragraph.

---

### Item 3 — Internationalization posture (add to §1 or new §17)

**Gap:** No explicit language strategy. Given the Malaysia origin and the brand's Eastern philosophy lineage, monolingual English will leave value on the table; but full i18n is out of scope for v1.2.

**Proposed addition: explicit statement in §1.**

```
1.6  Language posture for v1.2

   AskZentern v1.2 ships English-only. Copy is written in
   British English to match the indie / non-corporate voice
   ("organisation", "personalised", not "organization", "personalized").

   Code-level i18n hooks (next-intl or equivalent) are NOT installed
   in v1.2 to keep the surface area small. They are deferred to v1.4
   when a second language (Bahasa Malaysia or simplified Chinese,
   based on early-signup geography) is committed.

   Implication: all hard-coded strings can live in components;
   no translation key infrastructure is needed yet.
```

---

### Item 4 — Accessibility requirements (add to §14 or new §18)

**Gap:** No WCAG commitment, no specific a11y patterns for new components.

**Proposed addition:**

```
18. Accessibility requirements

   Target: WCAG 2.2 Level AA across all public pages.

   Specific a11y patterns required for v1.2:

   - Tool Advisor form: every field labeled, single-question-per-step
     not used (it's a single composite form), but each fieldset MUST
     have a `<legend>` (e.g. "About the task", "About you", "About
     the data").

   - YouTube embeds: lazy-loaded poster MUST have descriptive
     alt text ("Microsoft Mechanics video: Copilot in Word —
     summarising long documents") not generic ("YouTube video").
     Embed iframe must have a title attribute.

   - Confidence badges: not communicated through color alone —
     icon + label always paired (the BRD §6.2 already does this; this
     is a hardening rule).

   - Prompt block: copy button must have an aria-live region that
     announces "Prompt copied" to screen readers (don't rely on
     toast alone).

   - Bottom nav: each tab is a link, not a button. Active tab uses
     aria-current="page".

   - Modal CTAs (sign-up modal, contributor CTA modal): focus trap,
     return focus to trigger element on close, ESC closes.

   Keyboard testing: full app must be navigable without a mouse.
   Tab order on Tool Advisor: textarea → desired output → role →
   tools → sensitivity → speed/quality → submit.
```

---

### Item 5 — Tool Advisor edge cases (add to §7 as new §7.7)

**Gap:** §7.5 lists honesty requirements but doesn't say what happens when the input is unanswerable.

**Proposed addition:**

```
7.7  Edge cases & graceful failures

   Tool Advisor must handle these without silent failure:

   A. Task has no AI fit (e.g. "physically lift a box", "drive my
      car to work"). Output must include `recommended_tool: null`
      and a clear human message:

      "This task doesn't have a strong AI tool fit. AI works best
       for text, image, code, and data tasks. Try rephrasing if
       there's a related task you'd like help with — for example,
       'help me schedule the moving company.'"

   B. User has no tools selected and is anonymous. The LLM should
      recommend the most accessible free tool (typically ChatGPT
      Free or Copilot Free) and add a one-line note: "Based on
      free tools — sign up and add your toolkit for personalized
      recommendations."

   C. User selects only tools that don't fit the task (e.g.
      Perplexity Free for image generation). The LLM should
      acknowledge the constraint and recommend the closest fit
      from their toolkit, with a `when_not_to_use` populated to
      explain the tradeoff.

   D. Sensitive data + free-tier tools only. Always populate
      `data_privacy_warning` and recommend the most data-respectful
      option in their toolkit (e.g. Claude Free, which has stronger
      data policies than ChatGPT Free).

   E. Tavily search returns zero relevant results. Fall back to LLM
      knowledge; mark `confidence_label: "Community-reported"`
      and add a one-line caveat: "No fresh source confirmed —
      this is based on the model's general knowledge."

   F. Rate limit reached mid-generation. Save partial state to
      `ai_daily_tool_advisor_runs` with `status: 'incomplete'`;
      surface to user with retry CTA.
```

---

### Item 6 — Confidence label decision rules (add to §5.10 or §6.2)

**Gap:** §5.10 §2 describes the five labels descriptively; the LLM has no decision rule, so labeling will be inconsistent.

**Proposed addition: append to §5.10 §2.**

```
Decision rules for the LLM (system prompt):

- "Official source" — domain matches the registry of vendor blogs
  (openai.com, microsoft.com/.../copilot, anthropic.com,
  google.com/.../gemini, perplexity.ai) OR YouTube channel matches
  registry.

- "Verified vendor" — domain is a vendor-owned property NOT in the
  blog registry (e.g. learn.microsoft.com, developer.openai.com,
  docs.anthropic.com).

- "Trusted publication" — TechCrunch, The Verge, Ars Technica, MIT
  Technology Review, Stratechery, Ben's Bites, Last Week in AI.
  Hard-coded list maintained in /lib/sources/trusted-publications.ts.

- "Community-reported" — Reddit, HN, Twitter/X, personal blogs,
  Substacks not in the trusted list. Always paired with a caveat
  in the source row: "Community-reported — verify before relying."

- "Experimental" — no source URL OR source URL not whitelisted by
  the citation guard. Tip is published only if `feature_flag.allow_experimental == true`.
  In v1.2 launch, this flag is OFF.

If multiple labels could apply, take the highest tier
(Official > Verified > Trusted > Community > Experimental).
```

---

### Item 7 — A/B testing strategy (add as new §19)

**Gap:** No plan for testing copy variants on conversion CTAs, hero, or pricing labels.

**Proposed addition:**

```
19. Experimentation framework

   v1.2 ships with PostHog feature flags. Three planned experiments
   for the first 60 days:

   E1. Hero subhead variant
       Control:  "Three jobs in one. Today's AI news as practical
                tips you can use this morning..."
       Variant:  "Stop guessing which AI to use. Ask AskZentern."
       Metric:   Hero CTA click-through to /tool-advisor.

   E2. Contributor CTA framing on rate-limit
       Control:  "Become a Sustaining Contributor for unlimited
                recommendations — $7/month..."
       Variant:  "Keep the lights on for everyone. $7/month
                gives you unlimited."
       Metric:   Conversion to Stripe checkout.

   E3. Tool Advisor teaser placement on homepage
       Control:  Above-the-fold under hero (per §5.1)
       Variant:  Below the tip grid
       Metric:   /tool-advisor page views from homepage.

   Each experiment runs ≥ 14 days, ≥ 1000 unique visitors per arm,
   95% confidence required to ship the winner. Losing variants
   are documented in /methodology under "What we tried."
```

---

### Item 8 — Moderation & safety policy (add as new §20)

**Gap:** No policy for handling harmful or off-topic prompts on Ask, Unpack, Tool Advisor.

**Proposed addition:**

```
20. Moderation & safety

   AskZentern is a productivity tool. It is NOT a general-purpose
   chatbot. The system prompt must enforce:

   A. Refuse to draft content for malicious purposes (phishing,
      harassment, fraud, illegal activity, weapons, self-harm).
      Refusal copy:

      "AskZentern is built for everyday work tasks. I can't help
       with [category]. Would you like help rephrasing the task
       for a legitimate use case?"

   B. Refuse to give medical, legal, or financial advice.
      Redirect: "For [medical/legal/financial] decisions, AI is
      best used to organize your thoughts before talking to a
      qualified professional, not to replace them."

   C. Refuse to evaluate, hire, fire, surveil, or score real people.
      ("Help me decide which candidate to hire" → polite refusal +
      "AI is great at helping you structure interview questions and
      compare your own notes; it shouldn't make the decision.")

   D. Decline to write code that scrapes, bypasses paywalls, or
      violates terms of service of named platforms.

   Implementation: a pre-LLM moderation classifier (OpenAI's
   moderation endpoint, free) runs on every Ask, Unpack, and Tool
   Advisor input. Flagged inputs are not stored, and the user sees
   the refusal copy above.

   Logging: refused requests are counted (no input text stored)
   for monthly audit. Published in the methodology page transparency
   log.
```

---

### Item 9 — Stripe webhook resilience (add to §10 and §8)

**Gap:** §8 specifies the Contributor flow but doesn't describe what happens when Stripe webhooks fail.

**Proposed addition: append to §10 data model and §8.**

```
10.x  ai_daily_contributions table (expanded)

   Columns:
   - id (uuid pk)
   - user_id (uuid fk → auth.users)
   - tier (enum: 'sustaining', 'founding')
   - stripe_customer_id (text)
   - stripe_subscription_id (text, nullable for founding)
   - stripe_checkout_session_id (text)
   - amount_cents (int)
   - currency (text, 'usd')
   - status (enum: 'pending', 'active', 'past_due', 'canceled',
            'failed_webhook')
   - started_at (timestamptz)
   - ended_at (timestamptz, nullable)
   - last_webhook_at (timestamptz)
   - raw_event (jsonb) — last Stripe event for audit

   Resilience rules:

   1. The Stripe Checkout success URL writes a "pending" row
      immediately on redirect, before any webhook arrives.
   2. The webhook handler upgrades pending → active.
   3. If no webhook arrives within 5 minutes, a Vercel Cron job
      polls the Stripe subscription/payment status and reconciles.
   4. If Stripe returns a status mismatch, the row is flagged
      'failed_webhook' and an email is sent to founder@askzentern.com
      with the user_id and stripe_customer_id for manual review.
   5. Users are NEVER granted Contributor access without a row in
      this table reaching status 'active'.
```

---

### Item 10 — Legal docs scope (add to §3.2 and §11)

**Gap:** ToS, refund policy, cookie policy not in the page list. Privacy is specced but not Terms.

**Proposed addition:**

```
Add to §3.2 page list:

| /terms                  | Terms of Service       | Public |
| /support/refund-policy  | Refund policy          | Public |
| /privacy/cookies        | Cookie policy          | Public |

Refund policy v1 (specifically for Founding Contributor):

  The $77 Founding Contributor is non-refundable after 14 days,
  matching the standard Stripe consumer protection window. Within
  14 days, refund on request, no questions asked. Cancellation of
  the Sustaining tier ($7/mo) takes effect at the end of the
  current billing period; no pro-rated refunds.

Cookie policy v1:

  AskZentern uses a single first-party session cookie (Supabase
  auth) and a single PostHog cookie for anonymized analytics
  (only after consent on first page view). No third-party
  advertising cookies. No tracking pixels.
```

---

### Item 11 — Cron resilience (add to §5.10 and §10)

**Gap:** Cron failure modes are mentioned but not specced.

**Proposed addition: append to §10 data model and §5.10.**

```
10.x  ai_daily_cron_runs table (NEW)

   - id (uuid pk)
   - run_started_at (timestamptz)
   - run_ended_at (timestamptz)
   - status (enum: 'success', 'partial', 'failed')
   - sources_attempted (int)
   - sources_succeeded (int)
   - sources_failed (jsonb) — array of {source_id, error_message}
   - total_tips_generated (int)
   - duration_ms (int)

   Behaviour:

   - Each cron run logs one row.
   - /methodology renders the last 30 days of runs as a small
     transparency table:

     "Cron run on 25 Apr 2026: 5/5 sources, 5 tips, 18s total."

   - If 3 consecutive runs are 'failed', a Vercel Monitor alert
     emails founder@askzentern.com.

   - If a single source fails 7 days in a row, that source is
     auto-disabled and surfaced in the methodology page as
     "Currently unreachable."
```

---

### Item 12 — Source article re-versioning (add to §6.1 and §10)

**Gap:** What happens if a vendor blog updates a post after a tip is generated from it? Tip stays stale; user sees outdated information.

**Proposed addition:**

```
Add `source_content_hash` column to ai_daily_tips.

Behaviour:

- On scrape, store SHA-256 of the markdown body.
- A weekly Vercel Cron re-fetches each source URL on tips
  published in the last 60 days; if the hash differs by > 20%
  Levenshtein distance, mark the tip with a new flag
  `is_source_updated: true`.

UI:

- TipCard `source_updated` variant: amber pill on the source row:
  "Source updated since this tip was generated. [Re-check →]"
- Clicking [Re-check] triggers an on-demand regeneration that
  appends a new tip and links the original as superseded.
```

---

### Item 13 — YouTube transcript pipeline (clarify §9)

**Gap:** §9 specifies the front-end requirements but says backend is out of scope. The actual transcript source isn't named.

**Proposed addition: append to §9.**

```
9.4  Transcript source (NEW)

   v0 / front-end implementation does NOT need to know how
   transcripts are obtained, but the implementation team needs:

   A. Primary source: YouTube Data API v3 + caption track download
      (when available — about 60% of channels).
   B. Fallback: Whisper-large-v3-turbo transcription via Groq
      (cost: ~$0.04/hour of audio).
   C. Rate limit: max 10 transcripts per cron run (5 channels x 2
      most recent videos each).

   Storage: full transcript stored in a new ai_daily_transcripts
   table (separate from ai_daily_tips so transcripts can be reused
   for multiple tips):

   - id (uuid pk)
   - youtube_video_id (text unique)
   - channel_id (text)
   - published_at (timestamptz)
   - duration_seconds (int)
   - transcript_md (text — markdown with speaker labels and
     timestamps)
   - transcript_source (enum: 'youtube_captions', 'whisper')
```

---

### Item 14 — User migration from AI Daily v1.1 (add as new §21)

**Gap:** Existing AI Daily users — what's their first-launch experience?

**Proposed addition:**

```
21. v1.1 → v1.2 migration plan

   Data:
   - All ai_daily_* tables preserved as-is (the BRD already
     confirms this).
   - contributor_tier defaults to NULL (free) for all existing
     accounts.

   Routes:
   - /library → 301 permanent redirect to /playbook (preserved
     for 90 days, after which it returns 404).
   - /translate → already redirected to /unpack in v1.1.

   First-launch UX for returning users:
   - One-time toast on first visit after launch:
     "Welcome back. AI Daily is now AskZentern — same product,
      sharper focus. New: Tool Advisor recommends the right AI
      for any task. Try it →"
   - Toast dismisses on click; cookie prevents re-display.

   Email:
   - One-time announcement email to all account holders
     (subject: "AI Daily is now AskZentern. New: Tool Advisor.").
   - Sent the morning of launch day.
   - Unsubscribe-able via the same flow as the weekly briefing.

   Deprecation banner on legacy pages (/library specifically):
   - Renders for 30 days post-launch:
     "This page has moved to /playbook. Update your bookmarks."
```

---

### Item 15 — Trusted publication editorial standard (add to §5.10)

**Gap:** "Trusted publication" listed in §5.10 but not defined editorially.

**Proposed addition: append to §5.10.**

```
A "Trusted publication" meets all of:

   - Active for ≥ 5 years.
   - Has named, accountable editorial leadership.
   - Issues corrections publicly when wrong.
   - Does not accept paid placement disguised as editorial.

Initial seed list (lib/sources/trusted-publications.ts):

   - The Verge (theverge.com)
   - TechCrunch (techcrunch.com)
   - Ars Technica (arstechnica.com)
   - MIT Technology Review (technologyreview.com)
   - Wired (wired.com)
   - Stratechery (stratechery.com)
   - Ben's Bites (bensbites.com)
   - Last Week in AI (lastweekin.ai)
   - Platformer (platformer.news)
   - The Information (theinformation.com)

Additions to this list require sign-off from DCX. Not a
crowd-sourced list.
```

---

### Item 16 — Playbook search & filter (add to §5.5)

**Gap:** §11.3 references a "no results" empty state for Playbook search but the search bar itself isn't specced.

**Proposed addition: append to §5.5.**

```
5.5.x  Search & filter on /playbook

   Above the tab strip, render a search/filter row:

   [search input — placeholder "Search saved tips by keyword, role, or tool"]
   [Tool: All ▾]   [Saved in: All time ▾]   [Confidence: All ▾]

   Search behavior:
   - Instant client-side filter (saved tips are eagerly loaded;
     median user has < 50 items, so this is fine).
   - Searches across: headline, summary, tools, scenario, prompt.
   - Case-insensitive substring match.

   Filter chips:
   - Tool dropdown lists every tool present in the user's saves.
   - "Saved in" options: All time / Past 7 days / Past 30 days /
     Past 90 days.
   - "Confidence" filter shows only the labels present in saves.

   No-result state copy is per §11.3.
```

---

### Item 17 — Personalized re-ranking algorithm (add to §5.1)

**Gap:** §5.1 mentions "personalised re-ranking by role" for Today's Feed but no algorithm spec.

**Proposed addition: append to §5.1.**

```
5.1.x  Today's Feed ranking (logged-in users)

   The cron writes ~5 tips per day, ordered by source_published_at
   descending. For logged-in users, re-rank as:

   score(tip) = 0.4 * role_match
              + 0.3 * tool_match
              + 0.2 * recency_decay
              + 0.1 * confidence_weight

   Where:
   - role_match: 1.0 if any of tip.roles[] matches profile.role,
                 else 0.0
   - tool_match: fraction of tip.tools[] the user has access to
                 (0.0–1.0)
   - recency_decay: 1.0 today, 0.7 yesterday, 0.4 day-2, 0.1 day-3+
   - confidence_weight: Official=1.0, Verified=0.85, Trusted=0.7,
                        Community=0.4, Experimental=0.2

   Clamp the homepage to the top 5 ranked tips. Library archive
   (deferred to v1.3) holds all historic tips.

   Anonymous users see chronological order only.
```

---

### Item 18 — Time-saved estimation methodology (add to §6.1 and §7.3)

**Gap:** Time savings are surfaced prominently but have no estimation rule for the LLM, which leads to inflated or inconsistent values.

**Proposed addition: append to §7.3 and to the system prompt for daily generation.**

```
Estimation rules (system prompt enforcement):

A. Estimates must be a range or a single number in minutes:
   "20-30 min" or "25 min". Never use "hours saved per week";
   normalize to per-task minutes.

B. The estimate represents *one execution of the workflow*,
   not cumulative weekly/monthly savings.

C. Conservative bias: if uncertain, choose the lower end. The
   contributor model depends on credibility; over-claiming
   damages trust.

D. Cap at 90 min per task. Tasks longer than 90 min should
   be broken into sub-tasks.

E. The estimate must be derivable from the workflow (e.g.
   "5 steps × ~5 min manual = 25 min saved" — implicit, not
   shown to user).

F. If the LLM cannot reasonably estimate (no manual baseline
   exists), set estimated_time_saved_minutes: null and omit
   the "Saves X min" pill from the meta strip.
```

---

### Item 19 — Onboarding skip handling (add to §5.6)

**Gap:** Step 1 has "Skip for now" but the BRD doesn't specify what happens.

**Proposed addition:**

```
5.6.x  Skipped onboarding

   If a user skips at any step:
   - Profile row is created with NULLs for skipped fields.
   - Today's Feed renders chronologically (no role re-ranking).
   - On the 3rd Today's Feed visit, a non-blocking banner appears:

     "Get tips ranked for your role.
      [Set up my profile — 30 seconds →]"

   - On Tool Advisor first use, the form pre-fill section is
     replaced with: "Set up your profile to pre-fill these fields
     automatically. [Set up →]"

   - Banner can be dismissed; cookie prevents re-display for 7 days.

   Skipped onboarding never blocks any feature — it only degrades
   personalization. This is a soft activation pattern, not a wall.
```

---

### Item 20 — Contributor cancellation / downgrade (add to §8)

**Gap:** What happens to saved items > 50 when a Contributor cancels?

**Proposed addition: append to §8.**

```
8.7  Cancellation & downgrade behavior

   When a Contributor cancels:

   - Stripe subscription continues to the end of the current
     billing period.
   - At period end, contributor_tier flips to NULL.
   - Saved items count is preserved; if > 50, items remain visible
     and readable, but the user cannot save *new* items beyond 50
     without un-saving an existing one OR re-upgrading.

   - A single non-blocking banner on /playbook:
     "You have 73 saved items. Free accounts can save 50.
      [Re-upgrade to keep saving] or [un-save older items]."

   - Export feature is removed from UI; previously exported files
     belong to the user.

   - Weekly briefing email subscription is removed.

   - Founding Contributor never auto-cancels; status is permanent.

   Founding Contributor refund (per item 10): within 14 days,
   any reason. After 14 days, status is permanent and lifetime.
```

---

### Item 21 — Account settings page (add to §3.2)

**Gap:** /privacy mentions /account/settings as the deletion entry point, but the page isn't in the IA.

**Proposed addition: add to page list and create §5.12.**

```
5.12  /account/settings

   Tabs:
   - Profile (role, tools, skill — pre-filled from onboarding)
   - Email & password
   - Email preferences (weekly briefing on/off)
   - Contributor status (link to Stripe customer portal if active)
   - Privacy & data (export all data, delete account)

   Delete account flow:
   - Two-step confirmation modal.
   - Soft-delete first (30-day recovery window), then hard-delete.
   - Email confirmation of deletion sent to the user.
   - Stripe subscription cancelled in same transaction.
```

---

### Item 22 — Export formats specification (add to §8.2)

**Gap:** Markdown / PDF / Notion export listed as Contributor perk; no implementation spec.

**Proposed addition:**

```
8.2.x  Export specifications

   Markdown export:
   - One file per saved tip, OR a single combined file.
   - Filename: {date}-{slug-of-headline}.md
   - Includes: front-matter (title, tools, time_saved, source,
     confidence, saved_date), full TipCard content, including
     prompt block.

   PDF export:
   - Uses @react-pdf/renderer in a server action.
   - One PDF per tip OR a "Playbook book" — all saved tips,
     paginated, with a TOC.
   - Branded footer: "Generated from your AskZentern Playbook on
     [date]."

   Notion export:
   - "Copy to Notion" button.
   - Generates a Notion-flavored markdown block users paste
     directly into a Notion page (preserves headings, callouts,
     code blocks).
   - No Notion API integration in v1.2 (deferred to v1.3 if there's
     contributor demand).
```

---

### Item 23 — Fair-use enforcement (add to §4 and §7.6)

**Gap:** "Fair use" mentioned for Contributor tier with soft caps; enforcement mechanism undefined.

**Proposed addition:**

```
4.4  Rate limit enforcement

   Tier: Anonymous
   Mechanism: IP-based via Vercel Edge Config + sliding window
   Soft cap: 1 of each (Ask, Unpack, Tool Advisor) per 24h
   Hard cap: 5 of each per 24h (anti-abuse)
   On hit: Show sign-up modal

   Tier: Free Account
   Mechanism: user_id-based via Supabase row count of
              ai_daily_history per day
   Soft cap: 5/5/3 (Ask/Unpack/Advisor)
   Hard cap: same as soft cap
   On hit: Show Contributor CTA

   Tier: Sustaining Contributor
   Mechanism: same as Free
   Soft cap: 100/100/50 (Ask/Unpack/Advisor) per 24h
   Hard cap: 200/200/100
   On soft cap hit: Email warning ("you're using the service
     heavily — let's chat") to founder@askzentern.com
   On hard cap hit: Friendly throttle message to user

   Tier: Founding Contributor
   Same as Sustaining.

   No automated bans. All hard-cap hits are reviewed manually
   for the first 12 months.
```

---

### Item 24 — Bottom nav overflow (add to §3.1)

**Gap:** 5 tabs at the bottom of mobile may not render cleanly on narrow phones (320–360px) or in landscape. The current 4-tab implementation doesn't address this.

**Proposed addition:**

```
3.1.x  Mobile bottom nav at narrow widths

   At ≥ 360px wide: 5 tabs evenly distributed.
   At < 360px wide: 4 tabs; the least-recently-visited tab is
   replaced by a [More ⋯] button that opens a sheet with the
   missing tab.

   In landscape (height < 500px): bottom nav hides entirely; user
   uses the top hamburger (added only at this breakpoint).

   Active tab indicator: 1px coral underline on the icon — already
   implemented in v1.1.
```

---

### Item 25 — Tool exclusion / "do not recommend" list (add to §7.5)

**Gap:** The honesty rules say what TO do, not what NOT to do. No list of tools AskZentern won't recommend.

**Proposed addition: append to §7.5.**

```
7.5.x  Excluded tools

   AskZentern will NOT recommend:

   - Tools that don't publish a privacy policy.
   - Tools known to train on user input by default with no opt-out.
   - Tools that have been removed from major app stores for
     malicious behavior.
   - Tools owned/operated by entities under sanctions.

   If the only fit for a task is an excluded tool, the recommendation
   says so explicitly:

   "The closest fit is [Tool X], but AskZentern doesn't recommend
    it because [reason]. Alternatives in your toolkit: [Y, Z],
    which are workable but with these tradeoffs..."

   Maintained at lib/recommendations/excluded-tools.ts. Updates
   require DCX sign-off.
```

---

## 3. Items NOT recommended for inclusion

For symmetry, here are things I considered and decided against:

- **Notion API integration** — listed as "Notion export" but full Notion-API integration is out of scope for v1.2. The clipboard-friendly Notion-flavored markdown approach in item 22 is enough.
- **Public API for Tool Advisor** — would dilute focus and create support burden. Defer to v2.0.
- **Team/multi-seat features** — already excluded in §13. Keep it that way.
- **Mobile native app** — PWA install banner is enough; full native is out of scope until 1000+ WAC.
- **Affiliate links to vendor tools** — would compromise the "no paid placement" claim in §5.4 and is the wrong economic model for the brand.

---

## 4. Implementation impact on §12 build sequence

If all 25 items are accepted, §12 grows by approximately:

| Phase | Original | Adjusted | Items |
|---|---|---|---|
| Phase 1 (rebrand) | 1 day | 1 day | — |
| Phase 2 (Tool Advisor) | 3–5 days | 4–6 days | 5, 18, 25 |
| Phase 3 (trust surfaces) | 1–2 days | 2–3 days | 6, 8, 11, 15 |
| Phase 4 (contributor) | 2–3 days | 3–4 days | 9, 10, 20, 21, 22, 23 |
| Phase 5 (YouTube) | 2 days | 2 days | 13 (backend) |
| Phase 6 (polish) | 1–2 days | 2–3 days | 1, 4, 14, 16, 17, 19, 24 |
| **NEW Phase 7** (analytics & moderation) | — | 2 days | 2, 7, 8 |
| **Total** | 10–15 days | **16–21 days** | All |

Items 3, 12 are deferred to v1.3.

If only a subset is accepted, items 5, 6, 8, 9, 17, and 23 are the highest-leverage and lowest-cost — recommended as a minimum bar.

---

## 5. Recommended next step

I recommend folding items 5, 6, 8, 9, 17, and 23 into the canonical BRD as v1.3 amendments **before** Phase 2 begins. The remaining items can be triaged into Phase 6 (polish) or deferred to v1.3 / v1.4.

Confirm which items to fold in, and I'll either:

1. **Update the BRD inline** (produces `BRD-askzentern-v1.3-...md`), or
2. **Begin Phase 1 implementation** (rebrand + jade tokens + page renames), keeping these notes alongside as forward-looking guidance.

---

*End of review document.*
