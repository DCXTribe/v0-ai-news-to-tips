"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { TipCard, type Tip } from "@/components/tip-card"
import { ResultsCta } from "@/components/results-cta"
import { AnonUsageBadge } from "@/components/anon-usage-badge"
import { toast } from "sonner"
import {
  Loader2,
  Sparkles,
  Youtube,
  Mail,
  CalendarClock,
  Search,
  FileText,
  Code2,
  Hash,
  HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Ask — purpose: free-form question, get web-grounded prompts back.
 *
 * Design choices:
 * - Topic chips ABOVE the textarea. Topics suggest a question shape, not a
 *   complete question — clicking inserts a stem the user finishes.
 * - YouTube toggle promoted from buried-below to a top-row option pill so
 *   first-time users see it and understand video sources are available.
 * - The "grounded in real-time web sources" angle is what differentiates Ask
 *   from Advisor and Unpack — we cue this in the placeholder copy and source
 *   chip.
 */

type Topic = {
  value: string
  label: string
  Icon: typeof Mail
  /** Stem inserted into the textarea when clicked. User finishes it. */
  stem: string
}

const TOPICS: Topic[] = [
  { value: "email", label: "Email", Icon: Mail, stem: "How do I use AI to write a " },
  { value: "meetings", label: "Meetings", Icon: CalendarClock, stem: "How do I summarize a " },
  { value: "research", label: "Research", Icon: Search, stem: "How do I research " },
  { value: "documents", label: "Documents", Icon: FileText, stem: "How do I turn a long document into a " },
  { value: "code", label: "Code", Icon: Code2, stem: "How do I use AI to help me write " },
  { value: "social", label: "Social", Icon: Hash, stem: "How do I draft a LinkedIn post about " },
]

export function AskForm({
  isAuthed,
  samples,
  anonRemaining,
  anonResetsAt,
}: {
  isAuthed: boolean
  samples: string[]
  /** Null when authed; boolean when anon. Server-rendered initial value. */
  anonRemaining: boolean | null
  anonResetsAt: number | null
}) {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [tips, setTips] = useState<Tip[] | null>(null)
  const [includeYoutube, setIncludeYoutube] = useState(false)
  // Mirror anon quota client-side so we can flip the gate after a
  // successful generation without waiting on a navigation.
  const [remaining, setRemaining] = useState<boolean | null>(anonRemaining)
  const [resetsAt, setResetsAt] = useState<number | null>(anonResetsAt)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const showAnonBadge = !isAuthed && remaining !== null
  const isExhausted = !isAuthed && remaining === false

  const submit = async (q: string) => {
    if (q.trim().length < 5) {
      toast.error("Ask a slightly longer question.")
      return
    }
    setLoading(true)
    setSummary(null)
    setTips(null)
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, includeYoutube }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        // 429 = anonymous quota reached. Sync local state so the form
        // collapses to the exhausted callout.
        if (res.status === 429 && j?.code === "anon_quota_reached" && j?.anon) {
          setRemaining(false)
          setResetsAt(j.anon.resetsAt ?? resetsAt)
        }
        throw new Error(j.error ?? "Failed")
      }
      const data = (await res.json()) as {
        summary: string
        tips: Tip[]
        anon?: { remaining: { ask: boolean }; resetsAt: number }
      }
      setSummary(data.summary)
      setTips(data.tips)
      if (data.anon) {
        setRemaining(data.anon.remaining.ask)
        setResetsAt(data.anon.resetsAt)
      }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const onTopicClick = (stem: string) => {
    setQuestion(stem)
    // Focus the textarea and place caret at end so user can finish typing
    queueMicrotask(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      const len = el.value.length
      el.setSelectionRange(len, len)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Exhausted gate replaces the composer entirely; users keep any
          previously-generated result rendered below. */}
      {isExhausted && resetsAt !== null && (
        <AnonUsageBadge kind="ask" remaining={false} resetsAt={resetsAt} />
      )}

      {!isExhausted && (
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardContent className="flex flex-col gap-5 pt-6">
          {showAnonBadge && remaining === true && resetsAt !== null && (
            <AnonUsageBadge kind="ask" remaining resetsAt={resetsAt} className="self-start" />
          )}
          {/* Topic chips — entry point. These suggest a question shape and
              prefill a stem rather than a complete question, so users still
              feel ownership of the question. */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pick a topic to start
            </p>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {TOPICS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onTopicClick(t.stem)}
                  disabled={loading}
                  className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent hover:shadow-sm disabled:opacity-50"
                >
                  <t.Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void submit(question)
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="question-input" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
                <HelpCircle className="h-3.5 w-3.5 text-primary" aria-hidden />
                Your question
              </label>
              <Textarea
                ref={textareaRef}
                id="question-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                placeholder="e.g. How do I use ChatGPT to write better cold sales emails?"
                className="resize-y rounded-xl text-sm md:text-base"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                We&apos;ll search the web in real time and ground every tip in cited sources.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setIncludeYoutube((v) => !v)}
                aria-pressed={includeYoutube}
                className={cn(
                  "inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  includeYoutube
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                <Youtube className="h-3.5 w-3.5" aria-hidden />
                {includeYoutube ? "Including video walkthroughs" : "Include video walkthroughs"}
              </button>
              <Button type="submit" disabled={loading} size="lg" className="w-full rounded-xl sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Generate tips
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Sample questions — kept as a fallback for users who want a fully-
              formed example rather than a topic stem. Quieter visual weight
              than the topic row. */}
          {samples.length > 0 && (
            <details className="border-t border-border/60 pt-4">
              <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
                Or try a sample question
              </summary>
              <ul className="mt-3 flex flex-col gap-1.5">
                {samples.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setQuestion(s)
                        void submit(s)
                      }}
                      className="w-full rounded-xl border border-transparent bg-surface-low/60 px-3 py-2 text-left text-sm leading-snug text-foreground transition hover:border-primary/30 hover:bg-accent disabled:opacity-50"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </CardContent>
      </Card>
      )}

      {(summary || (tips && tips.length > 0)) && (
        <div ref={resultRef} className="flex scroll-mt-20 flex-col gap-5">
          {summary && (
            <div className="rounded-2xl border border-border/60 bg-accent/40 p-5">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">In short</div>
              <p className="text-sm leading-relaxed">{summary}</p>
            </div>
          )}

          {tips && tips.length > 0 && (
            <>
              <ResultsCta isAuthed={isAuthed} kind="ask" />
              <div>
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {tips.length} tip{tips.length === 1 ? "" : "s"} for you
                  </h2>
                  <span className="text-xs text-muted-foreground">Each tip cites its sources</span>
                </div>
                <div className={cn("grid gap-6", tips.length >= 2 && "md:grid-cols-2")}>
                  {tips.map((t) => (
                    <TipCard key={t.id} tip={t} isAuthed={isAuthed} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
