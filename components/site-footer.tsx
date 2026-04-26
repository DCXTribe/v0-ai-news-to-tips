import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { BrandMark } from "@/components/brand-mark"

/**
 * Auth-aware site footer.
 *
 * Anonymous: full 3-col marketing footer (Product / Works with / Account) so
 *            visitors who don't yet have the post-login chrome can still
 *            navigate, sign in, and see vendor compatibility.
 *
 * Logged-in: minimal copyright-only bar. The full footer was previously rendered
 *            on every authenticated page and duplicated three already-present
 *            surfaces — Product col duplicated the bottom nav, Account col
 *            duplicated the header user-menu, and "Your toolkit" duplicated the
 *            personalization banner on /today and the chip strip on /advisor.
 *            Toolkit edits live in /onboarding (Edit preferences) and are
 *            reachable from the user-menu, so no separate "Edit toolkit" link
 *            is needed here.
 *
 * Bottom safe-area is honored so the © line never collides with the iOS home
 * indicator on top of the bottom nav.
 */
export async function SiteFooter() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isAuthed = !!user

  // Logged-in users get a thin copyright-only footer. Every other footer link
  // is already reachable via persistent chrome (header user-menu + bottom nav
  // on mobile, header tabs on desktop).
  if (isAuthed) {
    return (
      <footer className="mt-auto border-t border-border/60 bg-surface-low/50 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-3 text-xs text-muted-foreground sm:px-6 sm:py-4">
          <p>© {new Date().getFullYear()} AI Daily · Grounded in official AI vendor sources</p>
        </div>
      </footer>
    )
  }

  // Anonymous: full marketing footer.
  return (
    <footer className="mt-auto border-t border-border/60 bg-surface-low/50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2 md:max-w-xs">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <BrandMark size={28} />
            <span>AI Daily</span>
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Practical AI tips for everyday work. Sourced from official vendor blogs every morning.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 sm:gap-x-10">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">Product</p>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
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
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">Works with</p>
            <span className="text-sm text-muted-foreground">Microsoft Copilot</span>
            <span className="text-sm text-muted-foreground">ChatGPT · Gemini</span>
            <span className="text-sm text-muted-foreground">Claude · Perplexity</span>
            <span className="text-sm text-muted-foreground">Kimi · DeepSeek · Qwen</span>
          </div>

          <div className="col-span-2 flex flex-col gap-2 sm:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">Account</p>
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Link href="/auth/sign-up" className="text-sm text-muted-foreground hover:text-foreground">
              Create account
            </Link>
            <Link href="/onboarding" className="text-sm text-muted-foreground hover:text-foreground">
              Preferences
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:px-6 sm:py-4">
          <p>© {new Date().getFullYear()} AI Daily</p>
          <p className="hidden sm:block">Tips grounded in official AI vendor sources.</p>
        </div>
      </div>
    </footer>
  )
}
