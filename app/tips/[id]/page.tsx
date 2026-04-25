import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { TipCard, type Tip } from "@/components/tip-card"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Use service client to read - tips with feed_id are public, but we still respect RLS for owner_id tips by checking
  const service = createServiceClient()
  const { data: tip } = await service.from("ai_daily_tips").select("*").eq("id", id).maybeSingle()

  if (!tip) notFound()

  // Authorization: public tips (feed_id != null) OR owned by current user
  const isPublic = tip.feed_id !== null
  const isOwner = user && tip.owner_id === user.id
  if (!isPublic && !isOwner) notFound()

  let isSaved = false
  if (user) {
    const { data: save } = await supabase
      .from("ai_daily_saves")
      .select("tip_id")
      .eq("user_id", user.id)
      .eq("tip_id", id)
      .maybeSingle()
    isSaved = !!save
  }

  let news: { headline: string; category: string | null } | null = null
  if (tip.feed_id) {
    const { data: feed } = await service
      .from("ai_daily_feed")
      .select("headline, category")
      .eq("id", tip.feed_id)
      .maybeSingle()
    if (feed) news = { headline: feed.headline, category: feed.category }
  }

  return (
    <div className="flex min-h-svh flex-col pb-20 md:pb-0">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to today
            </Link>
          </Button>
          <TipCard
            tip={tip as Tip}
            newsHeadline={news?.headline}
            newsCategory={news?.category}
            isAuthed={!!user}
            isSaved={isSaved}
          />
        </section>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}
