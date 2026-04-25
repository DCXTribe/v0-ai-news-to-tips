"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { AdvisorResult, type AdvisorOutput } from "@/components/advisor-result"
import { ResultsCta } from "@/components/results-cta"
import { toast } from "sonner"
import { Loader2, Compass } from "lucide-react"

export function AdvisorForm({
  isAuthed,
  samples,
  hasToolkit,
}: {
  isAuthed: boolean
  samples: string[]
  hasToolkit: boolean
}) {
  const [task, setTask] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AdvisorOutput | null>(null)

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
        throw new Error(j.error ?? "Failed")
      }
      const data = (await res.json()) as AdvisorOutput
      setResult(data)
      // Smooth scroll to result
      setTimeout(() => {
        document.getElementById("advisor-result")?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 50)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void submit(task)
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="task-input">Describe what you need to do</Label>
              <Textarea
                id="task-input"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={3}
                placeholder="e.g. Summarize a 30-minute Teams meeting recording into action items"
                className="resize-y"
              />
              {!hasToolkit && isAuthed && (
                <p className="text-xs text-muted-foreground">
                  Tip: complete{" "}
                  <a href="/onboarding" className="font-medium text-foreground underline-offset-4 hover:underline">
                    onboarding
                  </a>{" "}
                  to scope recommendations to the tools you own.
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="rounded-xl shadow-[var(--shadow-brand)]">
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
          </form>

          <div className="mt-6 border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Try a sample task
            </p>
            <div className="flex flex-wrap gap-2">
              {samples.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setTask(s)
                    void submit(s)
                  }}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div id="advisor-result" className="flex flex-col gap-5 scroll-mt-20">
          <ResultsCta isAuthed={isAuthed} kind="advisor" />
          <AdvisorResult data={result} />
        </div>
      )}
    </div>
  )
}
