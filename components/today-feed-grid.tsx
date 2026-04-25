"use client"

import { Children, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

const INITIAL_VISIBLE = 3

/**
 * Client wrapper that shows the first N tip cards by default and reveals the
 * rest behind a "Show more" toggle. The cards themselves are server-rendered
 * (TipCard is a server component) and passed in as children — this component
 * just controls visibility.
 */
export function TodayFeedGrid({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const items = Children.toArray(children)
  const total = items.length
  const visible = expanded ? items : items.slice(0, INITIAL_VISIBLE)
  const hiddenCount = Math.max(0, total - INITIAL_VISIBLE)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">{visible}</div>

      {hiddenCount > 0 && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="rounded-full"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" aria-hidden />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" aria-hidden />
                Show {hiddenCount} more {hiddenCount === 1 ? "tip" : "tips"}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
