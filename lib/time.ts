// Parse a free-form `time_saved` string (e.g. "30 minutes", "2 hours",
// "1.5 hrs", "20-30 min", "an hour", "half an hour") into a minute count.
// Returns 0 for null / unparseable input so it's safe to sum.
export function parseTimeSavedToMinutes(text: string | null | undefined): number {
  if (!text) return 0
  const s = text.toLowerCase().trim()

  // Word forms
  if (/half\s+an?\s+hour/.test(s)) return 30
  if (/quarter\s+(of\s+)?an?\s+hour/.test(s)) return 15
  if (/^an?\s+hour\b/.test(s)) return 60
  if (/half\s+a?\s+day/.test(s)) return 240
  if (/^a?\s*day\b/.test(s)) return 480

  // Range like "20-30 min" or "1-2 hours" — take the midpoint
  const rangeMatch = s.match(
    /(\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)\b/,
  )
  if (rangeMatch) {
    const lo = Number.parseFloat(rangeMatch[1])
    const hi = Number.parseFloat(rangeMatch[2])
    const unit = rangeMatch[3]
    const avg = (lo + hi) / 2
    return /^h/.test(unit) ? avg * 60 : avg
  }

  // Composite: "1 hour 30 minutes"
  let total = 0
  let matched = false

  const hMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/)
  if (hMatch) {
    total += Number.parseFloat(hMatch[1]) * 60
    matched = true
  }

  const mMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min|m)\b/)
  if (mMatch) {
    total += Number.parseFloat(mMatch[1])
    matched = true
  }

  if (matched) return total

  // Bare number — assume minutes
  const numMatch = s.match(/(\d+(?:\.\d+)?)/)
  if (numMatch) return Number.parseFloat(numMatch[1])

  return 0
}

export function formatMinutes(total: number): string {
  if (!total || total <= 0) return "0 min"
  const rounded = Math.round(total)
  if (rounded < 60) return `${rounded} min`
  const hours = Math.floor(rounded / 60)
  const mins = rounded % 60
  if (mins === 0) return `${hours} hr${hours === 1 ? "" : "s"}`
  return `${hours}h ${mins}m`
}

// Estimate weekly savings: assumes the user runs each saved tip once per week.
// We cap at a reasonable number so a giant library doesn't show absurd values.
export function estimateWeeklyMinutes(perRunMinutes: number, savedCount: number): number {
  if (perRunMinutes <= 0 || savedCount <= 0) return 0
  // Simple model: each tip used ~1x/week on average.
  return perRunMinutes
}
