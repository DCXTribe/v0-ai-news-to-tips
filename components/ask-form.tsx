"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { TipCard, type Tip } from "@/components/tip-card"
import { ResultsCta } from "@/components/results-cta"
import { toast } from "sonner"
import { Loader2, Sparkles } from "lucide-react"

export function AskForm({ isAuthed, samples }: { isAuthed: boolean; samples: string[] }) {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [tips, setTips] = useState<Tip[] | null>(null)

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
        body: JSON.stringify({ question: q }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? "Failed")
      }
      const data = (await res.json()) as { summary: string; tips: Tip[] }
      setSummary(data.summary)
      setTips(data.tips)
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
              void submit(question)
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="question-input">Your question</Label>
              <Textarea
                id="question-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
                placeholder="e.g. How do I use ChatGPT to write better cold sales emails?"
                className="resize-y"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
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

          <div className="mt-6 border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Try a sample question
            </p>
            <div className="flex flex-wrap gap-2">
              {samples.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setQuestion(s)
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

      {summary && (
        <div className="rounded-md border border-border bg-accent/30 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">In short</div>
          <p className="text-sm leading-relaxed">{summary}</p>
        </div>
      )}

      {tips && tips.length > 0 && (
        <div className="flex flex-col gap-5">
          <ResultsCta isAuthed={isAuthed} kind="ask" />
          <div>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              {tips.length} tip{tips.length === 1 ? "" : "s"} for you
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {tips.map((t) => (
                <TipCard key={t.id} tip={t} isAuthed={isAuthed} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
