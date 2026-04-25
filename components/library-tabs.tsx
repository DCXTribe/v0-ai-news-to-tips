"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TipCard, type Tip } from "@/components/tip-card"
import { Sparkles, History, BookmarkCheck, PackageOpen, ChevronRight, Search, X, Compass } from "lucide-react"

type SaveItem = { tip: Tip; status: string; savedAt: string }
type HistoryItem = {
  id: string
  kind: string
  input: string
  summary: string | null
  created_at: string
  tip_ids: string[]
}

export function LibraryTabs({ saves, history }: { saves: SaveItem[]; history: HistoryItem[] }) {
  // Allow deep-linking to the History tab via `?tab=history` from feature pages.
  const params = useSearchParams()
  const initialTab = params?.get("tab") === "history" ? "history" : "saved"
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()

  const filteredSaves = useMemo(() => {
    if (!q) return saves
    return saves.filter(({ tip }) => {
      const haystack = [
        tip.title,
        tip.why_it_matters,
        tip.scenario,
        tip.before_text,
        tip.after_text,
        ...(tip.tools ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [saves, q])

  const filteredHistory = useMemo(() => {
    if (!q) return history
    return history.filter((h) => {
      const haystack = [h.input, h.summary, h.kind].filter(Boolean).join(" ").toLowerCase()
      return haystack.includes(q)
    })
  }, [history, q])

  const totalMatching = filteredSaves.length + filteredHistory.length

  return (
    <Tabs defaultValue={initialTab}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="saved" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Saved <span className="text-muted-foreground">({filteredSaves.length})</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" aria-hidden />
            History <span className="text-muted-foreground">({filteredHistory.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Search — filters saved + history client-side */}
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your library"
            aria-label="Search saved tips and history"
            className="h-9 rounded-full pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition hover:bg-surface-low hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {q && totalMatching === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface-low/60 px-6 py-8 text-center text-sm text-muted-foreground">
          Nothing matches &ldquo;{query}&rdquo; in your library.
        </div>
      )}

      <TabsContent value="saved" className="mt-6">
        {filteredSaves.length === 0 ? (
          q ? null : <EmptySaved />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredSaves.map(({ tip }) => (
              <TipCard key={tip.id} tip={tip} isAuthed isSaved />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="history" className="mt-6">
        {filteredHistory.length === 0 ? (
          q ? null : <EmptyHistory />
        ) : (
          <ul className="flex flex-col gap-3">
            {filteredHistory.map((h) => (
              <li key={h.id}>
                <Link
                  href={`/library/history/${h.id}`}
                  className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-brand-soft)] sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                        {historyKindLabel(h.kind)}
                      </span>
                      <span>{new Date(h.created_at).toLocaleString()}</span>
                      {h.kind !== "advisor" && (
                        <>
                          <span aria-hidden>·</span>
                          <span>
                            {h.tip_ids?.length ?? 0} tip{(h.tip_ids?.length ?? 0) === 1 ? "" : "s"}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-foreground">
                      {h.input}
                    </p>
                    {h.summary && (
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{h.summary}</p>
                    )}
                  </div>
                  <ChevronRight
                    className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>
    </Tabs>
  )
}

function historyKindLabel(kind: string): string {
  if (kind === "paste") return "Article"
  if (kind === "advisor") return "Advisor"
  return "Question"
}

function EmptySaved() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-low/60 px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-primary">
        <BookmarkCheck className="h-5 w-5" aria-hidden />
      </div>
      <div className="max-w-sm">
        <p className="font-semibold">Your playbook is empty</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Browse{" "}
          <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
            today&apos;s tips
          </Link>{" "}
          and tap <span className="font-medium text-foreground">Save</span> to keep the ones that work for your job.
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Button asChild size="sm" className="rounded-xl">
          <Link href="/">
            <Sparkles className="h-4 w-4" aria-hidden />
            See today&apos;s tips
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link href="/advisor">
            <Compass className="h-4 w-4" aria-hidden />
            Pick a tool
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link href="/unpack">
            <PackageOpen className="h-4 w-4" aria-hidden />
            Unpack an article
          </Link>
        </Button>
      </div>
    </div>
  )
}

function EmptyHistory() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-low/60 px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-high text-muted-foreground">
        <History className="h-5 w-5" aria-hidden />
      </div>
      <div className="max-w-sm">
        <p className="font-semibold">No activity yet</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Your past unpacks, questions, and tool advisor sessions will appear here.
        </p>
      </div>
    </div>
  )
}
