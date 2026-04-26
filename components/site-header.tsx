import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { BrandMark } from "@/components/brand-mark"

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          {/* Pulse Spark mark — the silver bezel + blue→magenta swirl is the
              brand. Drop shadow uses the brand-soft glow so the mark feels
              lifted off the frosted-glass header. */}
          <BrandMark size={32} className="shadow-[var(--shadow-brand-soft)]" />
          <span className="text-lg">AI Daily</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link href={user ? "/today" : "/"}>Today</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link href="/unpack">Unpack</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link href="/ask">Ask</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link href="/advisor">Advisor</Link>
          </Button>
          {user && (
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/library">Library</Link>
            </Button>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <UserMenu email={user.email ?? ""} />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden rounded-full sm:inline-flex">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link href="/auth/sign-up">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
