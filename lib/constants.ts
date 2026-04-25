export const ROLES = [
  { value: "marketer", label: "Marketer" },
  { value: "salesperson", label: "Salesperson" },
  { value: "manager", label: "Manager / Team Lead" },
  { value: "executive", label: "Executive" },
  { value: "developer", label: "Developer / Engineer" },
  { value: "designer", label: "Designer" },
  { value: "product", label: "Product Manager" },
  { value: "operations", label: "Operations" },
  { value: "hr", label: "HR / People" },
  { value: "finance", label: "Finance / Accounting" },
  { value: "legal", label: "Legal" },
  { value: "support", label: "Customer Support" },
  { value: "teacher", label: "Teacher / Educator" },
  { value: "consultant", label: "Consultant" },
  { value: "founder", label: "Founder / Solo" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
] as const

export const TOOLS = [
  { value: "copilot_free", label: "Microsoft Copilot (Free)", short: "Copilot Free" },
  { value: "copilot_pro", label: "Microsoft Copilot Pro / M365", short: "Copilot Pro" },
  { value: "chatgpt_free", label: "ChatGPT (Free)", short: "ChatGPT Free" },
  { value: "chatgpt_plus", label: "ChatGPT Plus / Pro", short: "ChatGPT Plus" },
  { value: "gemini_free", label: "Google Gemini (Free)", short: "Gemini" },
  { value: "gemini_advanced", label: "Google Gemini Advanced", short: "Gemini Advanced" },
  { value: "claude_free", label: "Claude (Free)", short: "Claude" },
  { value: "claude_pro", label: "Claude Pro", short: "Claude Pro" },
  { value: "perplexity_free", label: "Perplexity (Free)", short: "Perplexity" },
  { value: "perplexity_pro", label: "Perplexity Pro", short: "Perplexity Pro" },
] as const

export const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner", description: "New to AI tools" },
  { value: "intermediate", label: "Intermediate", description: "Use AI a few times a week" },
  { value: "advanced", label: "Power user", description: "Use AI daily, want advanced patterns" },
] as const

export type RoleValue = (typeof ROLES)[number]["value"]
export type ToolValue = (typeof TOOLS)[number]["value"]
export type SkillLevel = (typeof SKILL_LEVELS)[number]["value"]

export function toolLabel(value: string): string {
  return TOOLS.find((t) => t.value === value)?.short ?? value
}

export function roleLabel(value: string | null | undefined): string {
  if (!value) return "Anyone"
  return ROLES.find((r) => r.value === value)?.label ?? value
}
