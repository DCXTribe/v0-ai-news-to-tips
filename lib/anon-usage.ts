import { cookies } from "next/headers"

/**
 * Anonymous usage tracking
 * ------------------------------------------------------------------
 * Anonymous (logged-out) users get a single use of each premium surface
 * (Unpack, Ask, Advisor) per rolling window. State lives in a single
 * HTTP-only cookie so the server is the source of truth and JS-side
 * tampering is not possible. localStorage is intentionally NOT used —
 * we don't want two competing sources of truth, and the value of a
 * client-readable counter is small (the page is server-rendered, so
 * the prop arrives populated on first paint).
 *
 * Cookie shape (compact field names to keep the payload tiny):
 *   {
 *     i: <uuid>,           // anonymous identifier (stable, opaque)
 *     u: { p: 0|1, a: 0|1, d: 0|1 },  // used flags for paste/ask/advisor
 *     s: <ms timestamp>,   // start of current window
 *   }
 *
 * Window: 7 days from `s`. After expiry, all flags reset to 0 on read.
 *
 * Edge cases:
 * - User clears cookies → fresh window, fresh quota (expected).
 * - Multiple tabs → cookie shared, can't game it.
 * - Multiple devices → each device has its own quota (expected).
 * - Signs in mid-flow → server skips this whole module for authed users.
 * - Tampers with cookie → worst case they grant themselves a free reset.
 *   We don't sign because the threat model is casual users finding the
 *   limit, not adversarial actors. Heavier abuse mitigation belongs in
 *   rate-limiting middleware or auth.
 */

export const ANON_FEATURES = ["unpack", "ask", "advisor"] as const
export type AnonFeature = (typeof ANON_FEATURES)[number]

const COOKIE_NAME = "ai_daily_anon_usage"
const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 180 // 180 days
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // 1 week

/** Map between AnonFeature and the compact cookie key. */
const FEATURE_KEY: Record<AnonFeature, "p" | "a" | "d"> = {
  unpack: "p",
  ask: "a",
  advisor: "d",
}

type RawCookie = {
  i: string
  u: { p: 0 | 1; a: 0 | 1; d: 0 | 1 }
  s: number
}

export type AnonUsageState = {
  /** Whether each feature still has its single use available in this window. */
  remaining: Record<AnonFeature, boolean>
  /** Wall-clock ms when the current window will reset. */
  resetsAt: number
  /** True if every feature is exhausted (used in this window). */
  exhausted: boolean
}

/* -------------------------------------------------------------------- */
/* Internal helpers                                                     */
/* -------------------------------------------------------------------- */

function freshCookieValue(now: number): RawCookie {
  return { i: cryptoRandomId(), u: { p: 0, a: 0, d: 0 }, s: now }
}

function cryptoRandomId(): string {
  // crypto.randomUUID is available in Node 19+ and the Edge runtime.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  // Fallback (very unlikely path on Vercel runtimes)
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function encode(value: RawCookie): string {
  // Plain JSON in a cookie is fine; we just URI-encode to be safe with
  // any reserved characters. Base64 isn't required and would just bloat.
  return encodeURIComponent(JSON.stringify(value))
}

function decode(raw: string): RawCookie | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<RawCookie>
    if (
      typeof parsed?.i === "string" &&
      typeof parsed?.s === "number" &&
      parsed.u &&
      (parsed.u.p === 0 || parsed.u.p === 1) &&
      (parsed.u.a === 0 || parsed.u.a === 1) &&
      (parsed.u.d === 0 || parsed.u.d === 1)
    ) {
      return parsed as RawCookie
    }
    return null
  } catch {
    return null
  }
}

/** Apply the rolling reset. Returns the (possibly reset) cookie state. */
function maybeReset(value: RawCookie, now: number): RawCookie {
  if (now - value.s >= WINDOW_MS) {
    return { i: value.i, u: { p: 0, a: 0, d: 0 }, s: now }
  }
  return value
}

function toState(value: RawCookie): AnonUsageState {
  const remaining: Record<AnonFeature, boolean> = {
    unpack: value.u.p === 0,
    ask: value.u.a === 0,
    advisor: value.u.d === 0,
  }
  return {
    remaining,
    resetsAt: value.s + WINDOW_MS,
    exhausted: !remaining.unpack && !remaining.ask && !remaining.advisor,
  }
}

/* -------------------------------------------------------------------- */
/* Public API                                                           */
/* -------------------------------------------------------------------- */

/**
 * Read the anonymous user's current quota state. Safe to call from a
 * Server Component or a Route Handler; it never writes the cookie back.
 */
export async function getAnonUsageState(): Promise<AnonUsageState> {
  const jar = await cookies()
  const raw = jar.get(COOKIE_NAME)?.value
  const now = Date.now()
  const decoded = raw ? decode(raw) : null
  const value = decoded ? maybeReset(decoded, now) : freshCookieValue(now)
  return toState(value)
}

/**
 * Mark a feature as consumed for the anonymous user. Returns the new
 * state. Must only be called from a Route Handler / Server Action so the
 * cookie can actually be written.
 *
 * Idempotent within a window: calling consume on an already-used feature
 * does not throw, but state is unchanged.
 */
export async function consumeAnonUsage(feature: AnonFeature): Promise<AnonUsageState> {
  const jar = await cookies()
  const raw = jar.get(COOKIE_NAME)?.value
  const now = Date.now()
  const current = raw ? decode(raw) : null
  const reset = current ? maybeReset(current, now) : freshCookieValue(now)

  const key = FEATURE_KEY[feature]
  reset.u = { ...reset.u, [key]: 1 }

  jar.set(COOKIE_NAME, encode(reset), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_S,
  })

  return toState(reset)
}

/**
 * Convenience: consult state for a single feature.
 * Returns true if the anonymous user still has their free use available.
 */
export async function anonHasUseLeft(feature: AnonFeature): Promise<boolean> {
  const state = await getAnonUsageState()
  return state.remaining[feature]
}
