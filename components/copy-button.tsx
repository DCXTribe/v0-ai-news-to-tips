"use client"

import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type ButtonVariant = "default" | "outline" | "ghost" | "secondary"
type ButtonSize = "default" | "sm" | "lg"

export function CopyButton({
  text,
  label = "Copy prompt",
  className,
  variant = "default",
  size = "sm",
}: {
  text: string
  label?: string
  className?: string
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Prompt copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy. Try selecting the text manually.")
    }
  }

  return (
    <Button onClick={onCopy} size={size} variant={variant} className={className}>
      {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      <span>{copied ? "Copied" : label}</span>
    </Button>
  )
}
