import { cn } from "@/lib/utils"

/**
 * The AI Daily mark — a blue squircle bearing a white 4-point AI sparkle
 * with a small magenta "spark" dot in the upper right.
 *
 * Authored as inline SVG so it:
 *  - matches the live brand palette (vibrant blue primary + soft magenta
 *    accent) without an extra image roundtrip,
 *  - renders crisply at every pixel size (header 32, footer 28, auth 64),
 *  - tracks the global iOS-style 16px squircle radius via the rx ratio
 *    of 8/32 = 25% on the base rect,
 *  - keeps brand colors absolute (logos don't theme-shift across light /
 *    dark — only their surrounding chrome does).
 *
 * Accessibility:
 *  - When `decorative` is true (the common case — the wordmark is rendered
 *    next to the mark) the SVG is aria-hidden so screen readers don't
 *    announce the logo twice. For stand-alone uses (e.g. centered on auth
 *    screens) pass `decorative={false}` and a <title> is added.
 */
export function BrandMark({
  size = 32,
  decorative = true,
  className,
}: {
  size?: number
  decorative?: boolean
  className?: string
}) {
  // Stable id base so multiple instances on a page don't share gradient
  // refs across SSR / client rendering.
  const gradId = "ai-daily-mark-grad"
  const titleId = "ai-daily-mark-title"

  return (
    <svg
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-labelledby={decorative ? undefined : titleId}
      viewBox="0 0 32 32"
      width={size}
      height={size}
      // rounded-[25%] tracks the rx=8 squircle on the base rect at any
      // size, so a `box-shadow` applied via className (e.g. the header's
      // shadow-brand-soft glow) follows the visual silhouette rather
      // than a hard square box.
      className={cn("flex-shrink-0 rounded-[25%]", className)}
    >
      {!decorative && <title id={titleId}>AI Daily</title>}
      <defs>
        {/* Diagonal brand-blue gradient. Matches the vibrant action blue
            used for buttons and links — slightly lighter top-left so the
            mark lifts off the page at small sizes. */}
        <linearGradient id={gradId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4d9bff" />
          <stop offset="100%" stopColor="#0058d6" />
        </linearGradient>
      </defs>

      {/* Squircle base. rx/ry = 8 on a 32 box keeps the global iOS-style
          16px-on-64px radius ratio used elsewhere in the UI. */}
      <rect width="32" height="32" rx="8" ry="8" fill={`url(#${gradId})`} />

      {/* 4-point AI sparkle. Two long axes (vertical + horizontal) meet
          at four shallow inner waist points, producing the canonical
          "spark of intelligence" silhouette without leaning on emoji
          or generic stars. */}
      <path
        d="M16 6 L17.6 14.4 L26 16 L17.6 17.6 L16 26 L14.4 17.6 L6 16 L14.4 14.4 Z"
        fill="#ffffff"
      />

      {/* Magenta spark — the second-color accent that mirrors the
          blue → magenta progression elsewhere in the brand. Sized to
          read as a deliberate "beat" without overwhelming the sparkle. */}
      <circle cx="24" cy="8" r="2.25" fill="#d845b4" />
    </svg>
  )
}
