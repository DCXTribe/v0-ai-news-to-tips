# AI News-to-Tips: Implementation Plan

## Project Overview

**ai-news-to-tips** is a real-time AI-powered platform that transforms AI industry news into actionable, personalized tips. The system automatically scrapes official AI vendor blogs (OpenAI, Anthropic, Google, Meta, Microsoft), generates AI-curated tips using Claude, and surfaces the most recent and relevant insights to users with a focus on freshness and engagement.

### Core Value Proposition

- **Automated Intelligence**: Daily cron job scrapes 9+ trusted AI vendor sources
- **AI-Generated Insights**: Claude converts raw articles into concise, actionable tips
- **Real-Time Freshness**: Two-day rolling window ensures tips are never stale
- **On-Demand Generation**: Ask and Advisor features for immediate tip generation
- **Personalized Engagement**: Per-user saved tips, role-based filtering, and activity tracking

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 16)                       │
├─────────────────────────────────────────────────────────────────┤
│  Landing (/) │ Today (/today) │ Ask (/ask) │ Advisor (/advisor)│
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Routes    │
                    ├─────────────────┤
                    │ /api/cron/*     │
                    │ /api/ask        │
                    │ /api/advisor    │
                    │ /api/unpack     │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼─────┐      ┌─────▼──────┐    ┌──────▼─────┐
    │ Supabase │      │ Firecrawl  │    │ Tavily API │
    │ Database │      │ (Scraper)  │    │ (Search)   │
    │   (RLS)  │      │            │    │            │
    └──────────┘      └────────────┘    └────────────┘
         │
    ┌────▼─────────────┐
    │ AI Gateway       │
    │ (Claude via      │
    │  Vercel AI SDK)  │
    └──────────────────┘
```

### 1.2 Key Technologies

- **Frontend**: Next.js 16 (App Router), React 19.2, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes (serverless), Server Components
- **Database**: Supabase PostgreSQL with Row-Level Security (RLS)
- **AI/LLM**: Vercel AI Gateway (Claude Opus), AI SDK v6
- **Content Scraping**: Firecrawl (markdown extraction)
- **Search/Research**: Tavily API (web search for Ask/Advisor)
- **Caching**: Next.js `unstable_cache` with revalidation tags
- **Auth**: Supabase Auth (session-based with RLS policies)

---

## 2. Database Schema

### 2.1 Core Tables

#### `ai_daily_feed`
Represents a daily edition of scraped articles from all sources.

```sql
CREATE TABLE ai_daily_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_date DATE NOT NULL,  -- MYT calendar date (e.g. 2026-05-06)
  headline TEXT NOT NULL,   -- article title
  source_url TEXT NOT NULL, -- URL of the article
  source_title TEXT NOT NULL, -- name of news source (e.g. "OpenAI Blog")
  category VARCHAR(50),     -- vendor name (openai, anthropic, google, etc)
  markdown_content TEXT,    -- full scraped markdown
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(feed_date, source_url) -- prevent duplicates per day
);

CREATE INDEX idx_feed_date ON ai_daily_feed(feed_date DESC);
```

#### `ai_daily_tips`
Individual tips extracted from feed items by Claude.

```sql
CREATE TABLE ai_daily_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES ai_daily_feed(id) ON DELETE CASCADE,
  title TEXT NOT NULL,        -- tip headline (e.g. "Use Structured Outputs...")
  description TEXT NOT NULL,  -- explanation and context
  tip_type VARCHAR(50),       -- role/tool category (tutorial, best-practice, etc)
  source_url TEXT,            -- URL where tip was sourced
  source_title TEXT,          -- display name of source
  is_outdated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_tips_feed ON ai_daily_tips(feed_id);
CREATE INDEX idx_tips_created ON ai_daily_tips(created_at DESC);
```

#### `ai_daily_news_sources`
Curated list of AI vendor blogs and trusted sources.

```sql
CREATE TABLE ai_daily_news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,            -- e.g. "OpenAI Blog"
  vendor VARCHAR(50) NOT NULL,   -- vendor category
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `user_saved_tips`
Per-user saved/bookmarked tips (with RLS).

```sql
CREATE TABLE user_saved_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tip_id UUID NOT NULL REFERENCES ai_daily_tips(id) ON DELETE CASCADE,
  saved_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, tip_id)
);

CREATE INDEX idx_saved_tips_user ON user_saved_tips(user_id);

-- RLS: Users can only see/manage their own saved tips
ALTER TABLE user_saved_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved tips"
  ON user_saved_tips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save tips"
  ON user_saved_tips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave tips"
  ON user_saved_tips FOR DELETE
  USING (auth.uid() = user_id);
```

#### `user_profiles`
Extended user metadata.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role VARCHAR(50),             -- e.g. "engineer", "researcher", "manager"
  preferences JSONB,            -- user settings (filters, notifications, etc)
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS: Users can view/edit their own profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);
```

### 2.2 Key Design Decisions

- **feed_date is MYT**: Stored as `DATE` type (calendar date in Malaysia Time), not UTC. This ensures consistent querying regardless of server timezone.
- **RLS for saved_tips**: Only authenticated users can see/modify their own saved tips.
- **Cascading deletes**: Deleting a feed item automatically cleans up its tips.
- **Unique constraint**: No duplicate articles per day (prevents duplicate scrapes).

---

## 3. Data Flow

### 3.1 Daily Cron Job (20:00 MYT)

**Trigger**: `POST /api/cron/daily-feed` (scheduled via external cron service or Vercel Cron)

**Steps**:

1. **Fetch active sources** from `ai_daily_news_sources` (WHERE `is_active = true`)
2. **For each source** (up to 5 per invocation to avoid timeout):
   - Call `findRecentArticleFor(source)` to find the latest article URL from that vendor's blog/RSS
   - **Block URLs** from non-scrapable domains (YouTube, TikTok, Instagram, etc)
   - Check if article already exists for today's MYT date → skip if duplicate
3. **Scrape each article** using Firecrawl → extract markdown content
   - **Error detection**: Reject scraped content that looks like a 403/error page
   - Minimum content length check (300 chars)
4. **Generate tips** by calling Claude with article markdown:
   - System prompt: "Extract 3-5 actionable tips from this article"
   - Parse structured response into `ai_daily_tips` rows
5. **Store in DB**:
   - Insert feed item with `feed_date = todayMytDateString()`
   - Insert associated tips
   - Call `revalidateTag('daily-feed')` to purge landing page cache
6. **Return status**: Count of sources processed, tips generated, errors

**Key safeguard**: `todayMytDateString()` computes `Date.now() + 8 hours`, ensuring the cron always writes the MYT calendar date regardless of server timezone.

### 3.2 Landing Page Load (`/`)

**For anonymous users**:

1. Call `getCachedRecentFeed()` which:
   - Queries for `feed_date IN (todayMytDateString(), yesterdayMytDateString())`
   - If both empty: fallback to most recent available edition
   - Returns `{ today: [...], yesterday: [...], todayDate, yesterdayDate }`
2. Render primary section ("Today's tips") with TodayFeedGrid (role/tool filters)
3. Render secondary rail ("Yesterday's tips") only if both today AND yesterday have tips
4. Activity strip polls `GET /api/agent-status` every 30s → if `lastRunAt` advances → `router.refresh()`

**For authenticated users**: Redirect to `/today`

### 3.3 Authenticated Page Load (`/today`)

1. Call `getCachedRecentFeed()` (same two-day window)
2. Call `getViewerContext()` to fetch user profile + saved tip IDs (with RLS)
3. Render same two-day layout but with:
   - Full filtering UI (role, tool, source category)
   - "Save tip" buttons that call `POST /api/tips/{id}/save`
   - Archive section showing prior 3 editions (deduped if yesterday rail visible)

### 3.4 Ask Feature (`/ask`)

**Flow**:

1. User enters question → `POST /api/ask`
2. Backend:
   - Call Tavily search for recent articles on the topic
   - Extract markdown from top 3 results
   - Pass to Claude: "Generate 5 AI tips answering this question based on these articles"
   - Stream response back to client
3. Client renders streaming tip cards

### 3.5 Advisor Feature (`/advisor`)

**Flow**:

1. User uploads article or pastes content → `POST /api/advisor`
2. Backend:
   - If URL: scrape with Firecrawl
   - Call Tavily to find related AI vendor news
   - Pass all content to Claude: "Recommend which tools/vendors from the AI ecosystem are relevant to this content"
   - Stream structured recommendations back
3. Client renders tool recommendations with vendor badges

---

## 4. API Routes

### 4.1 Cron Endpoints

#### `POST /api/cron/daily-feed`

Runs the daily scrape + tip generation job.

**Headers**: `Authorization: Bearer {CRON_SECRET}`

**Response**:
```json
{
  "ok": true,
  "sourcesProcessed": 5,
  "tipsGenerated": 23,
  "feedDate": "2026-05-06",
  "duration": 120,
  "errors": [
    { "source": "YouTube", "error": "blocked domain" }
  ]
}
```

**Side effects**:
- Writes to `ai_daily_feed` and `ai_daily_tips`
- Calls `revalidateTag("daily-feed")`

### 4.2 User Endpoints

#### `GET /api/tips`

Fetch paginated tips for the current day (with user's saved status).

**Query params**: `page=1&limit=20&role=engineer&tool=claude`

**Response**:
```json
{
  "tips": [
    {
      "id": "...",
      "title": "Use structured outputs...",
      "description": "...",
      "source": "OpenAI Blog",
      "isSaved": true
    }
  ],
  "total": 45,
  "page": 1
}
```

#### `POST /api/tips/{id}/save`

Save a tip to user's collection.

**Response**:
```json
{ "success": true, "saved": true }
```

#### `DELETE /api/tips/{id}/save`

Unsave a tip.

**Response**:
```json
{ "success": true, "saved": false }
```

### 4.3 AI Generation Endpoints

#### `POST /api/ask`

Generate tips from a user question.

**Body**:
```json
{
  "question": "How do I use Claude's structured outputs?"
}
```

**Response** (streaming text/event-stream):
```
data: { "chunk": "Use structured outputs to..." }
data: { "chunk": "..." }
data: { "done": true }
```

#### `POST /api/advisor`

Get vendor recommendations for a piece of content.

**Body**:
```json
{
  "url": "https://example.com/article",
  // or
  "content": "raw article markdown"
}
```

**Response** (streaming):
```json
{
  "recommendations": [
    {
      "vendor": "Anthropic",
      "tool": "Claude",
      "reason": "best for..."
    }
  ]
}
```

### 4.4 Status Endpoints

#### `GET /api/agent-status`

Real-time status of the daily cron job.

**Response**:
```json
{
  "lastRunAt": "2026-05-06T20:00:00Z",
  "status": "completed|running|failed",
  "tipsCount": 23,
  "sourcesCount": 9,
  "feedDate": "2026-05-06"
}
```

---

## 5. Caching Strategy

### 5.1 Cache Layers

| Layer | Key | TTL | Revalidation |
|-------|-----|-----|--------------|
| `getCachedRecentFeed()` | `["daily-feed-recent-v2", todayMytDate, yesterdayMytDate]` | 1h | `revalidateTag("daily-feed")` on cron success |
| `getCachedFeed()` | `["daily-feed-v1", todayMytDate]` | 1h | same tag |
| `getCachedArchive()` | `["daily-feed-archive-v1", primaryDate]` | 24h | same tag |
| Activity strip | Client-side 30s poll → `router.refresh()` | — | on `lastRunAt` change |

### 5.2 Key Insight: MYT Date in Cache Key

The cache key includes the computed `todayMytDateString()` so that a **midnight MYT rollover automatically grants a new cache slot**. Without this, the cached tuple's internal date strings would drift out of sync with reality after midnight.

### 5.3 Fallback Logic

If both today and yesterday return empty (cron missed ≥2 days):
1. Query for most recent `feed_date` that exists
2. Surface as "yesterday" bucket
3. Stale banner fires: "No new edition yet today · Showing most recent from May 4"
4. Page never goes blank

---

## 6. Authentication & Authorization

### 6.1 Auth Flow

- **Supabase Auth** (email/password, social logins)
- Session stored in HTTP-only cookie
- `getAuthenticatedUser()` server function verifies session

### 6.2 RLS Policies

- **user_saved_tips**: Each user sees only their own saved tips
- **user_profiles**: Each user can view/edit only their own profile
- Public tables (`ai_daily_feed`, `ai_daily_tips`) are readable by all, writable only by system (via cron)

### 6.3 API Authentication

- Public endpoints (`/`) need no auth
- User endpoints (`/tips`, `/tips/{id}/save`) require valid session
- Cron endpoints require `Authorization: Bearer {CRON_SECRET}` (in Supabase vault)

---

## 7. Error Handling & Monitoring

### 7.1 Cron Job Safeguards

- **YouTube/video platform rejection**: URLs are checked against blocklist before scraping
- **Error page detection**: Scraped content is checked for 403, "Access Denied", "Checking your browser" patterns
- **Minimum content length**: Articles < 300 chars are rejected
- **Source duplication**: Duplicate URLs per day are skipped

### 7.2 Fallback Mechanisms

- **Missing today's edition**: Show yesterday's edition with stale banner
- **Missing both today & yesterday**: Show most recent available edition
- **Empty archive**: Don't render the archive section

### 7.3 Logging & Alerts

- Each cron run logs source-by-source results (ok, error, blocked, skipped)
- Failed cron runs should alert via Sentry or email
- Activity strip tracks `lastRunAt` so users know if the feed is stale

---

## 8. Performance Optimization

### 8.1 Real-Time Freshness

- Activity strip polls every 30s → triggers `router.refresh()` on new `lastRunAt`
- No manual page reload needed; users see tips within 30s of cron completion
- Stale banner appears immediately if cron is delayed

### 8.2 Caching & Revalidation

- Landing page cached for 1h, revalidated the moment a new edition exists
- Archive cached for 24h (changes infrequently)
- Per-user saved tips queries not cached (small result sets, RLS overhead minimal)

### 8.3 Lazy Loading

- Tip cards render in a masonry grid, image loading is deferred
- Archive section is collapsed by default on mobile
- Filtering UI uses client-side state (no new API call per filter change)

---

## 9. Deployment & Infrastructure

### 9.1 Hosting

- **Frontend + API**: Vercel (Next.js serverless functions)
- **Database**: Supabase PostgreSQL (managed)
- **File storage**: Vercel Blob (for user-uploaded articles in Advisor feature)
- **Secrets**: Supabase Vault (CRON_SECRET, TAVILY_API_KEY, Firecrawl API key)

### 9.2 Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... (server-only)

TAVILY_API_KEY=... (for Ask/Advisor)
FIRECRAWL_API_KEY=... (for scraping)

CRON_SECRET=... (for /api/cron endpoints)
```

### 9.3 Deployment Checklist

- [ ] All secrets added to Vercel project
- [ ] Database migrations run (`scripts/` folder)
- [ ] RLS policies enabled on all user tables
- [ ] Cron job scheduled externally (external service or Vercel Cron)
- [ ] Activity strip polling works (check 30s interval in browser Network tab)
- [ ] Cache revalidation tested (trigger cron, verify landing page updates within 30s)
- [ ] Fallback tested (manually delete today's feed, verify yesterday/archive shows)

---

## 10. Known Issues & Lessons Learned

### 10.1 UTC vs MYT Date Mismatch (CRITICAL BUG - FIXED)

**What went wrong**: 
- Cron wrote `feed_date` using `new Date().toISOString().slice(0, 10)` (UTC date)
- Landing page queried using MYT date calculation
- During 8-hour UTC/MYT overlap (e.g., 00:00–07:59 MYT = previous day UTC), they diverged
- Result: Cron wrote to May 5 UTC, page read from May 6 MYT → permanent miss

**Fix**:
- Cron now uses `Date.now() + 8h` to compute MYT date
- All queries use the same MYT calculation
- Deleted UTC date helper to prevent future misuse

### 10.2 No Fallback for Missing Editions

**What went wrong**:
- If cron missed a day or more, both today and yesterday were empty
- Page showed "Awaiting first edition" blank state
- Users had no content to see

**Fix**:
- `fetchRecentFeed()` now does a second query for the most recent available edition
- Falls back to showing it as "yesterday" with stale banner
- Page never goes blank

### 10.3 YouTube URLs Return 403

**What went wrong**:
- YouTube channel URLs were in news sources
- Firecrawl returned 403 error page
- Claude generated tips from error page: "Quick fix for YouTube 403 errors"

**Fix**:
- Added domain blocklist (YouTube, TikTok, Instagram, etc)
- Added error page detection patterns
- Deactivated YouTube sources in DB
- Cron rejects blocked domains before scraping

---

## 11. Future Roadmap

### Phase 2

- [ ] **Notifications**: Email/push when new tips published in user's interests
- [ ] **User feedback loop**: Upvote/downvote tips to train Claude prompt
- [ ] **Custom sources**: Allow users to submit custom blog URLs for scraping
- [ ] **Trend analysis**: Show trending tips across user base
- [ ] **Export**: Bulk download tips as PDF/CSV

### Phase 3

- [ ] **Multi-language support**: Auto-translate tips to user's language
- [ ] **Browser extension**: Quick access to Ask feature without leaving docs
- [ ] **Slack integration**: Post daily digest to Slack channels
- [ ] **Team workspaces**: Shared saved tips, team-wide recommendations

---

## 12. Conclusion

This app demonstrates a **reliable real-time content pipeline** that transforms industry news into personalized insights. The critical lesson learned was **paying obsessive attention to date/timezone handling** when building systems that rely on calendar-based lookups across multiple timezones. Every date query must be explicit about its timezone and tested across midnight boundaries.

The fixes applied ensure:

✅ Cron and read queries always agree on the MYT date
✅ Page never goes blank, even if cron misses days
✅ Unreliable sources (YouTube) are blocked at the source level
✅ Scraped error pages are detected and rejected
✅ Real-time updates within 30s via activity strip polling

---

**Document version**: v1.0 (May 6, 2026)
**Last updated**: Post-mortem release
