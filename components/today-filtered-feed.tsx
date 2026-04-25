"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Search, X, Filter, Wand2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type FilterableTipCard = {
  id: string
  category: string | null
  tools: string[]
  searchBlob: string // headline + summary + tip text, lower-cased
  node: ReactNode
}

export function TodayFilteredFeed({
  cards,
  userTools,
}: {
  cards: FilterableTipCard[]
  userTools: string[] // empty array if anon or no toolkit
}) {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [matchToolkit, setMatchToolkit] = useState(false)

  // Distinct categories present in today's feed (case-insensitive set)
  const categories = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of cards) {
      if (!c.category) continue
      const key = c.category.toLowerCase()
      if (!map.has(key)) map.set(key, c.category)
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b))
  }, [cards])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cards.filter((c) => {
      if (q && !c.searchBlob.includes(q)) return false
      if (activeCategory && (c.category ?? "").toLowerCase() !== activeCategory.toLowerCase()) return false
      if (matchToolkit && userTools.length > 0) {
        if (c.tools.length === 0) return false
        const has = c.tools.some((t) => userTools.includes(t))
        if (!has) return false
      }
      return true
    })
  }, [cards, query, activeCategory, matchToolkit, userTools])

  const hasActiveFilters = query.length > 0 || activeCategory !== null || matchToolkit

  return (
    <div className="flex flex-col gap-5">
      {/* Filter bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search today's tips by keyword, prompt, or tool..."
              className="rounded-xl pl-9"
              aria-label="Search tips"
            />
          </div>
          {userTools.length > 0 && (
            <button
              type="button"
              onClick={() => setMatchToolkit((v) => !v)}
              aria-pressed={matchToolkit}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition",
                matchToolkit
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <Wand2 className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">My toolkit only</span>
              <span className="sm:hidden">Toolkit</span>
            </button>
          )}
        </div>

        {categories.length > 0 && (
          <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              aria-pressed={activeCategory === null}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
                activeCategory === null
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              All ({cards.length})
            </button>
            {categories.map((cat) => {
              const count = cards.filter((c) => (c.category ?? "").toLowerCase() === cat.toLowerCase()).length
              const active = activeCategory?.toLowerCase() === cat.toLowerCase()
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(active ? null : cat)}
                  aria-pressed={active}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {cat} ({count})
                </button>
              )
            })}
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-low px-3 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" aria-hidden />
              <span>
                Showing {filtered.length} of {cards.length} tip{cards.length === 1 ? "" : "s"}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto rounded-md px-2 py-1 text-xs"
              onClick={() => {
                setQuery("")
                setActiveCategory(null)
                setMatchToolkit(false)
              }}
            >
              <X className="h-3 w-3" aria-hidden />
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-low/60 p-10 text-center">
          <p className="text-sm leading-relaxed text-muted-foreground">
            No tips match those filters. Try clearing them or broadening your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id}>{c.node}</div>
          ))}
        </div>
      )}
    </div>
  )
}
