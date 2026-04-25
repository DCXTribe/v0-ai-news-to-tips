# AskZentern — Business Requirements Document (v0 build brief)

**Document version:** 1.2
**Date:** 25 April 2026
**Owner:** DCX / Product
**Status:** Build spec for v0 — supersedes prior AI Daily docs (v1.0, v1.1)
**Related:** `BRD-ai-daily-2026-04-25-1730.md` (prior product), `PRD-ai-daily-v1.1-mcp-2026-04-25.md` (prior tech)

---

## 0. About this document

This is the **single source of truth** for the AskZentern v1.2 build. It is written to be fed to v0 (or any AI builder / engineer) and contains literal copy, page-by-page specifications, component anatomy, design tokens, and data model.

**How to read it:**

- Sections 1–4 set positioning. Skim these once.
- Sections 5–8 are the build spec. v0 will reference these per page.
- Sections 9–11 are detailed copy and component anatomy. These should be pasted verbatim where indicated.
- Section 12 is the recommended build sequence.

**What changed from v1.1 (AI Daily):**

| Change | Before | After |
|---|---|---|
| Product name | AI Daily | **AskZentern** |
| Flagship feature | Today's Feed | **Tool Advisor** (new), Today's Feed, Ask, Unpack |
| Library naming | Library | **Playbook** |
| Source pipeline | Firecrawl + Tavily | Firecrawl + Tavily + **YouTube transcripts** |
| Pricing model | None (free) | **Contributor Support** (warm patron model, not SaaS Pro) |
| Trust surface | Source citations | Source citations + **Methodology page** + **Privacy page** + **Confidence labels** |
| Onboarding | 3 steps | 3 steps (unchanged structure, refreshed copy) |

**Visual identity is preserved.** AskZentern inherits the warm-cream / coral / sage design system from AI Daily v1.1. The rebrand is in language, navigation, and feature set — not in palette.

---

## 1. Product summary & positioning

### 1.1 One-line pitch

> **AskZentern helps you turn AI updates and work tasks into practical prompts, workflows, and tool recommendations.**

### 1.2 Brand promise (homepage hero subhead)

> Three jobs in one. Read AI news as practical tips you can use today. Ask which AI to use for any task and get the workflow plus the exact prompt. Build a personal playbook of what works for you.

### 1.3 Who it's for

- **Maya** — Marketing manager. Has Copilot Pro at work, ChatGPT Free at home. Knows AI matters but doesn't know what to type.
- **David** — IT lead and team AI champion. Forwards tips to a 50-person ops team. Has every AI tool. Wants something he can share without fact-checking.
- **Priya** — Finance director. Two screens, calendar-driven. Wants results, not theory.
- **Arjun** — Solo consultant. Wants source-cited tips he can confidently apply to client deliverables.

### 1.4 Category

Not "AI news." Not "prompt library." AskZentern is a **practical AI work advisor** that sits at the intersection of three jobs:

1. **News-to-action** (Today's Feed)
2. **Tool decision support** (Tool Advisor — flagship)
3. **Personal playbook** (saved prompts, tracked time saved)

### 1.5 What AskZentern is *not*

- Not a chatbot.
- Not a model. AskZentern uses GPT-5-mini under the hood; it doesn't pretend to be its own AI.
- Not a course or training program.
- Not a team / enterprise product (yet).
- Not a paid Pro SaaS. The funding model is **Contributor Support** (see §8).

---

## 2. Brand identity

### 2.1 Name

**AskZentern** — pronounced *ask-ZEN-turn*.

The name is a portmanteau of *ask* (the conversational entry point) and *Zentern* (zen + intern: a calm, helpful presence that does the small repetitive work for you). The Zen root signals the Eastern-philosophy lineage of the broader brand portfolio.

### 2.2 Tagline (use sparingly)

> **The right AI for the work in front of you.**

Alternates for use in subject lines, social, email signatures:
- *AI news, unpacked. AI tools, picked. Workflows, ready to paste.*
- *Stop guessing which AI to use.*

### 2.3 Voice rules

- **Plain English over jargon.** "Saves 30 minutes" beats "boosts productivity 12%."
- **Scenario-led.** Every tip starts with a moment in someone's day, not a feature description.
- **Source-cited.** We never claim a feature exists without a source link.
- **Calm, not hype-y.** No exclamation marks. No "game-changer," "revolutionary," "10x."
- **Friendly, not corporate.** "The old way" / "With AI." Not "AI-augmented workflow."
- **Direct, not deferential.** Recommend a tool by name. Don't say "you might consider exploring."

### 2.4 Wordmark

Plain wordmark: **AskZentern** in Inter Tight Bold, optical letter spacing, sentence-case (not all-caps). The "Z" is the only character that gets a subtle visual treatment — a 2px underline accent in the primary coral.

For favicons, use a single coral **A** on the cream surface.

### 2.5 Colour palette (preserved from AI Daily v1.1)

```css
--surface-cream:       #FBF6EC   /* primary background */
--surface-cream-deep:  #F5EFE3   /* card secondary surface */
--surface-inverse:     #1F1B16   /* prompt blocks, footer */

--ink-primary:         #1F1B16   /* main text */
--ink-secondary:       #574E45   /* meta, captions */
--ink-muted:           #8E847B   /* placeholder, disabled */

--coral-primary:       #E66A55   /* primary CTAs, key accents */
--coral-deep:          #B84F3B   /* coral hover/active */
--coral-soft:          #F8DCD4   /* coral surface tint */

--sage-success:        #5C8A6F   /* "With AI" panels, time-saved pills */
--sage-deep:           #3F6650   /* sage hover */
--sage-soft:           #DDE8DF   /* sage surface tint */

--jade-advisor:        #2C7A6A   /* NEW v1.2 — Tool Advisor accent only */
--jade-soft:           #D5E5DF   /* NEW v1.2 — Tool Advisor surface */

--border-warm:         #E8DFD0   /* default borders */
--border-warm-strong:  #C9BCA6   /* emphasized borders, dashed "old way" panels */
```

The new **jade** family is reserved for Tool Advisor surfaces only — it gives the flagship feature its own visual signature without disrupting the existing coral/sage system.

### 2.6 Typography

- **Display & headings:** Inter Tight (400, 600, 700)
- **Body & UI:** Inter (400, 500, 600)
- **Prompt blocks:** JetBrains Mono (400, 500)

Type scale (Tailwind tokens):
- `text-5xl` (48px) — homepage hero only
- `text-3xl` (30px) — page titles
- `text-xl` (20px) — card titles
- `text-base` (16px) — body
- `text-sm` (14px) — meta, captions
- `text-xs` (12px) — pills, badges

### 2.7 Iconography

Lucide icons throughout. Stroke 1.75. No filled variants.

Reserved icon mappings:
- `Compass` — Tool Advisor
- `BookMarked` — Playbook
- `Sparkles` — Today's Feed
- `Link2` — Unpack
- `MessageCircleQuestion` — Ask
- `BadgeCheck` — Source-verified
- `AlertTriangle` — Stale or low-confidence
- `Heart` — Contributor support
- `Youtube` — YouTube source badge

---

## 3. Information architecture

### 3.1 Top-level navigation

Desktop and tablet (top bar):

```
[AskZentern wordmark]   Today   Ask   Tool Advisor   Unpack   Playbook              [user menu / Sign in]
```

Mobile (bottom tab bar, 5 tabs):

```
[Today]   [Ask]   [Advisor]   [Unpack]   [Playbook]
```

### 3.2 Full page list

| Path | Page | Auth | Purpose |
|---|---|---|---|
| `/` | Today's Feed | Public | Daily AI news as practical tips |
| `/ask` | Ask | Public, optional auth | Free-form question → grounded tips |
| `/tool-advisor` | Tool Advisor | Public preview, gated full | Pick the right AI for a task |
| `/unpack` | Unpack | Public, optional auth | Paste URL or text → tips |
| `/playbook` | Playbook | Auth required | Saved tips, history, time-saved totals |
| `/playbook/history/[id]` | History detail | Auth required | One past Ask/Unpack/Advisor result |
| `/onboarding` | Onboarding | Auth required (post sign-up) | Capture role, tools, skill |
| `/tips/[id]` | Tip permalink | Public | Single tip — shareable, deep-linkable |
| `/support` | Contributor Support | Public | Pricing/tiers — but framed as patronage |
| `/about` | About | Public | Story, philosophy, who's behind it |
| `/methodology` | Methodology | Public | How tips are generated, sources, confidence |
| `/privacy` | Privacy | Public | Data handling, contributor opt-ins |
| `/auth/login` | Login | Public | Email + password sign-in |
| `/auth/sign-up` | Sign up | Public | Account creation |
| `/auth/sign-up-success` | Confirmation | Public | "Check your email" |
| `/auth/callback` | Auth callback | Public | Magic link landing |
| `/auth/error` | Auth error | Public | Friendly failure |

### 3.3 Footer (every page)

Three columns + a bottom bar.

```
PRODUCT              COMPANY              TRUST
Today                About                Methodology
Ask                  Support              Privacy
Tool Advisor         Sign up              Sources
Unpack               Log in               Confidence labels
Playbook

────────────────────────────────────────────────────
© 2026 AskZentern · An indie project by [DCX] · Built with care in Malaysia
```

---

## 4. User states & access matrix

Three user states. v0 should treat these as the only access tiers.

### 4.1 Anonymous visitor

| Surface | Access |
|---|---|
| Today's Feed | Full read |
| Ask | 1 free question per session (rate-limited by IP) |
| Tool Advisor | 1 free recommendation per session |
| Unpack | 1 free unpack per session |
| Playbook | Hidden, replaced by sign-up CTA |
| Tip detail | Full read |
| Save / Mark tried | Auth gate triggers |

### 4.2 Free Account ("Curious")

Default tier post-signup. No payment required, no time limit.

| Surface | Access |
|---|---|
| Today's Feed | Full read + personalised re-ranking by role |
| Ask | 5 per day |
| Tool Advisor | 3 per day |
| Unpack | 5 per day |
| Playbook | Save up to 50 tips, full history |
| Mark tried / useful / needs improvement | Yes |
| Export | No (Contributor only) |
| Weekly briefing email | No |

### 4.3 Contributor (paid tier — see §8 for full model)

| Surface | Access |
|---|---|
| Everything in Curious | Yes |
| Ask | Unlimited (fair-use, soft-capped at 100/day) |
| Tool Advisor | Unlimited (fair-use, soft-capped at 50/day) |
| Unpack | Unlimited (fair-use, soft-capped at 50/day) |
| Playbook | Unlimited saves |
| Export | Markdown, PDF, copy-to-Notion |
| Weekly briefing email | Yes (Friday) |
| Contributor badge in header | Yes |
| Early access to new features | Yes |

---

## 5. Page specifications

Each page below specifies: purpose, layout, components used, copy (literal where shown in code blocks), and behaviour.

### 5.1 Homepage `/` — Today's Feed

**Purpose:** Deliver value in 5 seconds. Show today's tips. Convert browsers into account holders.

**Layout (top to bottom):**

1. **Hero block**
2. **Role selector strip** (anonymous only — disappears once logged in)
3. **Today's edition badge** + **3-up tip card grid** (1 col mobile, 2 col tablet, 3 col desktop)
4. **Tool Advisor teaser** (the new strategic surface — see §5.4 for the page itself)
5. **Playbook teaser**
6. **Methodology / Trust strip**
7. **Footer**

**Hero block — exact copy:**

```
Eyebrow: SATURDAY, APRIL 25 EDITION   [auto-rotates daily]

H1: The right AI for the work
    in front of you.

Subhead: Three jobs in one. Today's AI news as
         practical tips you can use this morning.
         Tool Advisor that picks the right AI for
         any task. A personal playbook that
         compounds what you've learned.

Primary CTA:   Try Tool Advisor   (links → /tool-advisor)
Secondary CTA: See today's tips   (anchor scroll to feed)

Trust line: Source-cited. Built for Copilot, ChatGPT,
            Gemini, Claude, and Perplexity. No hype.
```

**Role selector strip (anonymous only):**

```
What best describes your work?
[Marketing] [Sales] [Manager] [Finance] [HR] [Ops]
[Customer Support] [Education] [Engineering] [Other]
```

When clicked, re-ranks the 3 displayed tips client-side by role tag overlap. Does **not** require auth. Sets a `last_role` cookie. After role click, show a subtle line under the strip:

```
Showing tips for [Marketing]. Sign up to save your role and get a personal feed every morning.   [Create free account →]
```

**Tip grid:**

Header strip above the grid:

```
TODAY'S EDITION · Saturday, April 25
```

Below this: 3 TipCard components (see §6.1 for full anatomy).

If the cron has not run yet (rare), display the most recent edition with a subtle banner:

```
Showing yesterday's edition while today's brews. Refresh in a few minutes.
```

**Tool Advisor teaser block:**

```
[Compass icon, jade]

Not sure which AI to use?

Describe your task. AskZentern recommends the right tool — Copilot, ChatGPT, Gemini, Claude, or Perplexity — explains why it fits, and gives you the workflow and exact prompt to start.

Try one free recommendation
   ↓
[Tool Advisor input field, single-line, placeholder:]
"e.g. Turn my 30-page meeting transcript into a one-page exec summary"
[Recommend a tool →]   [See an example]
```

The teaser is functional — submitting from the homepage takes the user to `/tool-advisor` with the input pre-filled and runs immediately.

**Playbook teaser block:**

```
[BookMarked icon, coral]

Save what works. Track what you've tried.

A free account turns AskZentern into a personal AI playbook —
saved prompts, tools you've tried, and a running total of time saved.

Stat preview (anonymous, illustrative):
   Saved tips: —    Time saved per use: —    Top tool: —

[Create free playbook →]
```

If the user is logged in, this block becomes a **live mini-stat strip** showing their actual numbers and a `Open my playbook →` link.

**Methodology / Trust strip:**

```
[BadgeCheck icon, sage]

Every tip is source-cited.

We read official OpenAI, Microsoft, Google, Anthropic, and Perplexity blogs and YouTube channels every morning. Each tip links the article or video it came from, with publish date and verbatim quotes. We mark tips by source confidence — Official, Verified, Trusted, Community, or Experimental — so you can decide what to trust.

[How AskZentern works →]   /methodology
```

---

### 5.2 `/ask` — Ask a question

**Purpose:** Free-form question → grounded answer using fresh web search.

**Layout:**

1. Page title + subtitle
2. Suggested question chips (clickable)
3. Question input (textarea, autofocus)
4. Submit button
5. Result area (3–5 TipCards rendered after generation)
6. Conversion CTA (anonymous) or "saved to your library" (authed)

**Copy:**

```
Page title: Ask AskZentern
Subtitle:   Type a question in plain English. We pull from
            this week's AI news and recommend what to do.

Suggestion chips (clickable):
- "How can I use the new ChatGPT memory feature as a marketer?"
- "What's the best way to summarise a 30-page PDF?"
- "How do I use Copilot in Excel as a finance manager?"
- "Which AI is best for creating presentation slides?"
- "How can teachers use Gemini for lesson planning?"

Input placeholder:
"e.g. How do I use Copilot in Outlook to draft replies in my voice?"

Submit button: Ask
```

**Behaviour:**

- Anonymous users get 1 ask per session (IP-based). After they submit, the conversion CTA appears: *"Don't lose this. Sign up free to save these tips and ask 5 more today."*
- Free accounts get 5/day. After 5, the upgrade CTA appears with the Contributor framing.
- Contributors get unlimited (soft-capped 100/day).

**Result rendering:**

3–5 TipCards. Above the cards, a small synthesis line:

```
Based on 5 sources from the past 14 days.   [See sources]
```

Clicking *See sources* expands a list of the Tavily search results that grounded the response.

---

### 5.3 `/unpack` — Paste a URL or article

**Purpose:** Take any AI-news URL or pasted text and return practical tips.

**Layout:**

1. Page title + subtitle
2. Toggle: [URL] / [Paste text]
3. Input
4. Submit
5. Result area (3–5 TipCards)
6. Conversion CTA / save confirmation

**Copy:**

```
Page title: Unpack an article
Subtitle:   Paste an AI news link or the article itself.
            We turn it into prompts you can use today.

URL input placeholder:
"https://openai.com/blog/..."

Text input placeholder:
"Paste the article text here. Up to 8,000 characters works best."

Submit button: Unpack

Privacy note (below input):
"Avoid pasting confidential company, client, or personal information. Use public articles or anonymised text only."
```

**Behaviour:**

- URL submitted → Firecrawl scrape → markdown + metadata → LLM translation.
- Text submitted → trim to 8k chars → LLM translation.
- On Firecrawl failure: gracefully reveal the textarea with the message *"We couldn't read that link — try pasting the text below."*
- Anonymous limit: 1/session. Free: 5/day. Contributor: unlimited (soft-cap 50).

---

### 5.4 `/tool-advisor` — Tool Advisor (NEW flagship feature)

**Purpose:** The user describes a task; AskZentern recommends the right AI tool, explains why, gives a workflow, a prompt, and a safety note.

**Layout:**

1. Page title + subtitle (jade accent strip)
2. Compass icon + brand promise
3. Input form (multi-field but progressive — most fields optional)
4. Submit button
5. Output card (full anatomy below)
6. Conversion CTA / save confirmation

**Copy:**

```
Page title: Tool Advisor
Subtitle:   Describe what you need to do. AskZentern recommends
            the right AI tool — and the workflow and prompt to start.

Trust line under subtitle:
"Recommendations are based on task fit, not paid placement.
Sponsored tools are clearly labelled. See methodology."
[How recommendations work →]
```

**Input form fields:**

| Field | Type | Required | Placeholder / hint |
|---|---|---|---|
| Task description | Textarea (3 lines) | Yes | "e.g. Turn my 30-page client meeting transcript into a one-page exec summary with key decisions and action owners." |
| Desired output | Single-line | No | "e.g. A 1-page Word doc + a 3-slide deck outline" |
| Your role | Dropdown (pre-fill from profile) | No | Marketing / Sales / Manager / Finance / HR / Ops / CS / Education / Engineering / Other |
| AI tools you have access to | Multi-select chips (pre-fill from profile) | No | Copilot Free / Copilot Pro / ChatGPT Free / ChatGPT Plus / Gemini Free / Gemini Advanced / Claude Free / Claude Pro / Perplexity Free / Perplexity Pro |
| Data sensitivity | Single-select pills | No | Public / Internal / Client-confidential / Personal-sensitive |
| Speed vs quality | Slider, default centre | No | Speed ←→ Quality |

**Submit button:** `Recommend a tool`

**Output card (the meat — see §6.4 for full component anatomy):**

```
[Jade strip across top of card]

RECOMMENDED        Microsoft Copilot Pro (in Word)
ALTERNATIVE        ChatGPT Plus (faster but requires anonymising client names)

[BadgeCheck] WHY THIS FITS
Your transcript is in your work environment and contains client info.
Copilot Pro reads files in-place without sending data outside your
Microsoft tenant. ChatGPT Plus is faster but means you'd need to
strip client names first.

[List icon] SUGGESTED WORKFLOW
1. Open the transcript in Word
2. Click the Copilot icon in the ribbon
3. Paste the prompt below into the Copilot pane
4. Review the generated summary for accuracy
5. Save as a new doc and share

[Code icon] COPY-PASTE PROMPT
┌────────────────────────────────────────────────────────────┐
│ Summarise this transcript into a 1-page executive          │
│ summary with these sections:                               │
│   1) The decision                                          │
│   2) Key context                                           │
│   3) Risks raised                                          │
│   4) Owners and next actions                               │
│ Use plain English. Bullet points where appropriate.        │
│ Preserve client names exactly as written.                  │
└────────────────────────────────────────────────────────────┘
[Copy prompt]   [Open in Copilot →]

[AlertTriangle] DATA & PRIVACY
Stay in Copilot Pro for this task. Pasting the transcript into ChatGPT Plus or Claude Free would send client information to external systems.

[Clock icon] ESTIMATED TIME SAVED
25–40 minutes

[XCircle icon] WHEN NOT TO USE THIS TOOL
If your transcript exceeds Copilot's context window (very long
transcripts), you'll need to summarize in chunks first or use
Claude Pro instead, which has a longer context.

[Save to playbook]   [Try a different tool]
```

**Behaviour:**

- Anonymous: 1 free recommendation per session, full output, but `Save to playbook` triggers auth.
- Free account: 3 per day. The 4th attempt shows the Contributor CTA.
- Contributor: unlimited (soft-cap 50/day).

---

### 5.5 `/playbook` — Personal playbook (was Library)

**Purpose:** The reason to sign up. Saved tips, history, time saved, personal toolkit.

**Layout:**

1. Stat strip (4 stats, full-width on mobile, 4-up on desktop)
2. Tab strip: **Saved** / **History** / **Tried**
3. Toolkit chip row ("Your toolkit")
4. Filtered list of items based on tab

**Stat strip (preserve from AI Daily v1.1, slightly relabelled):**

```
[Sage]  TIME SAVED PER USE      4h 35m
[Sage]  IF YOU USE WEEKLY       ~18h / month
[Coral] SAVED ITEMS             12
[Ink]   TOP TOOL                Copilot Pro
```

The first two are computed by parsing `time_saved` natural-language strings ("25 minutes," "30–45 min") into minutes and summing across saved items.

**Tabs:**

- **Saved** — full TipCards for everything saved.
- **History** — reverse-chronological list of all Ask/Unpack/Tool-Advisor generations. Each row clickable to `/playbook/history/[id]` which renders the full original result.
- **Tried** — items the user has marked "Tried." This tab includes a status filter chip row: `Tried` / `Useful` / `Needs improvement` / `Archived`.

**Toolkit chip row (above the list):**

```
YOUR TOOLKIT — based on your saved items
[Copilot Pro × 7]  [ChatGPT Plus × 4]  [Claude Pro × 1]
```

**Empty state (no saved items):**

```
[BookMarked icon, coral, large]

Your playbook is empty.

Save tips from Today's Feed, Ask, Unpack, or Tool Advisor —
each saved tip adds to your time-saved total and helps
AskZentern recommend better tips for your role.

[See today's tips →]   [Try Tool Advisor →]
```

---

### 5.6 `/onboarding` — 3-step onboarding

Triggered after sign-up. Cannot be skipped. Stored in `ai_daily_profiles`.

**Step 1 — Role**

```
Welcome.

What best describes your work?

[Marketing] [Sales] [Manager / Team Lead] [Finance]
[HR] [Operations] [Customer Support] [Education]
[Engineering / Developer] [Content Creator] [Student]
[Other]

[Skip for now]   [Next →]
```

**Step 2 — Tools**

```
Which AI tools do you have access to?

We'll only recommend things that work in tools you actually have.
Pick all that apply.

☐ Microsoft Copilot Free
☐ Microsoft Copilot Pro / M365 Copilot
☐ ChatGPT Free
☐ ChatGPT Plus / Pro
☐ Google Gemini Free
☐ Google Gemini Advanced
☐ Claude Free
☐ Claude Pro
☐ Perplexity Free
☐ Perplexity Pro

[Back]   [Next →]
```

**Step 3 — Skill level**

```
How comfortable are you with AI tools today?

[Beginner — I open them but don't know what to type]
[Intermediate — I use them weekly for a few tasks]
[Power user — I use AI daily and want new patterns]

[Back]   [Take me to my playbook →]
```

After step 3, redirect to `/playbook` with a one-time toast:

```
You're set up. Today's tips are now ranked for your role.
```

---

### 5.7 `/tips/[id]` — Tip permalink

Single TipCard rendered full-width with one extra section: a **Related tips** strip below ("3 more tips for [role]") if logged in.

URL structure must be **shareable** — no auth gate on read. Save / Mark Tried buttons gate to auth.

---

### 5.8 `/support` — Contributor Support page (replaces Pricing)

See §8 for the full model. Page-level copy:

```
Hero:
[Heart icon, coral]

Support AskZentern.

I'm building AskZentern as an indie tool — a small, careful
project that turns AI news and tasks into things you can
actually do. Your contribution keeps the lights on (Firecrawl,
Tavily, AI inference, hosting) and the product free for
people who can't pay.

— DCX, founder

Three ways to be part of it:
```

Then three pricing cards (see §8).

Below cards: a small section titled **"Where the money goes"** with a literal cost breakdown:

```
Where contributions go (transparency log)

— API costs:        Firecrawl, Tavily, OpenAI gpt-5-mini   ~ 65%
— Hosting:          Vercel, Supabase                       ~ 15%
— Domain & email                                           ~  5%
— Reinvested in product                                    ~ 15%

Updated monthly. Logged at /methodology.
```

This transparency block is the *entire reason* the contributor model works. Without it, "Pro" framing feels more honest. Don't drop it.

---

### 5.9 `/about` — About

Story-driven, in DCX's voice. One screen, no tabs.

```
About AskZentern

I built AskZentern because I kept seeing two things at once.

People I work with — managers, marketers, finance leads,
teachers — were drowning in AI headlines but using AI maybe
twice a week. The gap between "I read about it" and "I used
it on Monday" was enormous.

At the same time, the AI tools themselves were getting harder
to choose between. ChatGPT? Copilot? Claude? Gemini?
Perplexity? Each is best at different things, and "best" is
a moving target as they ship features weekly.

AskZentern does three things to close that gap:

1. Reads the official OpenAI, Microsoft, Google, Anthropic,
   and Perplexity blogs and YouTube channels every morning
   and turns what's new into practical tips.

2. Recommends the right AI tool for any task you bring it,
   with the workflow and the exact prompt.

3. Saves what works for you into a personal playbook that
   tracks how much time you've saved.

The product is free. If you'd like to support the work,
[contribute here →].

— DCX
   Petaling Jaya, Malaysia
```

---

### 5.10 `/methodology` — How we work

Public-facing trust page. Critical for the contributor model.

```
How AskZentern works

1. Where tips come from
   We scrape the official vendor blogs (OpenAI, Microsoft,
   Google, Anthropic, Perplexity) every morning at 06:00 UTC,
   plus selected YouTube channels (Microsoft Mechanics,
   Google AI, OpenAI). Tavily searches each domain for
   articles published in the last 14 days; Firecrawl scrapes
   the article into clean markdown; an LLM (OpenAI gpt-5-mini
   via Vercel AI Gateway) translates the article into a tip
   anchored to that source.

2. Source confidence labels
   Every tip carries one of five labels:

   — Official source   The vendor's own blog or channel.
   — Verified vendor   A vendor's verified social or doc.
   — Trusted publication  Mainstream tech press.
   — Community-reported  Reddit, HN, Twitter — with caveat.
   — Experimental      Unverified, marked clearly.

3. Citation guards
   Every tip's source URL is whitelist-checked against the
   article that grounded it. URLs the LLM invents are
   stripped server-side before the tip is written to the
   database.

4. Stale tips
   Tips where the source article is older than 30 days
   carry a "May be outdated" badge.

5. Tool Advisor
   Recommendations are based on task fit, not paid placement.
   Sponsored tools (if we ever introduce them) will be
   clearly labelled and ranked separately from organic
   recommendations.

6. What we don't do
   We don't sell user data. We don't share your prompts
   with vendors. We don't track you across the web.
   See /privacy for specifics.
```

---

### 5.11 `/privacy` — Privacy

```
Privacy at AskZentern

Plain-English version (the legal one is below):

— We don't sell your data. To anyone. Ever.
— What you paste into Unpack and Ask is stored only if
  you're logged in. If you're anonymous, it disappears
  after the response is generated.
— Your saved playbook is private to you. We don't share
  it with vendors, advertisers, or anyone else.
— If we ever introduce vendor partner offers, you'll
  opt in explicitly. We won't share your contact info
  by default.
— You can delete your account and all saved data at any
  time from /account/settings.

Aggregated and anonymised insight data (e.g. "X% of
marketers in our user base ask about Copilot in Word")
may be used to improve the product. No personal text
or identifiable user info is included in this analytics.

Full policy: [link]
```

---

## 6. Component specifications

### 6.1 TipCard — the shared component across Today, Ask, Unpack, Playbook

This is the most-rendered component in the product. Get this right.

**Anatomy (top to bottom):**

```
┌──────────────────────────────────────────────────────────┐
│  [Category chip]  [Source-verified badge]  [Saves 30 min]│   ← Meta strip
│                                                          │
│  Tip headline goes here, two lines max                   │   ← Headline
│                                                          │
│  One-paragraph plain-English summary that explains       │   ← Summary
│  what changed and why it matters.                        │
│                                                          │
│  [Copilot Pro] [ChatGPT Plus]                            │   ← Tool tags
│                                                          │
│  ┌─ THE SCENARIO ──────────────────────────────────┐     │
│  │ [Briefcase icon, jade soft tile]                │     │   ← Scenario
│  │ You're a Marketing Manager who writes 10 emails │     │
│  │ a week. Each time you have to explain your tone │     │
│  │ and audience.                                   │     │
│  └─────────────────────────────────────────────────┘     │
│                                                          │
│  ┌── THE OLD WAY ────────────────────────────────────┐   │
│  │ [dashed border, cream-deep surface]               │   │   ← Before
│  │ Re-explain audience and tone in every chat.       │   │
│  │ ~5 minutes lost per email.                        │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│              ↓  [sage chevron]                           │   ← Connector
│                                                          │
│  ┌── WITH AI ────────────────────────────────────────┐   │
│  │ [thicker sage left bar, sage-soft surface]        │   │   ← After
│  │ Save your audience profile to memory once.        │   │
│  │ Every future draft arrives in your tone.          │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  ┌── COPY-PASTE PROMPT ──────────────────────────────┐   │
│  │ [Inverse surface, JetBrains Mono]                 │   │   ← Prompt block
│  │ Remember: I'm a Marketing Manager at [COMPANY].   │   │
│  │ Our audience is [AUDIENCE]. Our tone is [TONE].   │   │
│  │ Apply these to all future drafts.                 │   │
│  │                                  [Copy]           │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  ┌── SOURCE ─────────────────────────────────────────┐   │
│  │ [Small caps, ink-secondary]                       │   │   ← Source row
│  │ OpenAI Blog · 2 days ago · [BadgeCheck]           │   │
│  │ "ChatGPT now supports persistent memory across    │   │
│  │  chats."                                          │   │
│  │ [Read original article →]                         │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  [Copy prompt]   [Save to playbook]   [Mark as tried]    │   ← Action bar
└──────────────────────────────────────────────────────────┘
```

**Variants:**

- `default` — blog source, layout above.
- `youtube` — replaces the Source row with an embedded YouTube player at 16:9, plus a `[Watch from 3:42]` deep-link button that links to `?t=222`. The verbatim quote becomes the transcript snippet.
- `stale` — the source row carries a `[AlertTriangle] May be outdated · 47 days old` badge in amber.
- `experimental` — the meta strip carries a `[Experimental]` chip in jade-soft to indicate community-sourced or unverified.

**States:**

- Anonymous: `Save` and `Mark as tried` show but trigger sign-up modal on click.
- Free / Contributor: `Save` toggles state in `ai_daily_saves`. `Mark as tried` opens a small inline form (status pills + optional notes).

---

### 6.2 SourceCitation component

Used inside TipCard's source row and as a standalone in Ask/Unpack result synthesis.

```
[Publisher logo or icon] · [Publisher name] · [Relative date] · [Confidence badge]
"Verbatim quote (≤140 chars)"
[Read original →]   [Watch from 3:42 →] (YouTube only)
```

Confidence badges (one of five, exclusive):

```
[BadgeCheck sage]    Official source
[BadgeCheck jade]    Verified vendor
[BadgeCheck coral]   Trusted publication
[Users icon ink]     Community-reported
[AlertTriangle amber] Experimental
```

---

### 6.3 PlaybookItem component

A condensed TipCard for the Saved tab list. Does not render the prompt block by default — taps to expand.

```
┌───────────────────────────────────────────────────┐
│ [Saves 30 min]  [Tool: Copilot Pro]   [Tried]     │
│                                                   │
│ Tip headline two lines max                        │
│ One-line summary teaser…                          │
│                                                   │
│ Saved 3 days ago · From Today's Feed              │
│                                                   │
│ [Expand]   [Open]   [Remove]   [Mark useful]      │
└───────────────────────────────────────────────────┘
```

---

### 6.4 ToolAdvisorOutput component

The flagship output card. Lives at `/tool-advisor` and embeds in Playbook history.

Eight sections, in order:

1. **Recommendation header** — recommended tool + alternative, jade strip
2. **Why this fits** — 2–3 sentence explanation
3. **Suggested workflow** — numbered list, 3–7 steps
4. **Copy-paste prompt** — inverse surface, mono, copy button
5. **Data & privacy warning** — amber callout if `data_sensitivity != public`
6. **Estimated time saved** — sage pill
7. **When not to use this tool** — XCircle icon, ink-secondary
8. **Action bar** — `Save to playbook` / `Try a different tool` / `Why this and not [alternative]?`

The 8th section's third button (`Why this and not...`) is a Contributor-only feature that runs a follow-up generation explaining the tradeoff in detail.

---

### 6.5 StatStrip component

Used at the top of `/playbook` and in the homepage Playbook teaser (live for logged-in users).

4 stats, evenly distributed, each with: icon, label (small caps), value (display size), optional sublabel.

```
[Clock sage]      TIME SAVED PER USE       4h 35m
[TrendingUp sage] IF YOU USE WEEKLY        ~18h / month
[Bookmark coral]  SAVED ITEMS              12
[Sparkles ink]    TOP TOOL                 Copilot Pro
```

Mobile: 2x2 grid. Tablet+: 1x4.

---

## 7. Tool Advisor — full specification

Tool Advisor is the v1.2 flagship and deserves a section of its own.

### 7.1 Why it matters

Today's Feed is reactive (the news happened, here's what to do).
Tool Advisor is proactive (you have a task, here's the right tool).

It's the difference between *AI Daily* (what AskZentern was) and *AskZentern* (what it is now).

### 7.2 Inputs

See §5.4 for the form spec. Critical:

- **Task description is the only required field.** Everything else has sensible defaults from the user's profile.
- **Pre-filling from profile** is what makes this feel personal. v0 must read `ai_daily_profiles.role` and `ai_daily_profiles.tools` on render.

### 7.3 Output schema (Zod / structured)

```ts
{
  recommended_tool: { name: string; tier: string; reason: string },
  alternative_tool: { name: string; tier: string; reason: string },
  why_this_fits: string,                 // 2-3 sentences
  workflow_steps: string[],              // 3-7 items
  prompt: string,                        // copy-paste, with [PLACEHOLDERS]
  data_privacy_warning: string | null,   // null if public data
  estimated_time_saved_minutes: number,  // realistic, 5-90
  when_not_to_use: string,               // honest limitation
  source_url: string,                    // grounding source, if any
  source_publisher: string,
  confidence_label: enum,
}
```

### 7.4 Generation pipeline

1. User submits.
2. Backend reads user profile (if authed).
3. **Tavily search** with the task description + tool keywords (last 30 days, max 5 results).
4. LLM (`gpt-5-mini`) receives: user profile, task, tool list, sensitivity, search results as grounded context.
5. LLM produces structured output via `Output.object()`.
6. Citation guard (whitelist URL post-strip).
7. Persist to `ai_daily_tool_advisor_runs` (new table — see §10).
8. Return to client.

### 7.5 Honesty requirements (system prompt rules)

- **Never recommend a paid tier the user doesn't have.** If the user only has Copilot Free, never recommend Copilot Pro features.
- **If two tools tie, pick the one already in the user's toolkit.** Reduces context-switching cost.
- **If data is sensitive, explicitly recommend on-tenant tools** (Copilot in M365, ChatGPT Enterprise) over consumer tools.
- **Never claim a tool can do something it can't.** If grounded search doesn't confirm a feature, drop it from the recommendation.
- **Always populate `when_not_to_use`.** A recommendation without limitations is not a recommendation.

### 7.6 Gating

| User state | Per session/day | Notes |
|---|---|---|
| Anonymous | 1 / session | Full output, save triggers auth |
| Free Account | 3 / day | Soft cap with Contributor CTA |
| Contributor | 50 / day | Practical-unlimited |

---

## 8. Contributor Support model — full specification

This replaces the "Pro" tier from the askzentern enhancement BRD.

### 8.1 Philosophy

AskZentern is an indie product. The funding model is voluntary contribution, not SaaS subscription. The product is **free for everyone** at a usage level that covers the realistic needs of most users. Heavier users who want unlimited access support the work financially in exchange for fair-use unlimited access plus small recognition perks.

This is structured like Substack, Patreon, or Buy Me a Coffee — *not* like a Pro tier.

### 8.2 Three tiers

#### Tier 1 — Curious (Free Account)

```
Free, forever.

Build your AI playbook.

— Save up to 50 tips
— Mark tips as Tried, Useful, Needs improvement, Archived
— 5 Asks per day
— 5 Unpacks per day
— 3 Tool Advisor recommendations per day
— Daily personalised feed
— Basic role + tools personalisation

[Create my playbook]
```

#### Tier 2 — Sustaining Contributor ($7 / month)

```
$7 / month — cancel anytime.

Use AskZentern as much as you need, and keep the lights on for everyone else.

Everything in Curious, plus:
— Unlimited Tool Advisor (fair-use, ~50/day)
— Unlimited Ask & Unpack (fair-use, ~100/day)
— Unlimited saved playbook items
— Export to Markdown, PDF, copy-to-Notion
— Weekly Friday briefing email — top 5 tips for your role
— Contributor badge in your header
— Early access to new features

[Become a Sustaining Contributor]
```

#### Tier 3 — Founding Contributor ($77 once)

```
$77, paid once. Lifetime support tier — limited to the first 200 contributors.

Everything in Sustaining Contributor, plus:
— Founding Contributor badge (visible on your profile, if you opt in)
— Direct line to feature requests via private email
— Your name listed in the credits page (opt-in)
— First access to AskZentern Teams when it ships

[Become a Founding Contributor]
```

### 8.3 Why $7 and $77

- **$7/mo** is below ChatGPT Plus ($20) and feels like a coffee tip, not a SaaS commitment.
- **7 is auspicious** in Chinese culture — quietly aligns with the Eastern-philosophy lineage of the broader brand.
- **$77 once** — same digit signal, scarcity-bound at 200 (creates urgency for early adopters), enough margin to fund a meaningful chunk of API costs upfront.

### 8.4 What contributors get that's *not* gating

These are the "patron perks" that make the model feel community-led, not paywall-led:

- **Contributor badge** in the site header.
- **Credits page** at `/about/credits` listing all Founding Contributors who opt in.
- **Monthly transparency log** at `/methodology` — actual revenue + spend breakdown.
- **Early access** — new features ship to contributors a week before everyone else.

### 8.5 What it is *not*

- It is **not a paywall on the core product.** Free accounts get genuinely useful daily access.
- It is **not a "starter / growth / business / enterprise" SaaS ladder.** Two tiers + a one-time founder option — that's it.
- It is **not where Tool Advisor lives.** Tool Advisor is available to free accounts (3/day), gated to contributors only at the unlimited tier. Don't bury the flagship feature behind a soft donation paywall.

### 8.6 Conversion moments

Where the Contributor CTA appears (and where it does *not*):

| Moment | Show CTA? | Tone |
|---|---|---|
| Free user hits 6th Ask of the day | Yes | "You've used today's free Asks. Want unlimited? [Become a contributor]" |
| Free user hits 4th Tool Advisor | Yes | Same pattern. |
| Free user reaches 50th saved tip | Yes | Same pattern. |
| Free user clicks Export | Yes | "Export is a contributor perk. [Learn more]" |
| Anonymous user clicks Save | **No** | Show sign-up modal, not contributor pitch. |
| Anonymous user lands on homepage | **No** | Hero is hero. Don't pitch on first impression. |
| Footer (every page) | Yes | Soft text link: *"Like AskZentern? [Support the work →]"* |

---

## 9. YouTube source integration

### 9.1 Why YouTube

AI vendors increasingly ship product news on YouTube before or alongside their blogs:

- Microsoft Mechanics — Copilot deep-dives, M365 demos
- OpenAI's own channel — live demos, dev streams
- Google AI — keynote announcements, Gemini features
- Anthropic — channel demos and announcements

Today's Firecrawl + Tavily pipeline misses all of it.

### 9.2 What v0 needs to know (front-end only)

The MCP integration is backend work. For v0, the front-end requirements are:

1. **TipCard `youtube` variant** — see §6.1.
2. **Source row** for YouTube tips includes:
   - YouTube logo + channel name + relative date
   - Embedded player (lazy-loaded, click-to-play poster image by default to save bandwidth)
   - `[Watch from 3:42 →]` button that links to `https://youtube.com/watch?v={id}&t=222`
3. **YouTube source badge** on the meta strip — small `[Youtube icon]` in coral.

### 9.3 Source registry seed (for `/methodology`)

```
Vendor blogs scraped daily:
— OpenAI Blog
— Microsoft 365 Blog
— Microsoft Copilot Blog
— Anthropic News
— Google Workspace Updates
— Google Gemini Blog
— Perplexity Blog

YouTube channels scraped daily (NEW v1.2):
— Microsoft Mechanics
— OpenAI (official)
— Google AI
— Anthropic (official)
— Google Workspace
```

---

## 10. Data model

All tables namespaced `ai_daily_*` (kept from v1.1 to avoid migration).

| Table | Purpose | RLS |
|---|---|---|
| `ai_daily_profiles` | role, tools, skill, **`contributor_tier`** (NEW: `null`/`sustaining`/`founding`) | Owner-only |
| `ai_daily_news_sources` | Registry of vendor blogs + YouTube channels. **NEW columns:** `source_type` (`blog`/`youtube`), `youtube_channel_id` | Service-role write, public read |
| `ai_daily_feed` | One row per published tip per day | Public read |
| `ai_daily_tips` | Tips. **NEW columns:** `source_type`, `youtube_video_id`, `youtube_timestamp_seconds`, `confidence_label`, `is_stale` | Public read for curated, owner-only for generated |
| `ai_daily_saves` | user × tip + status (`saved`/`tried`/`useful`/`needs_improvement`/`archived`) | Owner-only |
| `ai_daily_history` | Each Ask/Unpack/Advisor generation. **NEW columns:** `kind` now includes `tool_advisor` | Owner-only |
| `ai_daily_tool_advisor_runs` | NEW. One row per Tool Advisor recommendation. Stores task description, full output schema, source citations. | Owner-only |
| `ai_daily_contributions` | NEW. Stripe webhook persistence — tier, amount, started_at, ended_at | Service-role only |

---

## 11. Copy library — paste these verbatim

### 11.1 Auth

**Sign-up form heading:**
```
Create your AskZentern playbook.

Save tips, track what works, and get AI tips ranked for your role —
free, no credit card.
```

**Sign-up form fields:**
- Email
- Password (min 8 chars)
- *Submit:* Create account

**Post-signup confirmation:**
```
Check your email.

We sent a confirmation link to [email]. Click it to start your playbook.
```

**Login heading:**
```
Welcome back.
```

### 11.2 Conversion moments

**Anonymous user clicks Save:**
```
[Modal]

Save this tip?

A free account turns these into your personal AI playbook —
plus tracks how much time you save every time you use them.

[Create free account]   [Already have one? Log in]   [Maybe later]
```

**Anonymous user uses 1st Ask, returns for 2nd:**
```
You've used today's free Ask.

Sign up free for 5 Asks per day, save the results, and build a
playbook ranked for your role.

[Sign up free]   [Maybe later]
```

**Free user hits Tool Advisor limit (4th run):**
```
You've used your 3 free Tool Advisor recommendations today.

Become a Sustaining Contributor for unlimited recommendations —
$7/month, supports an indie product, no commitment.

[Become a contributor]   [Tomorrow's fine]
```

**Free user clicks Export:**
```
Export your playbook to Markdown, PDF, or Notion.

Export is a Contributor perk. Become a Sustaining Contributor —
$7/month — and export anything from your playbook anytime.

[Become a contributor]   [Learn more about Contributor]
```

### 11.3 Empty states

**Today's feed (cron failed):**
```
Today's edition is brewing.

We're behind schedule — the morning pipeline is taking a few extra
minutes. In the meantime, here's yesterday's edition:

[Yesterday's tips]
```

**Playbook empty:**
```
Your playbook is empty.

Save tips from Today's Feed, Ask, Unpack, or Tool Advisor — each
saved tip adds to your time-saved total and helps AskZentern
recommend better tips for your role.

[See today's tips →]   [Try Tool Advisor →]
```

**Search no results (Playbook search):**
```
No tips match "[query]".

Try a different keyword, or [browse all saved tips].
```

### 11.4 Toast messages

- *Tip saved to your playbook.*
- *Tip removed from your playbook.*
- *Marked as tried.*
- *Prompt copied.*
- *Welcome back, [name].*
- *You're now a Sustaining Contributor — thank you.*

### 11.5 404

```
[Compass icon, jade]

Wrong path.

This page doesn't exist. Maybe it was unpublished, or maybe you
typed it from memory and added an extra slash.

[Today's feed]   [Tool Advisor]   [Search the playbook]
```

---

## 12. Build sequence for v0

Recommended order. Each step yields a working artifact before the next begins.

**Phase 1 — Rename & rebrand (1 day)**

1. Replace "AI Daily" with "AskZentern" everywhere (wordmark, page titles, footer, meta tags, social cards).
2. Update homepage hero copy per §5.1.
3. Update tagline and brand voice on /about and /methodology pages.
4. Rename `/library` to `/playbook` (preserve old route as redirect for 90 days).
5. Add jade colour family to design tokens (per §2.5).

**Phase 2 — Tool Advisor MVP (3–5 days)**

6. Build `/tool-advisor` page per §5.4.
7. Build `ToolAdvisorOutput` component per §6.4.
8. Add `ai_daily_tool_advisor_runs` table per §10.
9. Wire backend route `/api/tool-advisor` (Tavily search + LLM + structured output).
10. Add Tool Advisor teaser block to homepage per §5.1.
11. Add Tool Advisor entry to navigation.

**Phase 3 — Methodology & trust surfaces (1–2 days)**

12. Build `/methodology` page per §5.10.
13. Build `/privacy` page per §5.11.
14. Add confidence label badges to `SourceCitation` component per §6.2.
15. Add stale-tip badge logic (>30 days source = stale).

**Phase 4 — Contributor Support (2–3 days)**

16. Build `/support` page per §5.8.
17. Add Stripe integration (Sustaining $7/mo recurring + Founding $77 one-time).
18. Add `ai_daily_contributions` table.
19. Add `contributor_tier` column to `ai_daily_profiles`.
20. Wire conversion CTAs throughout per §11.2.
21. Add contributor badge to header for paid users.

**Phase 5 — YouTube integration (frontend only — backend to follow) (2 days)**

22. Add `youtube` variant to TipCard per §6.1.
23. Add YouTube embed component (lazy-loaded poster).
24. Update source registry display on `/methodology`.

**Phase 6 — Polish (1–2 days)**

25. Mobile bottom nav refresh with 5 tabs (Today / Ask / Advisor / Unpack / Playbook).
26. Footer redesign per §3.3.
27. Re-test all conversion CTAs.
28. Re-test all empty states.

**Total estimated v0 time:** 10–15 working days for a competent v0 operator.

---

## 13. What v0 should *not* do

- Do **not** generate placeholder tips. The cron pipeline owns content.
- Do **not** invent new color tokens. Use only the palette in §2.5.
- Do **not** rebuild the auth flow. Supabase auth from v1.1 stays as-is.
- Do **not** build Team/Enterprise features. Out of scope for v1.2.
- Do **not** add gamification (streaks, points, leaderboards). Wrong tone for the brand.
- Do **not** introduce a chat interface. Ask is single-shot, intentionally.
- Do **not** auto-DM users about contributing. Ever.

---

## 14. Acceptance criteria

The v1.2 build is complete when:

1. Every page in §3.2 renders without errors.
2. Tool Advisor produces a fully-structured output card with all 8 sections, citing a real source.
3. Anonymous users can use Tool Advisor exactly once per session before being asked to sign up.
4. Free users hit limits at exactly 5/5/3 (Ask/Unpack/Advisor) per day and see the contributor CTA.
5. Contributor purchase completes via Stripe and the user's `contributor_tier` updates within 30 seconds.
6. Contributor badge appears in the header for paid users.
7. The `/methodology` page shows all source registry entries (blogs + YouTube).
8. TipCard `youtube` variant renders the embed and the `Watch from [timestamp]` button links to the correct moment.
9. Stale-tip badge appears on tips where `source_published_at` is >30 days ago.
10. All conversion CTA copy matches §11 verbatim.

---

## 15. Open decisions for DCX

These need a call before Phase 4 starts:

1. **Stripe entity** — which legal entity processes contributions? VictorOnJourney? DCXTribe? A new AskZentern entity?
2. **Founding Contributor cap** — 200 is the suggested number. Confirm?
3. **YouTube channel list** — confirm the 5 seed channels (§9.3) before backend wiring.
4. **Email service for weekly briefing** — Resend? Postmark? Loops?
5. **Domain** — `askzentern.com`? `askzentern.app`? `askzentern.ai`?

---

*End of document.*
