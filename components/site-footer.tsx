import Link from "next/link"
import { Sparkles, Wrench } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { toolLabel } from "@/lib/constants"

/**
 * Auth-aware site footer.
 *
 * Anonymous: full 3-col footer (Product / Works with / Account) with sign-in CTAs.
 * Logged-in:  condensed footer — Product col still useful, "Your toolkit" reflects
 *             the user's actual selected tools (or a soft prompt to set them up),
 *             Account col hides marketing links and surfaces Profile/Library/Sign-out.
 *
 * Mobile: shrinks vertical padding when the bottom nav is present (md:hidden footer
 *         padding) to avoid a "tower of bottom UI". Bottom safe-area is respected
 *         so the copyright never collides with the iOS home indicator.
 */
export async function SiteFooter() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // For logged-in users we want to show their real toolkit in "Works with"
  let userTools: string[] = []
  if (user) {
    const { data: profile } = await supabase
      .from("ai_daily_profiles")
      .select("tools")
      .eq("id", user.id)
      .maybeSingle()
    userTools = ((profile?.tools as string[] | null) ?? []).slice(0, 6)
  }

  const isAuthed = !!user
  const todayHref = isAuthed ? "/today" : "/"

  return (
    <footer className="mt-auto border-t border-border/60 bg-surface-low/50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2 md:max-w-xs">
          <Link href={todayHref} className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span>AI Daily</span>
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Practical AI tips for everyday work. Sourced from official vendor blogs every morning.
          </p>
        </div>

        {/* Mobile-only toolkit summary for logged-in users.
            On mobile the Product col is duplicated by the bottom nav and the
            Account col is duplicated by the header user-menu, so we hide both.
            We keep one quiet line that surfaces the user's actual toolkit
            (the only mobile-useful info) with an unobtrusive edit affordance. */}
        {isAuthed && (
          <div className="flex flex-col gap-1.5 md:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">Your toolkit</p>
            {userTools.length > 0 ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {userTools.map((t) => toolLabel(t)).join(" · ")}
                {" "}
                <Link
                  href="/profile"
                  className="ml-1 inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  <Wrench className="h-3 w-3" aria-hidden />
                  Edit
                </Link>
              </p>
            ) : (
              <Link
                href="/onboarding?next=/today"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Choose your toolkit
              </Link>
            )}
          </div>
        )}

        {/* Tablet & desktop: full 3-col footer.
            For anonymous users this also shows on mobile — they don't have the
            bottom nav, so they need the Product/Works with/Account columns. */}
        <div
          className={
            isAuthed
              ? "hidden grid-cols-3 gap-x-10 gap-y-3 md:grid"
              : "grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 sm:gap-x-10"
          }
        >
          {/* Product col */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">Product</p>
            <Link href={todayHref} className="text-sm text-muted-foreground hover:text-foreground">
              Today
            </Link>
            <Link href="/unpack" className="text-sm text-muted-foreground hover:text-foreground">
              Unpack
            </Link>
            <Link href="/advisor" className="text-sm text-muted-foreground hover:text-foreground">
              Advisor
            </Link>
            <Link href="/ask" className="text-sm text-muted-foreground hover:text-foreground">
              Ask
            </Link>
            {isAuthed && (
              <Link href="/library" className="text-sm text-muted-foreground hover:text-foreground">
                Library
              </Link>
            )}
          </div>

          {/* Works with — generic for anonymous, your toolkit for logged-in.
              The "Edit toolkit" link previously used `text-primary` which made
              it the only colored item in an otherwise muted list — visually
              jarring. Switched to muted-foreground with primary on hover so it
              reads as part of the directory until the user reaches for it. */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
              {isAuthed ? "Your toolkit" : "Works with"}
            </p>
            {isAuthed ? (
              userTools.length > 0 ? (
                <>
                  {userTools.map((t) => (
                    <span key={t} className="text-sm text-muted-foreground">
                      {toolLabel(t)}
                    </span>
                  ))}
                  <Link
                    href="/profile"
                    className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    <Wrench className="h-3 w-3" aria-hidden />
                    Edit toolkit
                  </Link>
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">No tools set yet</span>
                  <Link
                    href="/onboarding?next=/today"
                    className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Choose your toolkit
                  </Link>
                </>
              )
            ) : (
              <>
                <span className="text-sm text-muted-foreground">Microsoft Copilot</span>
                <span className="text-sm text-muted-foreground">ChatGPT · Gemini</span>
                <span className="text-sm text-muted-foreground">Claude · Perplexity</span>
                <span className="text-sm text-muted-foreground">Kimi · DeepSeek · Qwen</span>
              </>
            )}
          </div>

          {/* Account col */}
          <div className="col-span-2 flex flex-col gap-2 sm:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">Account</p>
            {isAuthed ? (
              <>
                <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground">
                  My profile
                </Link>
                <Link href="/library" className="text-sm text-muted-foreground hover:text-foreground">
                  My library
                </Link>
                <Link
                  href="/onboarding?next=/profile"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Edit preferences
                </Link>
                <form action="/auth/sign-out" method="post" className="mt-0.5">
                  <button
                    type="submit"
                    className="text-left text-sm text-muted-foreground hover:text-foreground"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
                  Sign in
                </Link>
                <Link href="/auth/sign-up" className="text-sm text-muted-foreground hover:text-foreground">
                  Create account
                </Link>
                <Link href="/onboarding" className="text-sm text-muted-foreground hover:text-foreground">
                  Preferences
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:px-6 sm:py-4">
          <p>© {new Date().getFullYear()} AI Daily</p>
          {/* Tagline only on tablet+ — mobile keeps the copyright as a single quiet line. */}
          <p className="hidden sm:block">Tips grounded in official AI vendor sources.</p>
        </div>
      </div>
    </footer>
  )
}
