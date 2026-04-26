"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { TipCard, type Tip } from "@/components/tip-card"
import { ResultsCta } from "@/components/results-cta"
import { AnonUsageBadge } from "@/components/anon-usage-badge"
import { toast } from "sonner"
import {
  Loader2,
  Sparkles,
  Link2,
  Clipboard,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

const URL_RE = /^https?:\/\/\S+$/i

/**
 * Unpack — purpose: turn one specific article into 3-5 actionable tips.
 *
 * Design choices:
 * - URL field is the primary affordance (most common input). Paste-from-clipboard
 *   button so users don't have to switch apps.
 * - Long-form pasted text is a secondary affordance (collapsed by default to
 *   keep the form short, expanded automatically when the URL field is empty
 *   and the user has typed >50 chars suggesting they're pasting article body).
 * - Source preview card on success appears BEFORE the summary so the user can
 *   verify we scraped the right article before reading tips.
 */
export function UnpackForm({
  isAuthed,
  hasProfile,
  anonRemaining,
  anonResetsAt,
}: {
  isAuthed: boolean
  hasProfile: boolean
  /** Null when authed; boolean when anon. Server-rendered initial value. */
  anonRemaining: boolean | null
  anonResetsAt: number | null
}) {
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [textOpen, setTextOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [tips, setTips] = useState<Tip[] | null>(null)
  const [source, setSource] = useState<{ url: string; title: string; publisher: string | null } | null>(null)
  // Track quota client-side so we can flip to the exhausted state
  // immediately after a successful generation without a page refresh.
  const [remaining, setRemaining] = useState<boolean | null>(anonRemaining)
  const [resetsAt, setResetsAt] = useState<number | null>(anonResetsAt)
  const resultRef = useRef<HTMLDivElement>(null)

  const showAnonBadge = !isAuthed && remaining !== null
  const isExhausted = !isAuthed && remaining === false

  const inputForServer = url.trim() || text.trim()
  const hasInput = inputForServer.length >= 20

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText()
      if (!clip) {
        toast.error("Clipboard is empty.")
        return
      }
      if (URL_RE.test(clip.trim())) {
        setUrl(clip.trim())
      } else {
        setText(clip)
        setTextOpen(true)
      }
    } catch {
      toast.error("Couldn't read clipboard. Paste manually.")
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasInput) {
      toast.error("Paste an article URL or at least a short excerpt.")
      return
    }
    setLoading(true)
    setSummary(null)
    setTips(null)
    setSource(null)
    try {
      const res = await fetch("/api/unpack", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: inputForServer }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        // 429 = anonymous quota reached. Flip the badge to its exhausted
        // state and surface the same copy in the toast.
        if (res.status === 429 && j?.code === "anon_quota_reached" && j?.anon) {
          setRemaining(false)
          setResetsAt(j.anon.resetsAt ?? resetsAt)
        }
        throw new Error(j.error ?? "Failed")
      }
      const data = (await res.json()) as {
        summary: string
        tips: Tip[]
        source: { url: string; title: string; publisher: string | null } | null
        anon?: { remaining: { unpack: boolean }; resetsAt: number }
      }
      setSummary(data.summary)
      setTips(data.tips)
      setSource(data.source)
      if (data.anon) {
        setRemaining(data.anon.remaining.unpack)
        setResetsAt(data.anon.resetsAt)
      }
      // Smooth scroll to result
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setUrl("")
    setText("")
    setTextOpen(false)
    setSummary(null)
    setTips(null)
    setSource(null)
  }

  const showResult = tips && tips.length > 0

  return (
    <div className="flex flex-col gap-8">
      {/* Exhausted gate replaces the composer entirely so the user can't
          submit and burn an extra request. The previous result (if any)
          stays rendered below — they keep the value of their first use. */}
      {isExhausted && resetsAt !== null && (
        <AnonUsageBadge kind="unpack" remaining={false} resetsAt={resetsAt} />
      )}

      {!isExhausted && (
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardContent className="p-0">
          <form onSubmit={onSubmit} className="flex flex-col">
            {/* Primary URL input — large, prominent */}
            <div className="flex flex-col gap-2 border-b border-border/60 bg-card p-4 md:p-5">
              <label htmlFor="article-url" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
                <Link2 className="h-3.5 w-3.5 text-primary" aria-hidden />
                Article URL
              </label>
              <div className="flex gap-2">
                <Input
                  id="article-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://openai.com/blog/..."
                  className="h-11 rounded-xl text-sm md:text-base"
                  inputMode="url"
                  autoComplete="url"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handlePaste}
                  className="h-11 shrink-0 rounded-xl px-3"
                  aria-label="Paste from clipboard"
                  title="Paste from clipboard"
                >
                  <Clipboard className="h-4 w-4" aria-hidden />
                  <span className="hidden md:inline">Paste</span>
                </Button>
              </div>
            </div>

            {/* Secondary: pasted text, collapsed by default */}
            <div className="border-b border-border/60 bg-surface-low/40">
              <button
                type="button"
                onClick={() => setTextOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-xs font-medium text-muted-foreground transition hover:text-foreground md:px-5"
                aria-expanded={textOpen}
                aria-controls="article-text-region"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" aria-hidden />
                  Or paste the article text {text && <span className="text-foreground">({text.length} chars)</span>}
                </span>
                {textOpen ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
              </button>
              {textOpen && (
                <div id="article-text-region" className="px-4 pb-4 md:px-5 md:pb-5">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    placeholder="Paste the article content here. Useful when the URL is behind a paywall."
                    className="resize-y rounded-xl bg-card text-sm"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Pasting the full text always works, even when the article is behind a paywall.
                  </p>
                </div>
              )}
            </div>

            {/* Footer — meta + submit */}
            <div className="flex flex-col gap-3 bg-card p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
              <div className="flex flex-col gap-2 text-xs leading-relaxed text-muted-foreground">
                {showAnonBadge && remaining === true && resetsAt !== null && (
                  <AnonUsageBadge kind="unpack" remaining resetsAt={resetsAt} />
                )}
                {!isAuthed && <span>Tips are kept until you leave the page. Sign in to save them.</span>}
                {isAuthed && !hasProfile && (
                  <span>
                    <a href="/onboarding" className="font-medium text-foreground underline-offset-4 hover:underline">
                      Set your role
                    </a>{" "}
                    to tailor tips.
                  </span>
                )}
                {isAuthed && hasProfile && <span>Tips will be tailored to your role and saved to your library.</span>}
              </div>
              <Button type="submit" disabled={loading || !hasInput} size="lg" className="rounded-xl">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Unpacking...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Unpack into tips
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Result — source preview first (verify), then summary, then tips */}
      {showResult && (
        <div ref={resultRef} className="flex scroll-mt-20 flex-col gap-5">
          <ResultsCta isAuthed={isAuthed} kind="unpack" />

          {/* Source verification card — what we actually scraped */}
          {source && (
            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                <FileText className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  We unpacked
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-baseline gap-1.5 text-pretty text-sm font-medium leading-snug text-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  <span className="line-clamp-2">{source.title}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 translate-y-0.5 text-muted-foreground transition group-hover:text-primary" aria-hidden />
                </a>
                {source.publisher && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{source.publisher}</p>
                )}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={reset} className="rounded-full text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">New article</span>
              </Button>
            </div>
          )}

          {summary && (
            <div className="rounded-2xl border border-border/60 bg-accent/40 p-5">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                What this article said
              </div>
              <p className="text-sm leading-relaxed">{summary}</p>
            </div>
          )}

          <div>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {tips!.length} tip{tips!.length === 1 ? "" : "s"} for you
              </h2>
              <span className="text-xs text-muted-foreground">Tap any tip to copy its prompt</span>
            </div>
            <div className={cn("grid gap-6", tips!.length >= 2 && "md:grid-cols-2")}>
              {tips!.map((t) => (
                <TipCard key={t.id} tip={t} isAuthed={isAuthed} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
