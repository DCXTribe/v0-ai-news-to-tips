"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, PackageOpen, MessageSquare, BookMarked } from "lucide-react"
import { cn } from "@/lib/utils"

type Item = {
  href: string
  label: string
  Icon: typeof CalendarDays
  match: (path: string) => boolean
}

const items: Item[] = [
  { href: "/", label: "Today", Icon: CalendarDays, match: (p) => p === "/" },
  { href: "/unpack", label: "Unpack", Icon: PackageOpen, match: (p) => p.startsWith("/unpack") },
  { href: "/ask", label: "Ask", Icon: MessageSquare, match: (p) => p.startsWith("/ask") },
  { href: "/library", label: "Library", Icon: BookMarked, match: (p) => p.startsWith("/library") },
]

export function MobileBottomNav() {
  const pathname = usePathname() ?? "/"

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-xl shadow-[0_-4px_20px_-8px_oklch(0.63_0.16_32_/_0.12)] md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-center justify-around gap-1 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {items.map(({ href, label, Icon, match }) => {
          const active = match(pathname)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium transition",
                  active
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-surface-low hover:text-foreground",
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute -top-2 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-primary"
                  />
                )}
                <Icon className="h-5 w-5" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
