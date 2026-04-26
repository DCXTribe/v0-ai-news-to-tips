"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { LogOut, BookMarked, Settings, UserCircle, Sparkles, CalendarRange } from "lucide-react"

/**
 * UserMenu now reflects the tier system (PRD v1.4 §16). The site-header
 * (server component) reads the viewer's tier and passes it down. Free users
 * see a small upsell row pointing to /upgrade; paid users see an "Active"
 * badge with their expiry date.
 */
export function UserMenu({
  email,
  tier = "free",
  paidUntil = null,
}: {
  email: string
  tier?: "free" | "paid"
  paidUntil?: string | null
}) {
  const initials = (email[0] ?? "?").toUpperCase()
  const isPaid = tier === "paid"
  const expiryLabel =
    isPaid && paidUntil
      ? new Date(paidUntil).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 px-2"
          aria-label="Account menu"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </span>
          <span className="hidden max-w-[140px] truncate text-sm font-normal sm:inline">{email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Signed in</span>
              {/* Tier badge — sits inline with "Signed in" so the viewer's
                  current plan is the first thing they see when they open the
                  menu. Paid is success-toned; free is muted. */}
              {isPaid ? (
                <Badge
                  variant="secondary"
                  className="rounded-full border-[color:var(--success)]/30 bg-[color:var(--success)]/10 text-[10px] font-medium text-[color:var(--success)]"
                >
                  <Sparkles className="mr-1 h-3 w-3" aria-hidden />
                  Paid
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full text-[10px] font-medium">
                  Free
                </Badge>
              )}
            </div>
            <span className="truncate text-xs text-muted-foreground">{email}</span>
            {isPaid && expiryLabel && (
              <span className="text-[11px] text-muted-foreground">Active through {expiryLabel}</span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Tier-aware row — paid sees archive entry, free sees upgrade CTA */}
        {isPaid ? (
          <DropdownMenuItem asChild>
            <Link href="/history" className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4" aria-hidden />
              Edition archive
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/upgrade" className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" aria-hidden />
              Unlock past editions
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" aria-hidden />
            My profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/library" className="flex items-center gap-2">
            <BookMarked className="h-4 w-4" aria-hidden />
            My library
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/onboarding?next=/profile" className="flex items-center gap-2">
            <Settings className="h-4 w-4" aria-hidden />
            Edit preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action="/auth/sign-out" method="post">
            <button type="submit" className="flex w-full items-center gap-2 text-left">
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
