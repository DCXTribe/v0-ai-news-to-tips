import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * POST /api/upgrade/promo
 *
 * Body: { code: string }
 *
 * Redeems a promo code for the authenticated viewer. On success:
 *   - Inserts a row into `promo_redemptions` (PK on (code, user_id) prevents
 *     double-redemption; we surface a friendly error instead of leaking the
 *     constraint name).
 *   - Increments `promo_codes.redemptions_count`.
 *   - Sets `ai_daily_profiles.is_paid = true` and
 *     `paid_until = now() + paid_months_granted months` — extending an
 *     existing paid window if one is in flight.
 *
 * The whole flow runs through the service client because:
 *   1. We need to bump `promo_codes.redemptions_count` (RLS forbids user
 *      writes on that table).
 *   2. We need to write `ai_daily_profiles.is_paid` (same reason).
 *
 * The auth check happens up-front against the user-scoped client; the actual
 * mutations use the service client. The user_id we write is the cookie-bound
 * user, never client input — the request body's `code` is the only
 * user-controlled value.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Body = { code?: unknown }

const CODE_RE = /^[A-Z0-9_-]{3,32}$/

function err(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(req: Request) {
  // 1. Auth ----------------------------------------------------------------
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err(401, "Sign in to redeem a promo code.")

  // 2. Parse + validate input ----------------------------------------------
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return err(400, "Invalid JSON body.")
  }

  const raw = typeof body.code === "string" ? body.code.trim().toUpperCase() : ""
  if (!CODE_RE.test(raw)) {
    return err(400, "That code doesn't look right. Try again.")
  }

  // 3. Look up code (case-sensitive in DB; we uppercase here on input) -----
  const service = createServiceClient()
  const { data: code, error: codeErr } = await service
    .from("promo_codes")
    .select("code, paid_months_granted, max_redemptions, redemptions_count, expires_at")
    .eq("code", raw)
    .maybeSingle()

  if (codeErr) return err(500, "Couldn't check that code right now. Please try again.")
  if (!code) return err(404, "We don't recognize that code.")

  // 4. Pre-flight checks ---------------------------------------------------
  if (code.expires_at && new Date(code.expires_at as string).getTime() < Date.now()) {
    return err(410, "That code has expired.")
  }
  if (code.redemptions_count >= code.max_redemptions) {
    return err(409, "That code has been fully redeemed.")
  }

  const { data: existingRedemption } = await service
    .from("promo_redemptions")
    .select("redeemed_at")
    .eq("code", raw)
    .eq("user_id", user.id)
    .maybeSingle()
  if (existingRedemption) {
    return err(409, "You've already redeemed that code.")
  }

  // 5. Compute new paid_until: extend if currently paid, else add from now.
  const { data: profile } = await service
    .from("ai_daily_profiles")
    .select("is_paid, paid_until")
    .eq("id", user.id)
    .maybeSingle()

  const now = Date.now()
  const startMs =
    profile?.is_paid && profile.paid_until && new Date(profile.paid_until as string).getTime() > now
      ? new Date(profile.paid_until as string).getTime()
      : now
  const newPaidUntil = new Date(startMs)
  newPaidUntil.setMonth(newPaidUntil.getMonth() + (code.paid_months_granted as number))

  // 6. Mutations -----------------------------------------------------------
  // Order matters: insert redemption first so the unique constraint is the
  // arbiter of "already redeemed". If that fails, no other rows have moved.
  const { error: redemptionErr } = await service
    .from("promo_redemptions")
    .insert({ code: raw, user_id: user.id })
  if (redemptionErr) {
    // PG unique violation = 23505. We covered that path with the explicit
    // existing-redemption check above, but a race could land here.
    if ((redemptionErr as { code?: string }).code === "23505") {
      return err(409, "You've already redeemed that code.")
    }
    return err(500, "Couldn't redeem that code right now. Please try again.")
  }

  const { error: incErr } = await service
    .from("promo_codes")
    .update({ redemptions_count: (code.redemptions_count as number) + 1 })
    .eq("code", raw)
  if (incErr) {
    // The redemption row already exists; we just couldn't bump the counter.
    // That's a soft failure — the user still got their grant. Log it.
    console.log("[v0] promo: redemption ok but counter bump failed:", incErr.message)
  }

  const { error: profileErr } = await service
    .from("ai_daily_profiles")
    .upsert({
      id: user.id,
      is_paid: true,
      paid_until: newPaidUntil.toISOString(),
    })
  if (profileErr) {
    return err(500, "Couldn't activate paid access. Please contact support.")
  }

  return NextResponse.json({
    ok: true,
    paid_until: newPaidUntil.toISOString(),
    paid_months_granted: code.paid_months_granted,
  })
}
