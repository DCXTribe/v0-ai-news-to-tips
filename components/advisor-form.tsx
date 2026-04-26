"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { AdvisorResult, type AdvisorOutput } from "@/components/advisor-result"
import { ResultsCta } from "@/components/results-cta"
import { AnonUsageBadge } from "@/components/anon-usage-badge"
import { toast } from "sonner"
import { Loader2, Compass, PenLine, Search, BarChart3, Wand2, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Advisor — purpose: pick the best AI tool from the user's toolkit for a task.
 *
 * Design choices:
 * - Tasks are short. The input is a single line (Input, not Textarea).
 * - Sample tasks organized into 5 categories with a tab pattern. Flat lists
 *   make users skim past relevant examples; categories let them target.
 * - The "constraints" being fed to the algorithm (the toolkit) are surfaced
 *   on the page itself, not in this form — the form stays focused on the
 *   task description.
 */

type TaskCategory = {
  value: string
  label: string
  Icon: typeof PenLine
  tasks: string[]
}

const CATEGORIES: TaskCategory[] = [
  {
    value: "writing",
    label: "Writing",
    Icon: PenLine,
    tasks: [
      "Draft a sales email to a CFO based on a LinkedIn profile",
      "Rewrite a long technical email to be 3 sentences",
      "Write a LinkedIn post announcing a new product launch",
      "Turn meeting notes into a polished status update",
    ],
  },
  {
    value: "research",
    label: "Research",
    Icon: Search,
    tasks: [
      "Research a competitor's pricing changes this month",
      "Find recent academic papers on retrieval-augmented generation",
      "Summarize the news coverage of an industry event",
      "Check the current legal status of AI training on copyrighted data",
    ],
  },
  {
    value: "analysis",
    label: "Analysis",
    Icon: BarChart3,
    tasks: [
      "Analyze a CSV with 5,000 rows and find anomalies",
      "Summarize a 50-page PDF report into 5 bullet points",
      "Compare three vendor proposals and rank them",
      "Extract action items from a 30-minute meeting transcript",
    ],
  },
  {
    value: "creative",
    label: "Creative",
    Icon: Wand2,
    tasks: [
      "Brainstorm a Q3 marketing campaign with image mockups",
      "Generate 10 product name candidates for a new feature",
      "Create a slide deck outline for a board update",
      "Design a custom illustration for a blog post header",
    ],
  },
  {
    value: "productivity",
    label: "Productivity",
    Icon: Briefcase,
    tasks: [
      "Schedule a series of follow-up emails over two weeks",
      "Organize my inbox into action / waiting / archive",
      "Build a weekly review template from my calendar",
      "Convert a long Notion doc into a one-pager",
    ],
  },
]

export function AdvisorForm({
  isAuthed,
  hasToolkit,
  anonRemaining,
  anonResetsAt,
}: {
  isAuthed: boolean
  /** Kept for backward compat with the page wiring; not rendered here anymore. */
  samples?: string[]
  hasToolkit: boolean
  /** Null when authed; boolean when anon. Server-rendered initial value. */
  anonRemaining: boolean | null
  anonResetsAt: number | null
}) {
  const [task, setTask] = useState("")
  const [activeCat, setActiveCat] = useState<string>(CATEGORIES[0].value)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AdvisorOutput | null>(null)
  // Mirror anon quota client-side so the gate updates instantly after a
  // successful generation without needing a navigation.
  const [remaining, setRemaining] = useState<boolean | null>(anonRemaining)
  const [resetsAt, setResetsAt] = useState<number | null>(anonResetsAt)

  const showAnonBadge = !isAuthed && remaining !== null
  const isExhausted = !isAuthed && remaining === false

  const submit = async (q: string) => {
    if (q.trim().length < 8) {
      toast.error("Describe the task a little more, please.")
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ task: q }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        // 429 = anonymous quota reached. Sync local state so the gate appears.
        if (res.status === 429 && j?.code === "anon_quota_reached" && j?.anon) {
          setRemaining(false)
          setResetsAt(j.anon.resetsAt ?? resetsAt)
        }
        throw new Error(j.error ?? "Failed")
      }
      const data = (await res.json()) as AdvisorOutput & {
        anon?: { remaining: { advisor: boolean }; resetsAt: number }
      }
      setResult(data)
      if (data.anon) {
        setRemaining(data.anon.remaining.advisor)
        setResetsAt(data.anon.resetsAt)
      }
      setTimeout(() => {
        document.getElementById("advisor-result")?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 50)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const cat = CATEGORIES.find((c) => c.value === activeCat) ?? CATEGORIES[0]

  return (
    <div className="flex flex-col gap-8">
      {/* Exhausted gate replaces the composer entirely; users keep any
          previously-generated recommendation rendered below. */}
      {isExhausted && resetsAt !== null && (
        <AnonUsageBadge kind="advisor" remaining={false} resetsAt={resetsAt} />
      )}

      {!isExhausted && (
      <Card className="border-border/70 shadow-sm">
        <CardContent className="flex flex-col gap-6 pt-6">
          {showAnonBadge && remaining === true && resetsAt !== null && (
            <AnonUsageBadge kind="advisor" remaining resetsAt={resetsAt} className="self-start" />
          )}
          {/* Task input — single line, the headline action */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void submit(task)
            }}
            className="flex flex-col gap-3"
          >
            <label htmlFor="task-input" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
              <Compass className="h-3.5 w-3.5 text-primary" aria-hidden />
              What's the task?
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="task-input"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g. Summarize a 30-minute Teams meeting into action items"
                className="h-11 rounded-xl text-sm md:text-base"
              />
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="h-11 rounded-xl shadow-[var(--shadow-brand)] sm:shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Compass className="h-4 w-4" aria-hidden />
                    Recommend a tool
                  </>
                )}
              </Button>
            </div>
            {!hasToolkit && isAuthed && (
              <p className="text-xs text-muted-foreground">
                Tip: pick the tools you have in{" "}
                <a href="/onboarding" className="font-medium text-foreground underline-offset-4 hover:underline">
                  onboarding
                </a>{" "}
                so we only recommend ones you can actually use.
              </p>
            )}
          </form>

          {/* Categorized task starters — 5 categories with tabs.
              Lets users target the kind of task they need help with rather
              than scanning a flat list. */}
          <div className="flex flex-col gap-3 border-t border-border/60 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Or pick a starter task
            </p>
            <div role="tablist" aria-label="Task categories" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {CATEGORIES.map((c) => {
                const isActive = c.value === activeCat
                return (
                  <button
                    key={c.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveCat(c.value)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      isActive
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <c.Icon className="h-3.5 w-3.5" aria-hidden />
                    {c.label}
                  </button>
                )
              })}
            </div>
            <ul className="flex flex-col gap-1.5">
              {cat.tasks.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setTask(s)
                      void submit(s)
                    }}
                    className="group flex w-full items-start gap-2 rounded-xl border border-transparent bg-surface-low/60 px-3 py-2 text-left text-sm text-foreground transition hover:border-primary/30 hover:bg-accent disabled:opacity-50"
                  >
                    <cat.Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    <span className="leading-snug">{s}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      )}

      {result && (
        <div id="advisor-result" className="flex scroll-mt-20 flex-col gap-5">
          <ResultsCta isAuthed={isAuthed} kind="advisor" />
          <AdvisorResult data={result} />
        </div>
      )}
    </div>
  )
}
