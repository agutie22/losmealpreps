# CLAUDE.md — Los Meal Preps

> Operating manual for Claude Code. Read this on every session before doing anything else. `PROJECT_PLAN.md` is the deep reference and the **gap list** (§7); `ADMIN_BUILD.md` details the admin + custom-line work.

---

## What this project is

A static, food-forward storefront for **Los Meal Preps**, a pickup-only meal-prep business. Two product lines: a **Signature line** (~5 fixed chef meals + bundles of them) and a **Custom line** (Chipotle-style build-your-own bowl — not built yet). Orders are handed off via **Instagram DM** — no on-site payment. Hosted on **GitHub Pages**.

**This is a working, partially-built codebase — not a clean slate.** Roughly 40% is implemented on the correct stack and works. The job is to *finish and extend* it. See the next section before touching anything.

---

## Working with the existing codebase — read this first

The codebase is the **source of truth**. These rules exist so you reconcile against what's there instead of rebuilding it.

1. **Read before you write.** Before implementing any gap item, read the files it touches. Before creating any file, check whether it already exists. The audit-derived structure is in `PROJECT_PLAN.md` §3 — trust the real paths there (e.g. cart is `src/stores/cartStore.ts`, the builder dir is `react/builder/`), not any earlier prescription.
2. **Working code wins over docs.** If this file or `PROJECT_PLAN.md` describes something differently from how the code actually works, the *code* is right. Note the discrepancy, correct the doc, and move on — never "fix" working code to match a doc.
3. **Smallest diff that closes the gap.** Don't re-scaffold, don't reorganize, don't rename working files or tables, don't replace working components. Extend them. `MealEditor` already does price + toggles — *add* create/delete to it, don't rewrite it.
4. **Schema changes are new migration files only.** Migrations `0001`–`0005` exist and are applied — never edit them. New work is `0006+`.
5. **Don't do redundant work.** If a gap item looks already done, verify and say so rather than redoing it. The Zustand cart, the design tokens, the build-time fetch pattern, the bundle builder, RLS — all work. Leave them.
6. **When a gap item says "leave X alone," that is binding.** `PROJECT_PLAN.md` §7 marks what works. Respect it.

There is no "v1 to avoid reading." The uploaded codebase *is* the project. Read all of it freely.

---

## Hard rules — never violate

1. **Static-only.** Astro `output: 'static'`. No SSR, no API routes, no server actions, no middleware. If a feature seems to need a server, do it client-side with Supabase or rethink it.
2. **Astro by default, React only when justified.** Match the existing split: interactivity/forms/DnD/animation → `src/components/react/`; otherwise `src/components/astro/`.
3. **No vanilla CSS files.** Tailwind v4 + the `@theme` tokens already in `src/styles/globals.css`. No `*.module.css`, no styled-components, no new color system.
4. **TypeScript strict.** Already enforced. No `any`, no unexplained `@ts-ignore`. Supabase queries use generated types from `types/database.types.ts` — regenerate them after every migration.
5. **Build-time fetch for public pages, runtime client for admin.** This pattern is established in `src/lib/queries/*` and the admin island. Follow it.
6. **Centralize business logic in `src/lib/`.** Pricing, macro math, order formatting are pure functions there. This is currently violated (pricing is inline) — fixing it is Gap B; do not add *more* inline logic.
7. **Instagram handoff is clipboard + redirect**, never `?text=`. `navigator.clipboard.writeText(orderText)` then `window.open('https://ig.me/m/{handle}')`. The current code uses `?text=` and is wrong (Gap A1).
8. **Consultation form exception.** General inquiries route to Instagram or `mailto:`, but `/consult` is an approved on-site EmailJS form for macro guidance and personalized plan requests. It must remain client-side only with public EmailJS env vars.

---

## Stack (as built)

| | |
|---|---|
| Framework | Astro `^5.0.0`, `output: 'static'` |
| Interactive | React `^19.2.5` via `@astrojs/react` |
| Styling | Tailwind `^4.2.4` via `@tailwindcss/vite` — tokens in `globals.css` |
| Backend | `@supabase/supabase-js ^2.105.2`, anon key |
| Cart | `zustand ^5.0.12` + persist — `src/stores/cartStore.ts` |
| Consultation email | `@emailjs/browser` via client-side `/consult` form |
| Package manager | **pnpm** |

Installed but unused: `@dnd-kit/*`, `framer-motion`, `react-hook-form`, `@hookform/resolvers`, `zod`, `lucide-react`. They're staged for features that need them — don't remove them, don't force them in where simpler code works.

---

## Where we are — gap tracker

The project is past scaffolding. Work the gap list in `PROJECT_PLAN.md` §7. Update this tracker as groups complete:

- [ ] **Group A** — correctness fixes (Instagram pattern, mobile nav, lint error, placeholder creds, allowlist)
- [ ] **Group B** — extract `pricing.ts` / `macros.ts` / `format-order.ts`
- [ ] **Group C** — complete the Signature line (macro columns, full meal CRUD)
- [ ] **Group D** — build the Custom line (new tables, ingredient library, custom builder)
- [ ] **Group E** — deployment (astro config, CNAME, GitHub Actions, 404)
- [ ] **Group F** — auth: password → magic link (*confirm with user before doing*)
- [ ] **Group G** — optional polish

Suggested order: A and B first (quick, unblock the rest), then C, then D, then E. Re-read the relevant gap item + the referenced `ADMIN_BUILD.md` section before starting.

---

## Decision rules you'll use constantly

### "`.astro` or React island?"
Interactivity beyond `<a>` navigation, or forms / DnD / animation / shadcn → React island in `src/components/react/`. Otherwise `.astro` in `src/components/astro/`. When in doubt, `.astro`.

### "Where does this data come from?"
Public catalog data (meals, bundles, ingredients, tags) → build-time fetch via `src/lib/queries/*`. Cart → Zustand at `src/stores/cartStore.ts`. Admin CRUD → runtime via `src/lib/supabase/client.ts`. No fourth case — if it doesn't fit, ask.

### "Where do styles go?"
Color/font/radius/shadow/motion → token in `globals.css` `@theme` (most already exist — reuse). Layout/one-off → Tailwind utilities. Reusable variants → `cva` in the component. Never a `.css` file.

---

## File placement

| Creating | Goes in |
|---|---|
| A page route | `src/pages/**/*.astro` |
| Static zero-JS component | `src/components/astro/` |
| React island | `src/components/react/` (match existing subdirs: `admin/`, `builder/`) |
| Supabase query function | `src/lib/queries/` |
| Pure utility (pricing, macros, formatting) | `src/lib/` |
| Zustand store | `src/stores/` |
| Token / global rule | `src/styles/globals.css` |
| SQL migration | `supabase/migrations/NNNN_description.sql` — new files only |
| Generated DB types | `types/database.types.ts` — never hand-edit |

Check existence before creating. `src/lib/pricing.ts`, `macros.ts`, `format-order.ts`, `.github/workflows/`, `public/CNAME`, and a 404 page do **not** exist yet — those are gap items.

---

## Commands

```bash
pnpm dev          # dev server
pnpm build        # production build → dist/
pnpm preview      # preview the build
pnpm check        # astro check && tsc --noEmit
pnpm lint         # eslint src/

# Supabase (local)
supabase start
supabase db reset                                          # re-applies migrations + seed
supabase gen types typescript --local > types/database.types.ts
```

There is **no test script**. If Gap B4 (Vitest for pricing/macro math) is taken, add one.

---

## Code conventions

- **Naming.** Astro + React components PascalCase; utilities camelCase; Supabase tables/columns snake_case.
- **Imports.** Use `@/` for `src/` and `@/types/` for `types/`. No `../../../`.
- **Money.** Integers as cents everywhere; format to `$X.XX` only at the render boundary via `formatPrice()` (Gap B1).
- **Macros.** Numeric values stored/passed; units added at render.
- **CSS classes.** `cn()` from `src/lib/utils.ts`.
- **Secrets.** Service-role key never in the codebase. Anon key + `PUBLIC_`-prefixed vars only.
- **EmailJS.** Consultation requests use `PUBLIC_EMAILJS_SERVICE_ID`, `PUBLIC_EMAILJS_TEMPLATE_ID`, and `PUBLIC_EMAILJS_PUBLIC_KEY` (`VITE_EMAILJS_*` is accepted only for compatibility); never add private EmailJS or SMTP credentials to the app.
- **Supabase calls.** Always check `{ error }` — never silently `data!`.

---

## Before declaring any task done

1. `pnpm check` — zero TS errors, zero Astro diagnostics.
2. `pnpm lint` — zero errors. (The repo currently has one — Gap A4 — fix it when you touch that area.)
3. `pnpm build` — completes clean.
4. Visual check at 375 / 768 / 1280px.
5. Diff review — did you change only what the gap item required? No incidental re-scaffolding, no renamed working files, no edited migrations `0001`–`0005`.
6. No new vanilla CSS files; no new color system.
7. If a doc was wrong, correct the doc — don't leave it stale.

---

## When you're stuck

1. Re-read the gap item in `PROJECT_PLAN.md` §7 and any `ADMIN_BUILD.md` section it points to.
2. Read the actual code — it's the source of truth.
3. Run `pnpm check` / `pnpm lint` — sometimes the next step is just what the tooling is saying.
4. For values that must come from the human — admin emails, custom-meal base price, the auth swap, brand assets — see `PROJECT_PLAN.md` §10. Ask; don't invent.

---

## References

- **`PROJECT_PLAN.md`** — §3 real structure, §4 schema + target deltas, §5 design system, §6 route states, **§7 the gap list**, §9 deploy config, §10 open decisions.
- **`ADMIN_BUILD.md`** — §3 the additive migrations, §4 macro/price logic, §5 admin modules, §6 the custom builder.
- Astro 5 — https://docs.astro.build · Supabase JS — https://supabase.com/docs/reference/javascript · @dnd-kit — https://docs.dndkit.com
