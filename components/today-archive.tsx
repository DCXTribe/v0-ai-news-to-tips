"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown, History } from "lucide-react"
import { cn } from "@/lib/utils"

export type ArchiveDay = {
  date: string
  label: string
  count: number
  cards: ReactNode
}

export function TodayArchive({ days }: { days: ArchiveDay[] }) {
  const [openDate, setOpenDate] = useState<string | null>(days[0]?.date ?? null)

  if (days.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" aria-hidden />
        <h2 className="text-base font-semibold tracking-tight">Earlier editions</h2>
        <span className="text-xs text-muted-foreground">Last {days.length} days</span>
      </div>

      <div className="flex flex-col gap-3">
        {days.map((d) => {
          const open = openDate === d.date
          return (
            <div key={d.date} className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              <button
                type="button"
                onClick={() => setOpenDate(open ? null : d.date)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-surface-low/60 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{d.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.count} tip{d.count === 1 ? "" : "s"}
                  </div>
                </div>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-muted-foreground transition", open && "rotate-180")}
                  aria-hidden
                />
              </button>
              {open && (
                <div className="border-t border-border/60 bg-surface-low/40 px-4 py-4 sm:px-5 sm:py-5">
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">{d.cards}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
