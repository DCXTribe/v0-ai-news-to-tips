import { createClient } from "@/lib/supabase/server"

/**
 * Tier system (PRD v1.4 §15, migration 140).
 *
 * Live schema uses two columns on `ai_daily_profiles`:
 *
 *   - `is_paid`     boolean   — true once a promo code (or future Stripe
 *                               session) has granted paid access.
 *   - `paid_until`  timestamptz nullable — when the grant expires. NULL
 *                               means non-expiring (e.g., comp accounts).
 *
 * The "is this viewer paid right now?" predicate is therefore:
 *
 *     is_paid = true AND (paid_until IS NULL OR paid_until > now())
 *
 * — exactly mirrored in the RLS policies on `ai_daily_feed` and
 * `ai_daily_tips` so the same gate applies whether a SQL caller bypasses the
 * server layer or not.
 *
 * RLS additionally exposes `feed_date = today_MYT` to anyone (including
 * anon), so today's edition is always public. Past editions are paywalled.
 *
 * Usage:
 *
 *     const tier = await getViewerTier()
 *     if (tier.tier !== "paid") redirect("/upgrade?next=/history")
 */

export type Tier = "free" | "paid"

export type ViewerTier = {
  tier: Tier
  /** True when an authenticated user is signed in (regardless of tier). */
  isAuthed: boolean
  /** Auth user id, or null for anonymous viewers. */
  userId: string | null
  /** When the paid grant expires. null while free, or null while paid-forever. */
  paidUntil: string | null
}

/**
 * Read the viewer's tier from `ai_daily_profiles`. Anonymous viewers and
 * users with no profile row both return "free".
 *
 * Uses the user-scoped (cookie-bound) Supabase client. The profile row's
 * own RLS policies allow self-reads; we never see anyone else's profile.
 */
export async function getViewerTier(): Promise<ViewerTier> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { tier: "free", isAuthed: false, userId: null, paidUntil: null }
  }

  const { data: profile } = await supabase
    .from("ai_daily_profiles")
    .select("is_paid, paid_until")
    .eq("id", user.id)
    .maybeSingle()

  const isPaidFlag = profile?.is_paid === true
  const paidUntil = (profile?.paid_until as string | null) ?? null
  const stillValid = paidUntil === null || new Date(paidUntil).getTime() > Date.now()
  const tier: Tier = isPaidFlag && stillValid ? "paid" : "free"

  return {
    tier,
    isAuthed: true,
    userId: user.id,
    paidUntil,
  }
}

/** Convenience: true when the viewer is on the paid tier. */
export async function isViewerPaid(): Promise<boolean> {
  const { tier } = await getViewerTier()
  return tier === "paid"
}
