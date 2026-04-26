import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * The AI Daily logo — a circular Pulse Spark mark (silver bezel, deep
 * navy-to-magenta gradient backdrop, swirling cyan→purple aperture blades).
 *
 * Rendered as a square <Image> clipped to a circle so the brushed-metal
 * bezel reads cleanly at every size. The component is intentionally
 * unstyled beyond the circle clip — callers control the size via the
 * `size` prop and can compose layout / drop shadow externally.
 *
 * Accessibility:
 * - When `decorative` is true (the common case — the wordmark is rendered
 *   next to the mark) we set alt="" so screen readers don't read the logo
 *   twice. Set `decorative={false}` for stand-alone marks (e.g. the
 *   centered logo on auth screens).
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
  return (
    <Image
      src="/brand-mark.png"
      alt={decorative ? "" : "AI Daily"}
      width={size}
      height={size}
      // Priority on the LCP-critical header logo; small file so the cost is
      // negligible and it avoids a tiny layout-shift glitch on first paint.
      priority
      className={cn("rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  )
}
