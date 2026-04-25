import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookmarkCheck, History, Sparkles, ArrowRight } from "lucide-react"

/**
 * Strip shown after a successful Unpack or Ask generation.
 *
 * - Anonymous: convert to sign-up. Anonymous tips are returned inline only —
 *   they have temporary IDs, are not persisted, and will be lost when the
 *   session ends. Make that obvious and offer the upgrade.
 * - Authed: confirm the work was persisted to history and link there directly.
 */
export function ResultsCta({ isAuthed, kind }: { isAuthed: boolean; kind: "unpack" | "ask" | "advisor" }) {
  if (isAuthed) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-[color:var(--success)]/25 bg-[color:var(--success-soft)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color:var(--success)]/15 text-[color:var(--success)]">
            <BookmarkCheck className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[color:var(--success)]">Saved to your library</p>
            <p className="text-xs leading-relaxed text-foreground/75 sm:text-sm">
              These tips are now in your history. Tap{" "}
              <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
                <BookmarkCheck className="h-3 w-3" aria-hidden />
                Save
              </span>{" "}
              on the ones you actually want to use later.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full bg-card sm:shrink-0">
          <Link href="/library">
            <History className="h-4 w-4" aria-hidden />
            View library
          </Link>
        </Button>
      </div>
    )
  }

  // Anonymous — convert
  const next = kind === "unpack" ? "/unpack" : kind === "advisor" ? "/advisor" : "/ask"
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Don&apos;t lose this work</p>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            These tips aren&apos;t saved yet. Create a free account to keep them in your library, see your history, and
            tailor future results to your role.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button asChild size="sm" className="rounded-full">
          <Link href={`/auth/sign-up?next=${encodeURIComponent(next)}`}>
            Sign up free <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link href={`/auth/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
        </Button>
      </div>
    </div>
  )
}
