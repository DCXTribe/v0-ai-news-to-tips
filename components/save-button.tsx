"use client"

import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type ButtonVariant = "default" | "outline" | "ghost" | "secondary"
type ButtonSize = "default" | "sm" | "lg"

export function SaveButton({
  tipId,
  initialSaved = false,
  isAuthed,
  variant = "outline",
  size = "sm",
  className,
}: {
  tipId: string
  initialSaved?: boolean
  isAuthed: boolean
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}) {
  const [saved, setSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onClick = () => {
    if (!isAuthed) {
      router.push("/auth/sign-up?next=/library")
      return
    }
    if (tipId.startsWith("tmp-")) {
      toast.message("Sign in to save tips", {
        description: "Create an account to keep this tip in your library.",
      })
      return
    }
    startTransition(async () => {
      const next = !saved
      setSaved(next)
      const res = await fetch("/api/save", {
        method: next ? "POST" : "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tipId, status: "saved" }),
      })
      if (!res.ok) {
        setSaved(!next)
        toast.error("Couldn't update saved status")
        return
      }
      toast.success(next ? "Saved to your library" : "Removed from library")
      router.refresh()
    })
  }

  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={isPending}
      aria-pressed={saved}
      className={className}
    >
      {saved ? (
        <BookmarkCheck className="h-4 w-4" aria-hidden />
      ) : (
        <Bookmark className="h-4 w-4" aria-hidden />
      )}
      <span>{saved ? "Saved" : "Save"}</span>
    </Button>
  )
}
