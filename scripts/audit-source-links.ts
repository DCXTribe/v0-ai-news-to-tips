/**
 * Pre-submission audit — REQ-LINK-05 and REQ-LIVE-02.
 *
 * Two checks, run in order:
 *
 *   1. Freshness — print the age of the most recent successful cron run.
 *      Pass if < 36h (per PRD §3.5 REQ-LIVE-02), warn 36–48h, fail > 48h.
 *
 *   2. Source link audit — fetch every `source_url` on the latest edition's
 *      tips and report status. 200 passes. 401 auto-flags `is_paywalled=true`
 *      so the UI can render the "Subscription required" badge. 4xx / 5xx
 *      means the cron parsed wrong — re-run before submitting.
 *
 * Run: `npx tsx scripts/audit-source-links.ts`
 *
 * Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (already set in
 * production for the cron). The script only ever READS tips; the only write
 * is the paywall flag, which is gated by an env opt-in.
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APPLY_PAYWALL_FLAGS = process.env.APPLY_PAYWALL_FLAGS === "1"

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env. Aborting.")
  process.exit(2)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ---------------------------------------------------------------------------
// Step 1. Freshness check (REQ-LIVE-02)
// ---------------------------------------------------------------------------

console.log("\n=== AI Daily — Pre-submission audit ===\n")
console.log("Step 1 / 2  ·  Cron freshness check (REQ-LIVE-02)\n")

const { data: latestFeed } = await sb
  .from("ai_daily_feed")
  .select("created_at, feed_date")
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle()

if (!latestFeed) {
  console.log("  FAIL — No feed rows. The cron has never run successfully. Trigger /api/cron/daily-feed.")
  process.exit(1)
}

const ageMs = Date.now() - new Date(latestFeed.created_at).getTime()
const ageHrs = ageMs / 36e5
const ageLabel =
  ageHrs < 1 ? `${Math.round(ageHrs * 60)}m` : `${ageHrs.toFixed(1)}h`

if (ageHrs < 36) {
  console.log(`  PASS — Last run ${ageLabel} ago (edition ${latestFeed.feed_date}). Fresh enough for submission.`)
} else if (ageHrs < 48) {
  console.log(`  WARN — Last run ${ageLabel} ago. Re-run cron before T-12h to be safe.`)
} else {
  console.log(`  FAIL — Last run ${ageLabel} ago (> 48h). Trigger cron NOW with CRON_SECRET.`)
}

// ---------------------------------------------------------------------------
// Step 2. Source link audit (REQ-LINK-05)
// ---------------------------------------------------------------------------

console.log("\nStep 2 / 2  ·  Source link audit (REQ-LINK-05)\n")

// Pull every tip on the latest edition by joining through ai_daily_feed.
const { data: feedRows } = await sb
  .from("ai_daily_feed")
  .select("id")
  .eq("feed_date", latestFeed.feed_date)

if (!feedRows || feedRows.length === 0) {
  console.log("  FAIL — Latest edition has zero feed rows. Nothing to audit.")
  process.exit(1)
}

const { data: tips } = await sb
  .from("ai_daily_tips")
  .select("id, source_url, source_publisher, is_paywalled")
  .in("feed_id", feedRows.map((r) => r.id))

if (!tips || tips.length === 0) {
  console.log("  FAIL — Latest edition has feed rows but zero tips. Cron likely partially failed.")
  process.exit(1)
}

type AuditRow = {
  id: string
  url: string
  publisher: string | null
  status: number | "error"
  verdict: "PASS" | "PAYWALL" | "FAIL" | "NULL"
}

const results: AuditRow[] = []

// Fetch with HEAD first, fallback to GET because some hosts (notably Cloudflare-
// fronted vendor blogs) return 405 for HEAD. 8s timeout per URL.
async function probe(url: string): Promise<number | "error"> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 8000)
  try {
    const head = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal })
    if (head.status !== 405 && head.status !== 501) return head.status
    const get = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal })
    return get.status
  } catch {
    return "error"
  } finally {
    clearTimeout(t)
  }
}

// Probe all in parallel — they're independent and each is short.
await Promise.all(
  tips.map(async (t) => {
    if (!t.source_url || t.source_url === "user-pasted") {
      results.push({ id: t.id, url: "(null)", publisher: t.source_publisher, status: "error", verdict: "NULL" })
      return
    }
    const status = await probe(t.source_url)
    let verdict: AuditRow["verdict"]
    if (status === 200) verdict = "PASS"
    else if (status === 401 || status === 403) verdict = "PAYWALL"
    else verdict = "FAIL"
    results.push({ id: t.id, url: t.source_url, publisher: t.source_publisher, status, verdict })
  }),
)

// ---------------------------------------------------------------------------
// Report + optional paywall flagging
// ---------------------------------------------------------------------------

const counts = { PASS: 0, PAYWALL: 0, FAIL: 0, NULL: 0 }
for (const r of results) counts[r.verdict] += 1

console.log(`  ${results.length} tip(s) audited\n`)
for (const r of results) {
  const icon =
    r.verdict === "PASS" ? "  OK    " : r.verdict === "PAYWALL" ? "  401   " : r.verdict === "NULL" ? "  NULL  " : "  FAIL  "
  const host = r.url === "(null)" ? "(missing source_url)" : new URL(r.url).hostname.replace(/^www\./, "")
  console.log(`${icon} ${String(r.status).padEnd(5)}  ${host.padEnd(28)}  ${r.id}`)
}

console.log("")
console.log(
  `  Summary  ·  ${counts.PASS} pass · ${counts.PAYWALL} paywall · ${counts.FAIL} fail · ${counts.NULL} null`,
)

// Paywall auto-flagging (only when explicitly opted in, so a stray run can't
// silently mark every link 401).
if (APPLY_PAYWALL_FLAGS) {
  const paywalledIds = results.filter((r) => r.verdict === "PAYWALL").map((r) => r.id)
  if (paywalledIds.length > 0) {
    const { error } = await sb
      .from("ai_daily_tips")
      .update({ is_paywalled: true })
      .in("id", paywalledIds)
    if (error) console.log(`\n  Failed to apply paywall flags: ${error.message}`)
    else console.log(`\n  Applied is_paywalled=true to ${paywalledIds.length} tip(s).`)
  }
} else if (counts.PAYWALL > 0) {
  console.log("\n  Tip: re-run with APPLY_PAYWALL_FLAGS=1 to set is_paywalled=true on the 401 tips.")
}

// Exit code: non-zero if any FAIL or NULL — block submission until cleaned.
if (counts.FAIL > 0 || counts.NULL > 0) {
  console.log("\n  AUDIT FAILED — fix the cron output before submitting.\n")
  process.exit(1)
}
console.log("\n  Audit clean. Ready for submission.\n")
