# Bootstrap the first edition

The Vercel Cron schedule is `0 20 * * *` (UTC) = **04:00 MYT every night**, so the agent will fire automatically the next morning after deploy. If you want to seed the very first edition right now instead of waiting, the cron route accepts a manual trigger.

## One-liner — run it from anywhere

```bash
curl -i "https://<your-deployed-domain>/api/cron/daily-feed?secret=$CRON_SECRET"
```

For local dev (with the dev server on `localhost:3000`):

```bash
curl -i "http://localhost:3000/api/cron/daily-feed?secret=$CRON_SECRET"
```

Or paste the URL straight into a browser tab while logged in to the same machine that has the env loaded — same effect.

`CRON_SECRET` is already configured in this Vercel project; you can copy it from **Project Settings → Environment Variables** or `.env.local`.

## What happens when you hit it

1. Auth check — `Authorization: Bearer <CRON_SECRET>` header OR `?secret=<CRON_SECRET>` query param.
2. Idempotency guard — if `ai_daily_feed` already has rows for today's UTC date, returns `{ skipped: true }` without doing any work.
3. Stale housekeeping — flips `is_stale=true` on tips with `source_published_at` older than 30 days.
4. Source loop (parallel, 5 sources, ~30–60s total):
   - Tavily search for the latest article from each vendor (domain-scoped).
   - URL-dedup against entire feed history.
   - Firecrawl scrape of the article body (skips bodies under 300 chars).
   - Vercel AI Gateway (`openai/gpt-5-mini`) generates one news entry + one tip.
   - Inserts one row into `ai_daily_feed` and one into `ai_daily_tips`.
   - Stamps `last_scraped_at` on the source row.
5. Cache purge — `revalidateTag(FEED_CACHE_TAG)` and `revalidateTag(AGENT_STATUS_CACHE_TAG)` so the hero eyebrow timestamp and Live Agent Activity strip move in lockstep.

## Expected response

```json
{
  "ok": true,
  "date": "2026-04-26",
  "inserted_count": 5,
  "failed_count": 0,
  "inserted": [
    { "source": "OpenAI Blog", "headline": "..." },
    { "source": "Anthropic News", "headline": "..." },
    { "source": "Microsoft AI Blog", "headline": "..." },
    { "source": "Google AI Blog", "headline": "..." },
    { "source": "Perplexity Newsroom", "headline": "..." }
  ],
  "failed": []
}
```

## After it returns

1. Open `/today` — you should see the new edition with role chip filters at the top.
2. Open `/` — the hero eyebrow should read `Last agent run: HH:MM MYT` matching the row count from the JSON response.
3. Run `scripts/audit-source-links.ts` (paste into your shell) to confirm every inserted tip has a live, non-paywalled source URL — required for REQ-LINK-05 before submission.

## If it returns `{ skipped: true }`

You already have an edition for today's UTC date. Re-run with the SQL escape hatch from `scripts/cron-health.sql` if you need to force a fresh run during testing — but be aware that the URL-dedup guard means re-running won't pick the same articles, you'll need newer ones to land.
