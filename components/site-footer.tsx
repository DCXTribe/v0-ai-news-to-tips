import Link from "next/link"
import { Sparkles } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-surface-low/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2 md:max-w-xs">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span>AI Daily</span>
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Practical AI tips for everyday work. Sourced from official vendor blogs every morning.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">Product</p>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Today
            </Link>
            <Link href="/unpack" className="text-sm text-muted-foreground hover:text-foreground">
              Unpack
            </Link>
            <Link href="/ask" className="text-sm text-muted-foreground hover:text-foreground">
              Ask
            </Link>
            <Link href="/library" className="text-sm text-muted-foreground hover:text-foreground">
              Library
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">Works with</p>
            <span className="text-sm text-muted-foreground">Microsoft Copilot</span>
            <span className="text-sm text-muted-foreground">ChatGPT</span>
            <span className="text-sm text-muted-foreground">Gemini</span>
            <span className="text-sm text-muted-foreground">Claude · Perplexity</span>
          </div>
          <div className="flex flex-col gap-2">
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
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} AI Daily</p>
          <p>Tips grounded in official AI vendor sources.</p>
        </div>
      </div>
    </footer>
  )
}
