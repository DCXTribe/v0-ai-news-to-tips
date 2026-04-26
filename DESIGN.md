---
name: AI Daily
tagline: Turn AI news into tips you can use today
description: >
  Warm, editorial, B2B-friendly design system for an AI-news-to-tips product.
  Coral as the action color, sage as the "savings / with AI" success color,
  layered warm-neutral surfaces, and an inverse dark block reserved for
  copy-paste prompts. Light mode is the canonical experience; dark mode
  mirrors it with a warm dark, never navy.

color:
  mode:
    default: light
    schemes: [light, dark]

  # All values authored in OKLCH (the codebase's source of truth) with an
  # approximate sRGB hex for tooling that doesn't speak OKLCH.
  light:
    background:        { oklch: "oklch(0.985 0.006 80)",  hex: "#fbf9f5" }  # warm cream
    foreground:        { oklch: "oklch(0.24 0.02 55)",    hex: "#2a241e" }  # warm charcoal

    card:              { oklch: "oklch(1 0 0)",           hex: "#ffffff" }
    card-foreground:   { oklch: "oklch(0.24 0.02 55)",    hex: "#2a241e" }

    popover:           { oklch: "oklch(1 0 0)",           hex: "#ffffff" }
    popover-foreground:{ oklch: "oklch(0.24 0.02 55)",    hex: "#2a241e" }

    primary:           { oklch: "oklch(0.63 0.16 32)",    hex: "#d36447" }  # coral
    primary-foreground:{ oklch: "oklch(1 0 0)",           hex: "#ffffff" }

    success:           { oklch: "oklch(0.6 0.075 180)",   hex: "#5fa39a" }  # sage
    success-foreground:{ oklch: "oklch(1 0 0)",           hex: "#ffffff" }
    success-soft:      { oklch: "oklch(0.95 0.025 180)",  hex: "#e7f1ee" }  # sage tint surface

    secondary:           { oklch: "oklch(0.95 0.012 75)", hex: "#f1ece4" }
    secondary-foreground:{ oklch: "oklch(0.24 0.02 55)",  hex: "#2a241e" }

    muted:             { oklch: "oklch(0.97 0.008 75)",   hex: "#f6f1ea" }
    muted-foreground:  { oklch: "oklch(0.5 0.02 55)",     hex: "#7b6f63" }

    accent:            { oklch: "oklch(0.96 0.03 32)",    hex: "#fbe8df" }  # soft coral surface
    accent-foreground: { oklch: "oklch(0.5 0.16 32)",     hex: "#a04428" }  # coral on accent

    destructive:           { oklch: "oklch(0.577 0.245 27.325)", hex: "#d63a2f" }
    destructive-foreground:{ oklch: "oklch(1 0 0)",              hex: "#ffffff" }

    border:            { oklch: "oklch(0.91 0.012 70)",   hex: "#e6dfd4" }
    input:             { oklch: "oklch(0.91 0.012 70)",   hex: "#e6dfd4" }
    ring:              { oklch: "oklch(0.63 0.16 32)",    hex: "#d36447" }  # coral focus

    # Layered warm-neutral surfaces (low → highest) for nested contexts
    surface-low:       { oklch: "oklch(0.97 0.008 75)",   hex: "#f6f1ea" }
    surface:           { oklch: "oklch(0.95 0.012 75)",   hex: "#f1ece4" }
    surface-high:      { oklch: "oklch(0.93 0.016 70)",   hex: "#ebe4d9" }
    surface-highest:   { oklch: "oklch(0.9 0.02 70)",     hex: "#e2dacb" }

    # Dark warm block — the only place dark appears in light mode.
    # Used exclusively for copy-paste prompt blocks so the prompt reads as
    # "code to take with you." Never navy; the warm undertone keeps it
    # consistent with the cream background.
    inverse-surface:    { oklch: "oklch(0.26 0.022 60)",  hex: "#3a322a" }
    inverse-on-surface: { oklch: "oklch(0.96 0.008 75)",  hex: "#f3eee5" }

    chart-1: { oklch: "oklch(0.63 0.16 32)",  hex: "#d36447", role: brand-coral }
    chart-2: { oklch: "oklch(0.6 0.075 180)", hex: "#5fa39a", role: success-sage }
    chart-3: { oklch: "oklch(0.7 0.13 75)",   hex: "#c69a4f", role: warm-amber }
    chart-4: { oklch: "oklch(0.55 0.12 250)", hex: "#5b71b8", role: cool-indigo }
    chart-5: { oklch: "oklch(0.65 0.14 320)", hex: "#b35a99", role: berry-pink }

  dark:
    background:        { oklch: "oklch(0.18 0.018 60)",   hex: "#22201d" }  # warm dark, not navy
    foreground:        { oklch: "oklch(0.96 0.008 75)",   hex: "#f3eee5" }

    card:              { oklch: "oklch(0.22 0.022 60)",   hex: "#2a2622" }
    card-foreground:   { oklch: "oklch(0.96 0.008 75)",   hex: "#f3eee5" }

    popover:           { oklch: "oklch(0.22 0.022 60)",   hex: "#2a2622" }
    popover-foreground:{ oklch: "oklch(0.96 0.008 75)",   hex: "#f3eee5" }

    primary:           { oklch: "oklch(0.72 0.15 32)",    hex: "#e88466" }  # coral, brightened
    primary-foreground:{ oklch: "oklch(0.18 0.018 60)",   hex: "#22201d" }

    success:           { oklch: "oklch(0.72 0.09 180)",   hex: "#7cc1b6" }
    success-foreground:{ oklch: "oklch(0.18 0.018 60)",   hex: "#22201d" }
    success-soft:      { oklch: "oklch(0.28 0.04 180)",   hex: "#2c3d3a" }

    secondary:           { oklch: "oklch(0.25 0.025 60)", hex: "#312b26" }
    secondary-foreground:{ oklch: "oklch(0.96 0.008 75)", hex: "#f3eee5" }

    muted:             { oklch: "oklch(0.22 0.022 60)",   hex: "#2a2622" }
    muted-foreground:  { oklch: "oklch(0.7 0.02 60)",     hex: "#a89c8e" }

    accent:            { oklch: "oklch(0.32 0.07 32)",    hex: "#5a3326" }
    accent-foreground: { oklch: "oklch(0.85 0.15 32)",    hex: "#f1a283" }

    destructive:           { oklch: "oklch(0.55 0.2 27)", hex: "#c33b30" }
    destructive-foreground:{ oklch: "oklch(0.96 0.008 75)", hex: "#f3eee5" }

    border:            { oklch: "oklch(0.32 0.025 60)",   hex: "#403933" }
    input:             { oklch: "oklch(0.32 0.025 60)",   hex: "#403933" }
    ring:              { oklch: "oklch(0.72 0.15 32)",    hex: "#e88466" }

    surface-low:       { oklch: "oklch(0.22 0.022 60)",   hex: "#2a2622" }
    surface:           { oklch: "oklch(0.25 0.025 60)",   hex: "#312b26" }
    surface-high:      { oklch: "oklch(0.28 0.03 60)",    hex: "#37302a" }
    surface-highest:   { oklch: "oklch(0.32 0.035 60)",   hex: "#40372f" }

    inverse-surface:    { oklch: "oklch(0.96 0.008 75)",  hex: "#f3eee5" }
    inverse-on-surface: { oklch: "oklch(0.18 0.018 60)",  hex: "#22201d" }

    chart-1: { oklch: "oklch(0.72 0.15 32)",  hex: "#e88466" }
    chart-2: { oklch: "oklch(0.72 0.09 180)", hex: "#7cc1b6" }
    chart-3: { oklch: "oklch(0.78 0.13 75)",  hex: "#dab577" }
    chart-4: { oklch: "oklch(0.65 0.13 250)", hex: "#7a8ed1" }
    chart-5: { oklch: "oklch(0.7 0.14 320)",  hex: "#c478ad" }

  semantics:
    brand:        primary
    action:       primary
    on-action:    primary-foreground
    savings:      success      # "Saves 18 min", monthly time-saved stat
    with-ai:      success      # the "After" pane in before/after, "With AI" callouts
    code-block:   inverse-surface
    on-code:      inverse-on-surface
    focus-ring:   ring
    chip-rest:    secondary
    chip-hover:   accent

typography:
  font-family:
    sans:    "Inter, 'Inter Fallback', system-ui, sans-serif"
    display: "Inter, 'Inter Fallback', system-ui, sans-serif"  # shared with sans, weight differentiates
    mono:    "JetBrains Mono, 'JetBrains Mono Fallback', ui-monospace, monospace"

  # Inter OpenType features turned on globally for stylistic refinement.
  font-features: "'cv11', 'ss01', 'ss03'"

  weight:
    regular:  400
    medium:   500
    semibold: 600
    bold:     700

  # Heads use a tighter editorial track; body stays natural.
  letter-spacing:
    display: "-0.02em"   # h1, h2, h3
    body:    "0"
    eyebrow: "0.04em"    # uppercase eyebrow / category labels

  scale:
    eyebrow:  { size: "0.6875rem", line-height: "1",      weight: 600, transform: uppercase, tracking: "0.04em" }   # 11px
    caption:  { size: "0.75rem",   line-height: "1.4",    weight: 400 }   # 12px
    small:    { size: "0.8125rem", line-height: "1.5",    weight: 400 }   # 13px
    body:     { size: "0.875rem",  line-height: "1.6",    weight: 400 }   # 14px — default
    body-lg:  { size: "1rem",      line-height: "1.6",    weight: 400 }   # 16px — landing lede
    h4:       { size: "1.125rem",  line-height: "1.4",    weight: 600 }   # 18px
    h3:       { size: "1.25rem",   line-height: "1.3",    weight: 700, tracking: "-0.02em" }   # 20px — tip card title
    h2:       { size: "1.5rem",    line-height: "1.2",    weight: 700, tracking: "-0.02em" }   # 24px — section
    h1:       { size: "1.875rem",  line-height: "1.15",   weight: 600, tracking: "-0.02em" }   # 30px — page title (mobile)
    h1-md:    { size: "2.25rem",   line-height: "1.1",    weight: 600, tracking: "-0.02em" }   # 36px — page title (md+)
    display:  { size: "3rem",      line-height: "1.05",   weight: 600, tracking: "-0.02em" }   # 48px — landing hero
    display-lg:{ size: "3.75rem",  line-height: "1",      weight: 600, tracking: "-0.02em" }   # 60px — landing hero (lg+)

  prose:
    balance: "h1, h2, hero subhead use text-balance"
    pretty:  "long lede paragraphs use text-pretty"

space:
  unit: "0.25rem"  # 4px Tailwind step
  scale:
    "0":   "0"
    "1":   "0.25rem"   # 4px
    "1.5": "0.375rem"  # 6px
    "2":   "0.5rem"    # 8px
    "2.5": "0.625rem"  # 10px
    "3":   "0.75rem"   # 12px
    "4":   "1rem"      # 16px — default card padding step
    "5":   "1.25rem"   # 20px
    "6":   "1.5rem"    # 24px — section gap
    "8":   "2rem"      # 32px
    "10":  "2.5rem"    # 40px
    "12":  "3rem"      # 48px
    "16":  "4rem"      # 64px

  semantics:
    card-padding-mobile:  "1rem"     # 16px
    card-padding-desktop: "1.5rem"   # 24px
    section-gap-mobile:   "2rem"     # 32px
    section-gap-desktop:  "3rem"     # 48px between landing sections
    chip-gap:             "0.375rem" # 6px between filter chips
    chip-padding-x:       "0.625rem" # 10px
    chip-padding-y:       "0.25rem"  # 4px
    page-max-width:       "72rem"    # 1152px (Tailwind max-w-6xl)

radius:
  base: "0.875rem"  # 14px — distinctive "warm rounded" feel
  scale:
    none:   "0"
    sm:     "calc(var(--radius) - 4px)"   # 10px
    md:     "calc(var(--radius) - 2px)"   # 12px
    lg:     "0.875rem"                    # 14px — base
    xl:     "calc(var(--radius) + 4px)"   # 18px
    "2xl":  "1rem"                        # 16px — tip card outer
    "3xl":  "1.5rem"                      # 24px — hero cards
    full:   "9999px"                      # pills, chips, avatars

  semantics:
    button:        "0.375rem"   # h-9 default uses rounded-md
    button-pill:   "9999px"     # nav buttons + auth CTAs use rounded-full
    chip:          "9999px"
    input:         "0.875rem"   # rounded-xl on all primary inputs
    card-default:  "0.75rem"    # rounded-xl shadcn default
    card-feature:  "1rem"       # rounded-2xl on TipCard, hero blocks
    code-block:    "1rem"       # rounded-2xl prompt block

elevation:
  shadow:
    xs:    "0 1px 2px 0 rgb(0 0 0 / 0.05)"                                   # button outline
    sm:    "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)" # card default
    brand-soft: "0 6px 24px -10px oklch(0.63 0.16 32 / 0.08)"                # tip card resting
    brand:      "0 8px 30px -8px oklch(0.63 0.16 32 / 0.18)"                 # tip card hover, hero CTA, brand logo

  # In dark mode, brand-tinted shadows fall back to neutral black so the
  # coral hue doesn't bloom against the warm dark background.
  shadow-dark:
    brand-soft: "0 6px 24px -10px rgb(0 0 0 / 0.25)"
    brand:      "0 8px 30px -8px rgb(0 0 0 / 0.4)"

  blur:
    backdrop-header: "24px"  # sticky header uses backdrop-blur-xl over bg/80

motion:
  duration:
    instant: "0ms"
    fast:    "150ms"
    base:    "200ms"   # default transition-all
    moderate:"300ms"
    slow:    "500ms"

  easing:
    standard:    "cubic-bezier(0.4, 0, 0.2, 1)"   # default
    decelerate:  "cubic-bezier(0, 0, 0.2, 1)"     # entering elements
    accelerate:  "cubic-bezier(0.4, 0, 1, 1)"     # exiting elements

  patterns:
    card-hover:        "transition-all 200ms; translate-y -2px; shadow brand-soft → brand"
    button-press:      "transition-all 200ms; opacity 1 → 0.9 on hover (default), bg fade on outline/ghost"
    focus-ring:        "instant 3px ring with primary at 50% opacity"
    smooth-scroll:     "behavior smooth, block start — used after generation completes"
    spinner:           "animate-spin via tailwindcss-animate, 1s linear infinite"

  reduced-motion:
    rule: "Honor prefers-reduced-motion: reduce — disable hover translate, keep color/opacity transitions."

breakpoints:
  sm:  "640px"
  md:  "768px"
  lg:  "1024px"
  xl:  "1280px"
  "2xl": "1536px"

  approach: mobile-first
  notes: |
    Mobile-only patterns: bottom tab nav (5 items: Today / Unpack / Advisor /
    Ask / Library), horizontally-scrolling chip rails (with native scrollbar
    hidden via .scrollbar-hide), vertically-stacked info rails that become
    grid-cols-3 at sm+. The full marketing footer is hidden on mobile for
    authenticated users.

components:
  # Component-level token recipes. Each entry describes how the foundational
  # tokens combine to produce a component's resting / hover / focused state.

  button-primary:
    background: primary
    text: primary-foreground
    radius: button or button-pill (when in nav / auth)
    height: { default: "2.25rem", sm: "2rem", lg: "2.5rem" }
    hover: "background primary at 90% opacity"
    focus-ring: "3px ring at primary/50"

  button-outline:
    background: background
    border: border
    text: foreground
    shadow: xs
    hover: "background accent, text accent-foreground"

  button-ghost:
    background: transparent
    text: foreground
    hover: "background accent, text accent-foreground"

  chip:
    radius: full
    height: "1.5rem"
    padding: "0.25rem 0.625rem"
    rest: { background: secondary, text: secondary-foreground }
    selected: { background: primary, text: primary-foreground }
    hover: { background: accent, text: accent-foreground }

  badge-success:
    background: success-soft
    text: success
    border-radius: full
    padding: "0.125rem 0.5rem"
    use: "time-saved chip ('Saves 18 min'), 'With AI' marker"

  card-default:
    background: card
    border: "1px solid border"
    radius: card-default
    padding: "1.5rem"
    shadow: sm

  card-feature:    # TipCard
    background: card
    border: "1px solid border at 70% opacity"
    radius: card-feature
    shadow: { rest: brand-soft, hover: brand }
    transform: { hover: "translate-y(-2px)" }

  code-block:      # the dark prompt panel inside TipCard
    background: inverse-surface
    text: inverse-on-surface
    radius: code-block
    padding: "1rem 1rem"
    font: mono
    font-size: "0.8125rem"

  input:
    background: card
    border: "1px solid input"
    radius: input
    height: "2.5rem"
    focus: "border ring; 3px ring at ring/50"

  header:
    background: "background at 80% opacity"
    backdrop-filter: "blur(24px)"
    border-bottom: "1px solid border at 60% opacity"
    height: "4rem"
    sticky: true
    z-index: 40

  bottom-nav-mobile:
    background: card
    border-top: "1px solid border at 60% opacity"
    height: "auto with safe-area-inset"
    items: 5
    item-height: "2.75rem"  # 44px touch target
    active: "background accent; text primary; 2px primary indicator above icon"

  before-after-block:    # the signature TipCard story
    before: { background: surface-low, border: "1px dashed border", text: muted-foreground }
    connector: "centered down-arrow on success/30 horizontal lines"
    after: { background: success-soft, border: "1px solid success/30", left-bar: "6px solid success" }

icons:
  library: lucide-react
  default-stroke: 1.5
  default-size:
    inline: "0.875rem"   # 14px in chips
    body:   "1rem"       # 16px default
    section:"1.25rem"    # 20px in card headers
    feature:"2rem"       # 32px in feature panels
  treatment: "Always paired with text or sr-only label; never replace a label"

surfaces:
  ladder:
    - { token: background,       use: "page background" }
    - { token: surface-low,      use: "inset panels inside cards (scenario, source, before block)" }
    - { token: surface,          use: "default low-emphasis surface" }
    - { token: surface-high,     use: "elevated highlights, hover states" }
    - { token: surface-highest,  use: "small icon plates inside surfaces" }
    - { token: card,             use: "primary container — pure white in light mode, near-black in dark" }
    - { token: inverse-surface,  use: "prompt code block — only place dark appears in light mode" }

a11y:
  contrast:
    body-on-background:    ">= 12:1"  # warm charcoal on cream
    primary-on-bg:         ">= 4.5:1" # coral on cream passes WCAG AA
    primary-foreground:    "white on coral, ~6:1"
    muted-foreground:      ">= 4.5:1"
  focus:
    visible: "3px ring at ring/50 with offset; never removed"
    keyboard-only: "Use focus-visible, not :focus, to avoid mouse-click rings"
  touch-target-min: "44px on mobile (h-11)"
  motion: "Respect prefers-reduced-motion: reduce"
  semantics:
    - "Icons that carry meaning include sr-only labels"
    - "Article-style content uses <article>, sections use <section>, navs use <nav> with aria-label"
    - "Interactive chip groups use role=group / role=tablist where appropriate"

iconography-and-imagery:
  illustrations: "Avoid abstract gradient blobs and decorative SVGs."
  photography: "Optional. Treat as flat color blocks that respect surface ladder."
  emoji: "Never used as iconography. Reserved for inline content quotes only."
---

# Look & Feel

AI Daily is a **warm, editorial B2B product**. It reads as if a thoughtful
newsletter and a polished software UI met in the middle — confident enough to
look like a tool, soft enough to not feel like a dashboard. The design system
is built around three ideas:

1. **Warmth before novelty.** Every neutral has a hint of warmth (hue 60–80
   in OKLCH). White is rarely true white; backgrounds are cream, borders are
   sandstone, surfaces step up in subtle warm increments. Even the dark mode
   is warm — never navy, never slate. This warmth is the system's signature
   and the easiest way to know a screen "looks right."

2. **Two colors do the work, neutrals do the rest.** Coral is the only
   action color: brand mark, primary buttons, focus rings, links, "Sign up"
   CTAs, selected chips. Sage is reserved for the *value story* — anything
   labeled "Saves X min," the "With AI" pane in before/after blocks, the
   monthly-savings stat. If a UI element isn't an action and isn't a
   savings claim, it's neutral. This restraint is what keeps long pages
   (Today's tip feed, Library) from feeling busy.

3. **The prompt is the artifact.** The single dark block in the entire
   light-mode UI is the copy-paste prompt panel inside a TipCard. That
   inversion does the heavy lifting: users instantly understand "this is
   the thing to take with me." Don't reuse the inverse surface for any
   other purpose.

## Editorial typography

The product uses **Inter** as a single-family system (with JetBrains Mono
for the prompt block). Weight, size, and tracking carry the hierarchy.
Display heads (`h1`, `h2`, `h3`) use `letter-spacing: -0.02em` for an
editorial feel; body text stays at neutral tracking. Inter's stylistic
sets `cv11`, `ss01`, `ss03` are enabled globally — they refine the lowercase
`a` and `g`, tightening the typographic voice without requiring a second
typeface.

Page titles on landing read as a **statement** (`60px` / line-height `1`),
while section heads inside the app step down to `36px` and tip-card titles
to `20px`. Long titles are wrapped in `text-balance` so they break into
even lines instead of producing orphaned words. Body text is `14px` at
`line-height 1.6` — calm, generous, optimized for skim plus deep read.

## Surface ladder

Containers are layered using a five-step warm ladder:

```
background  →  surface-low  →  surface  →  surface-high  →  surface-highest
   cream      lightly tinted   tinted     elevated         icon plates
```

The convention: a card uses `card` (white) as its primary surface, then
nests `surface-low` for inner panels (scenario block, source block, "before"
block), and uses `surface-highest` only for tiny icon backgrounds. The
ladder gives nested content visual depth without ever needing more than a
single shadow level.

## Cards and the TipCard

The `TipCard` is the system's hero component and sets the conventions
everything else follows:

- `rounded-2xl` outer corner (16px) — softer than a typical 8/12px card,
  matching the friendly tone.
- A meta strip at the top in `surface-low` containing category chip,
  source-verified badge, and a sage "Saves X min" pill that floats right.
- Generous internal padding (`16px` mobile, `24px` desktop) with a
  `gap-5/6` rhythm between the title, scenario, before/after, prompt, and
  source sections.
- Resting elevation `--shadow-brand-soft` (a low-opacity coral-tinted
  shadow). On hover the card lifts `-2px` and the shadow sharpens to
  `--shadow-brand`. This brand-tinted shadow — coral at 8–18% opacity — is
  the visual signature that ties cards, hero buttons, and the logo plate
  together. In dark mode the same shadows fall back to neutral black so
  coral doesn't bloom against the warm dark background.

## The before / with-AI story

Before/after blocks inside a TipCard are the most distinctive interaction
detail: a dashed-border `surface-low` card showing "the old way," a small
sage connector arrow, and a `success-soft` block with a 6px sage left bar
showing "with AI." The sage bar is functional, not decorative — it lets
the success color carry meaning across the entire app (savings chips,
monthly-savings stat, after-pane) without ever competing with coral.

## Buttons, chips, inputs

- **Primary buttons** are coral with white text, `rounded-md` (6px) by
  default. Buttons in the header, bottom nav, and auth flow use
  `rounded-full` for a softer pill treatment.
- **Outline buttons** use the cream `background` with a 1px warm border
  and `shadow-xs`. Hover swaps to the soft-coral `accent` surface.
- **Filter chips** are always pill-shaped (`rounded-full`). Resting state
  is `secondary` (warm beige); the selected state inverts to coral with
  white text. Hover uses the `accent` warm-coral tint, never the full
  primary — coral is reserved for the *selected* state so users always
  know which chip is active.
- **Inputs** use `rounded-xl` (14px) with the warm border and a soft
  `card` background, switching to a 3px coral focus ring at 50% opacity.

## Header and navigation

The site header is a **sticky, glassy** bar: `background/80` with
`backdrop-blur-xl`, `64px` tall, with the brand mark (coral logo plate
with `--shadow-brand-soft`) on the left and pill nav buttons in the
center. On mobile the desktop nav collapses entirely and a fixed
`bottom-nav` takes over with five icon-and-label tabs (`Today`, `Unpack`,
`Advisor`, `Ask`, `Library`). Tab targets are `≥44px` tall for comfortable
thumb reach; the active tab uses the `accent` background with a 2px coral
indicator above the icon.

## Mobile responsiveness

Mobile-first throughout. A few patterns worth knowing:

- **Horizontally scrolling chip rails** (Today's category filters,
  toolkit chips) use the `.scrollbar-hide` utility to suppress the native
  bar — touch swipe is the expected gesture and the bar adds visual noise.
- **3-step info rails** (Unpack's "Paste → Unpack → Get tips," Ask's
  "Live web · Cited · Videos") collapse from `grid-cols-3` to a vertical
  flex stack on mobile so each step's full label and hint stay readable.
- **Page H1s** follow a consistent mobile progression — `text-2xl
  sm:text-3xl md:text-4xl` (24 → 30 → 36) — to keep long titles from
  wrapping to four lines on phones.
- **The marketing footer is hidden** for authenticated users on every
  device. The bottom nav covers product links and the user menu covers
  account links; a thin copyright bar is all that remains. Anonymous
  visitors keep the full footer.

## Dark mode

Dark mode mirrors the light system rather than reinventing it. The
foreground inverts (`background` becomes warm `#22201d`, foreground
becomes warm `#f3eee5`) but the *relationships* hold:

- coral is the only action color, brightened slightly (`oklch 0.72`) for
  dark-on-light contrast,
- sage stays the savings/with-AI color, also brightened,
- the inverse code block flips — in dark mode the prompt panel becomes a
  *light* warm panel against the dark page, preserving the same "this is
  what you take with you" inversion.

There is **no navy, no slate, no cool gray** anywhere in the dark palette.
If a screen looks cold in dark mode, the implementation is wrong.

## What this system avoids

- Gradients (other than the brand-tinted shadow). Solid colors only.
- Purple, violet, navy. The palette is warm by definition.
- Decorative SVG blobs, abstract circles, "filler" geometric art.
- Emoji as iconography. Lucide icons are the only icon system.
- More than two type families.
- More than five active colors on a single screen (background, foreground,
  primary, success, plus a single accent or destructive when needed).
- True black or true white outside of `card` (white) and inside the
  inverse surface. Everything else is warm-neutral.

## Tone and voice in UI copy

Microcopy follows the same restraint as the visuals: action-first, short,
specific. "Unpack into tips" not "Generate now." "Saves 18 min" not
"Time-saving!" Empty states tell the user what to do, not that something
is missing ("Paste an article URL to get started" rather than "No tips
yet"). Every claim that an AI produces is paired with a source — the UI
has space reserved on every TipCard for a citation block, because the
brand promise *is* "tips grounded in official vendor sources." Visual
trust signals (the source-verified badge, the citation list, the
publisher byline) are first-class design elements, not afterthoughts.

## Composition rules

- Layouts are **flex first**. Use grid only for genuine 2D arrangements.
- Spacing uses Tailwind's 4px scale; arbitrary pixel values are a smell.
- Use `gap-*` classes, never `space-*` or per-child margins.
- Wrap titles in `text-balance` and long lede paragraphs in `text-pretty`.
- A page should never need more than `max-w-6xl` (1152px). Reading width
  for body content is `max-w-3xl` (768px) inside that.
- Mobile padding is `px-4 py-6`; desktop `px-6 py-10`.

## When to break the rules

The system is intentionally tight, but two places allow more visual
freedom:

1. **The Today landing module** for logged-in users may use a brief
   illustrated empty state when the daily feed hasn't been generated yet.
2. **The Advisor result panel** uses three colored stripes (success /
   primary / warning) to differentiate "Best pick / Alternatives / Avoid."
   This is the only place in the app where amber appears, and it appears
   only with a `lucide-react` icon and a label — never as a standalone
   color signal.

Anywhere else, prefer restraint. The product earns trust by *not* shouting.
