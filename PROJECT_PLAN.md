# Los Meal Preps — Project Plan

> **This describes the project as it actually exists**, per the codebase audit. It is not a clean-slate build plan. The app is live-stack, partially implemented, and working in parts. The job is to *finish and extend* it — not rebuild it. Read §0 and §7 before doing anything.
>
> Companion docs: `ADMIN_BUILD.md` (admin dashboard + custom-line spec), `CLAUDE.md` (agent operating manual).

---

## 0. Operating rules

1. **The existing codebase is the source of truth.** Working code wins over any description in this document. If this doc and the code disagree, the code is right and this doc should be corrected — never the reverse.
2. **Evolve, don't rebuild.** Prefer the smallest diff that closes a gap. Do not re-scaffold, do not rename working files, do not replace working components. Before creating any file, check whether it already exists.
3. **Static-only.** Astro `output: 'static'`. No SSR, no API routes, no server actions, no middleware. There is no server.
4. **Astro by default, React only when interactivity demands it.** Match the existing split: `src/components/astro/` for static, `src/components/react/` for islands.
5. **No vanilla CSS files.** Tailwind v4 + the `@theme` tokens already defined in `src/styles/globals.css`.
6. **TypeScript strict.** Already enforced via `astro/tsconfigs/strict`. No `any`, no unexplained `@ts-ignore`.
7. **Build-time data fetch for public pages, runtime client for admin.** This pattern is already established in `src/lib/queries/*` and the admin island — follow it.
8. **Centralize business logic.** Pricing, macro math, and order formatting belong in `src/lib/` pure functions. This is currently *violated* (see Gap B) — the fix is part of the work, not a reason to add more inline logic.

---

## 1. Mission

A static, food-forward storefront for **Los Meal Preps**, a pickup-only meal-prep business. Two product lines that share a storefront but almost no logic:

- **Signature line** — ~5 chef meals (2 staple + 3 weekly) and bundles built from them. Fixed, not customizable. Macros entered directly by the admin. This is what the current `meals` and `bundles` tables represent.
- **Custom line** — a Chipotle-style build-your-own bowl: customer picks protein, carbs, veggies, sauces, and flavor; macros and price compute live from the parts. **This line does not exist yet** (see Gap D).

Orders are handed off to the business via **Instagram DM** — no on-site payment. Admins manage the menu through a magic-link-protected dashboard (currently password-protected — see Gap F).

---

## 2. Tech stack (as built)

| Layer | Actual | Notes |
|---|---|---|
| Framework | Astro `^5.0.0`, `output: 'static'` | |
| Interactive | React `^19.2.5` via `@astrojs/react ^5.0.4` | |
| Styling | Tailwind `^4.2.4` via `@tailwindcss/vite` | Tokens in `src/styles/globals.css` |
| Backend | `@supabase/supabase-js ^2.105.2` | Anon key, build-time + runtime |
| Cart state | `zustand ^5.0.12` (+ persist) | `src/stores/cartStore.ts` |
| Type system | TypeScript `^6.0.3`, strict | `@/*`→`src/`, `@/types/*`→`types/` |
| Lint / check | `eslint ^10.3.0`, `@astrojs/check ^0.9.9` | |
| Package manager | **pnpm** | `pnpm-lock.yaml` present |

**Scripts:** `dev`, `build`, `preview`, `check` (`astro check && tsc --noEmit`), `lint` (`eslint src/`). **No test script exists.**

**Installed but unused** — `@dnd-kit/*`, `framer-motion`, `react-hook-form`, `@hookform/resolvers`, `zod`, `lucide-react`. These are dependencies waiting for the features that need them (drag-and-drop in the builder, forms in admin, validation). Don't remove them; don't feel obligated to use them where simpler code suffices.

---

## 3. Project structure (as built)

```
src/
├── components/
│   ├── astro/
│   │   ├── BundleTierCard.astro
│   │   ├── MealCard.astro
│   │   └── Pill.astro
│   └── react/
│       ├── admin/
│       │   ├── AdminApp.tsx          # admin shell, tab switching
│       │   ├── DeployManager.tsx     # writes deploy_triggers row
│       │   ├── LoginForm.tsx         # password auth
│       │   ├── MealEditor.tsx        # edit price + toggles only
│       │   └── SettingsEditor.tsx    # 4 site_settings keys
│       └── builder/
│           ├── BundleBuilder.tsx     # bundle slot builder (island root)
│           ├── MealSelector.tsx      # click-to-add meal cards
│           ├── OrderSummary.tsx      # total + Instagram handoff
│           └── SlotManager.tsx       # filled/empty slots
├── layouts/
│   └── Layout.astro
├── lib/
│   ├── queries/
│   │   ├── bundles.ts
│   │   ├── meals.ts
│   │   └── settings.ts
│   ├── supabase/
│   │   ├── build.ts                  # build-time anon client
│   │   └── client.ts                 # runtime anon client (identical to build.ts)
│   └── utils.ts                      # cn() only
├── pages/
│   ├── index.astro                   # /
│   ├── build.astro                   # /build
│   └── admin.astro                   # /admin
├── stores/
│   └── cartStore.ts
└── styles/
    └── globals.css
types/
└── database.types.ts
supabase/
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_dietary_tags.sql
│   ├── 0003_site_settings.sql
│   ├── 0004_rls_policies.sql
│   └── 0005_deploy_triggers.sql
└── seed.sql
```

**Note the real paths** — cart is `src/stores/cartStore.ts` (not `src/lib/store/`), the builder dir is `builder/` (not `BundleBuilder/`). New work conforms to *these* paths, not any earlier prescription.

**Does not exist yet:** `src/components/react/ui/` (no shadcn components generated, though `components.json` exists), `src/lib/pricing.ts`, `src/lib/macros.ts`, `src/lib/format-order.ts`, `src/lib/schemas/` (empty), `.github/workflows/`, `public/CNAME`, a 404 page, any dynamic routes.

---

## 4. Data model (as built + target deltas)

### 4.1 Current schema — 10 tables, all with RLS

| Table | Purpose | State |
|---|---|---|
| `meals` | Signature meals | **No macro columns, no `meal_type`** — see delta |
| `ingredients` | Custom-line ingredient library | `type` CHECK lacks `flavor`, no variants — see delta |
| `meal_default_ingredients` | join (old swap model) | **Dead in two-system model** |
| `meal_swap_options` | join (old swap model) | **Dead in two-system model** |
| `bundles` | Signature bundles | Works as-is — leave alone |
| `dietary_tags` | Filter chips | Works as-is |
| `meal_dietary_tags` | join | Works as-is |
| `site_settings` | key/value config | Works as-is |
| `deploy_triggers` | rebuild signal | Table works; nothing consumes it (Gap E) |

`meals` columns: `id, slug, name, description, hero_image_url, base_price_cents, category, rating, rating_count, is_active, is_featured, created_at`.

`ingredients` columns: `id, name, type (CHECK protein/carb/veggie/sauce), image_url, calories, protein_g, carbs_g, fat_g, upcharge_cents, is_active, created_at`.

`bundles` columns: `id, tier (CHECK standard/premium), display_name, tagline, slot_count, base_price_cents, per_slot_savings_cents, hero_image_url, is_active`.

**RLS:** enabled on all tables; public `SELECT` on active rows; admin writes gated by `is_admin(auth.jwt()->>'email')` against an allowlist of `admin@example.com, hello@losmealpreps.com, alex@losmealpreps.com`.

### 4.2 Target deltas — new migrations, never edit 0001–0005

The two-system model needs these changes. They are **additive** — the existing tables and queries keep working. Full SQL is in `ADMIN_BUILD.md` §3.

- **`0006` — Signature macros.** `ALTER TABLE meals` add `meal_type text CHECK (staple/weekly)`, `calories int`, `protein_g numeric(5,1)`, `carbs_g numeric(5,1)`, `fat_g numeric(5,1)`. The `meals` table *is* the Signature line — it is not renamed.
- **`0007` — Custom line.** `ALTER TABLE ingredients` add `flavor` to the `type` CHECK, add `available_as_side boolean`, add `display_order int`. `CREATE TABLE ingredient_variants` (size variants + per-variant macros/price for proteins and side-sauces). `CREATE TABLE custom_meal_config` (single-row rules). RLS for the new tables.
- **`0008` (cleanup, low priority) — Drop `meal_default_ingredients` and `meal_swap_options`.** Genuinely dead in the two-system model — signature meals store their own macros, the custom line picks freely. Safe to drop, but not urgent; leave them if unsure.
- **Admin allowlist** — remove `admin@example.com` from `is_admin()` (Gap A).

`bundles` is **not** redesigned — `slot_count` already means "how many signature meals," `base_price_cents` is the flat price. It works. Leave it.

---

## 5. Design system

**The token system is already implemented** in `src/styles/globals.css` under `@theme` — surfaces, brand (charcoal + terracotta accent + ochre), text, macro-pill colors, Fraunces/Inter type, radii, shadows, motion. Shadcn token mappings are present even though no shadcn components are generated. **Leave the tokens alone.** New UI references existing tokens; it does not introduce new colors or a new system.

The structural patterns for any new or reworked UI (pill CTAs, off-white page background, photo-led cards, macro pills, generous whitespace, subtle motion, sticky summary rails) remain the standard. Match what `MealCard.astro`, `BundleTierCard.astro`, and `Pill.astro` already do.

---

## 6. Routes & page state

| Route | File | State |
|---|---|---|
| `/` | `index.astro` | **Works (partial)** — hero, how-it-works, meal section, bundle section, footer all render from build-time data. Macro pills show literal "Placeholder Macros" (Gap C). Mobile nav button is dead (Gap A). |
| `/build` | `build.astro` | **Works (partial)** — bundle builder, click-to-add into Zustand slots, Instagram handoff. No drag-and-drop, no in-page tier switching, no dietary filters, no per-meal macros. Instagram handoff uses the wrong pattern (Gap A). |
| `/admin` | `admin.astro` | **Works (partial)** — password login, Manage Meals + Site Settings tabs, deploy button. MealEditor can only edit price + toggles (Gap C). |
| — | — | **Missing:** the Custom-line page (Gap D), a 404 page (Gap E). |

The "cart" is the bundle slot array in `cartStore.ts`, surfaced only on `/build`. There is no separate cart drawer or cart page, and for the Signature/bundle flow none is needed — the builder *is* the cart.

---

## 7. Gap list

This replaces the old build-phase plan. Each gap states what exists, what's missing, and what to leave alone. Tackle groups roughly in order: **A and B are quick wins and unblock everything else; C completes the Signature line; D is the major new build; E and F are deployment and auth; G is optional polish.**

### Group A — Correctness fixes (existing code is wrong or broken)

> Small, high-value, low-risk. Do these first. Do not refactor surrounding code while fixing them.

- **A1. Instagram handoff pattern.** `OrderSummary.tsx` opens `https://ig.me/m/{handle}?text={encoded}`. Instagram ignores `?text=`. Replace with: `navigator.clipboard.writeText(orderText)` then `window.open('https://ig.me/m/{handle}')`, plus a confirmation that the order was copied. **Leave the rest of `OrderSummary` alone.**
- **A2. Instagram handle source.** Same file hardcodes `igHandle = 'losmealpreps'`. Read it from `site_settings.instagram_handle` (already fetched elsewhere; thread it through as a prop).
- **A3. Mobile nav.** `Layout.astro` renders a hamburger button with no handler and no menu. Wire a toggle + mobile drawer. **Leave desktop nav alone — it works.**
- **A4. Lint error.** `DeployManager.tsx:9` — `fetchLastDeploy` used before declaration. Hoist the function or move the `useEffect`. `pnpm lint` must pass clean after.
- **A5. Remove placeholder credentials.** `LoginForm.tsx` defaults the fields to `admin@example.com` / `admin123`. Remove the defaults (empty strings).
- **A6. Remove `admin@example.com` from `is_admin()`.** New migration. Keep `hello@` and `alex@losmealpreps.com` (confirm these are the real admin emails).
- **A7. Consolidate Supabase clients.** `lib/supabase/build.ts` and `client.ts` are byte-identical. Keep both *filenames* (imports depend on them) but have one re-export the other, or document why two exist. Low risk, low priority — fine to defer.

### Group B — Extract business logic into `src/lib/` (Operating rule #8)

> Currently pricing is inline in four files, macros aren't computed at all, order text is inline. Centralize before building the Custom line, which depends on these.

- **B1. `src/lib/pricing.ts`** + a `formatPrice(cents)` helper. Replace the inline `(cents/100).toFixed(2)` in `MealCard.astro`, `BundleTierCard.astro`, `OrderSummary.tsx`, `MealEditor.tsx` with calls to it. **Behavior must not change** — this is a pure extraction.
- **B2. `src/lib/macros.ts`** — macro summing + the variant auto-fill helpers (`scaleProteinMacros` 1.33×, `scaleSauceMacros` 4×). Spec in `ADMIN_BUILD.md` §4.
- **B3. `src/lib/format-order.ts`** — move `generateIgMessage` out of `OrderSummary.tsx` into a pure function. `OrderSummary` calls it.
- **B4. (Optional) Add Vitest** and unit-test B1–B3. There is no test runner today. Worth it for pricing/macro math; skip if keeping the toolchain minimal.

### Group C — Complete the Signature line

- **C1. Migration `0006`** — macro columns + `meal_type` on `meals` (see §4.2).
- **C2. Real macros on `MealCard`.** Replace the literal "Placeholder Macros" `Pill` with the actual values now stored on each meal. Update `lib/queries/meals.ts` to select the new columns and `types/database.types.ts` after the migration.
- **C3. Full meal CRUD in `MealEditor`.** Today it only edits price + toggles. Add create, delete, image upload (Supabase Storage), and editing of name/description/category/macros/`meal_type`. Detailed spec in `ADMIN_BUILD.md` §5. **Leave the working price/toggle controls in place** — extend, don't replace.

### Group D — Build the Custom line (the major new work)

> None of this exists. It is genuinely new — not a reconciliation.

- **D1. Migration `0007`** — `ingredient_variants`, `custom_meal_config`, `flavor` type, RLS (see §4.2 and `ADMIN_BUILD.md` §3).
- **D2. Ingredient Library admin module** — type-aware editor with the protein/sauce variant sub-forms. `ADMIN_BUILD.md` §5.
- **D3. Custom Meal Config admin module** — single-record editor. `ADMIN_BUILD.md` §5.
- **D4. Custom builder page + island** — new route (e.g. `/customize`), build-time fetch of the ingredient library, React island for live selection with live macros (`lib/macros.ts`) and live price (`lib/pricing.ts`). `ADMIN_BUILD.md` §6.
- **D5. Instagram handoff for custom orders** — `format-order.ts` gains a custom-meal formatter.

### Group E — Deployment (nothing is configured)

- **E1. `astro.config.mjs`** — add `site: 'https://losmealpreps.com'`. No `base` (root-domain custom domain).
- **E2. `public/CNAME`** — file containing `losmealpreps.com`. Configure DNS + "Enforce HTTPS" in repo Pages settings.
- **E3. `.github/workflows/deploy.yml`** — build + deploy to GitHub Pages. Triggers: push to `main`, 6-hour cron, `workflow_dispatch`. See §9.
- **E4. Wire `deploy_triggers` to a rebuild** — the table and the admin button already exist and do nothing. Either (a) a scheduled GitHub Action polls the table, or (b) simpler: the `DeployManager` button calls the GitHub `workflow_dispatch` API directly and the `deploy_triggers` table becomes just an audit log. Pick (b) unless there's a reason not to.
- **E5. 404 page** — `src/pages/404.astro`.

### Group F — Auth (confirm scope before doing)

- **F1. Password → magic link.** The dashboard currently uses `signInWithPassword` and it *works*. An earlier decision favored magic link. **This swaps working code for a different working approach** — confirm it's still wanted before doing it. Password auth for a single admin, with signups disabled and a strong password, is defensible. If confirmed: replace `signInWithPassword` with `signInWithOtp`, add an `/admin/auth/callback` static page, keep the `is_admin()` allowlist as the gate.

### Group G — Optional polish (lower priority)

- **G1. In-builder tier switching** — `/build` can't switch Standard/Premium without returning home.
- **G2. Dietary filter chips** — on the homepage menu and/or builder.
- **G3. Per-meal macros in builder cards.**
- **G4. Drag-and-drop in the builder** — `@dnd-kit` is installed and unused. Click-to-add works today; DnD is an enhancement, not a fix.
- **G5. shadcn primitives** — `components.json` exists but nothing is generated. Add them only if a specific component needs one; don't generate the full set preemptively.

---

## 8. Anti-patterns to avoid

- ❌ Re-scaffolding or "cleaning up" working files that no gap item names.
- ❌ Renaming `meals`, `bundles`, `cartStore.ts`, or any working file/table to match an earlier doc. Reality wins.
- ❌ Editing migrations `0001`–`0005`. Schema changes are new migration files only.
- ❌ Adding more inline pricing/macro/order logic. It goes in `src/lib/`.
- ❌ Vanilla CSS files or new color systems. Use the existing tokens.
- ❌ Building the Custom line by reusing `meal_default_ingredients`/`meal_swap_options`. Those are dead; the custom builder composes from `ingredients` + `ingredient_variants` at runtime.
- ❌ Generating the full shadcn component set "just in case."
- ❌ Treating Group F as free — it's a swap of working code; confirm first.

---

## 9. Deploy config (Group E reference)

### `astro.config.mjs` — target

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://losmealpreps.com',   // custom domain — no `base`
  output: 'static',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
```

`public/CNAME` contains exactly `losmealpreps.com`. DNS: apex `A`/`ALIAS` records at GitHub Pages IPs, `www` `CNAME` to `USERNAME.github.io`; enable custom domain + "Enforce HTTPS" in repo Pages settings.

### `.github/workflows/deploy.yml` — target

```yaml
name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  schedule: [{ cron: '0 */6 * * *' }]   # admin content changes propagate
  workflow_dispatch:                     # admin "Publish" button
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: false }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          PUBLIC_SUPABASE_URL: ${{ secrets.PUBLIC_SUPABASE_URL }}
          PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.PUBLIC_SUPABASE_ANON_KEY }}
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: '${{ steps.deployment.outputs.page_url }}' }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Note: workflow uses **pnpm** (the repo's package manager), not npm.

---

## 10. Decisions & remaining items

### Resolved

- **Two-system architecture** — Signature line (`meals` + `bundles`, fixed, direct macros) and Custom line (`ingredients` + variants, runtime-composed). Separate by design.
- **Signature meals store macros directly** — not composed from ingredients.
- **Protein/side-sauce sizing** — variants on the ingredient row (6oz/8oz protein, 2oz/8oz side sauce), each with own macros + price. 8oz protein macros auto-fill at 1.33×, 8oz sauce at 4×; prices always manual; all overridable.
- **Instagram handle** `losmealpreps`; **pickup only** (no delivery-address fields); **custom domain** `losmealpreps.com`.
- **Auth target** — magic link (but currently password; see Gap F1 — confirm before swapping).

### Remaining — settle before the relevant gap

- **Admin email allowlist** (Gap A6) — confirm `hello@` and `alex@losmealpreps.com` are the real, only admin addresses.
- **Custom-meal pricing detail** (Gap D) — base price + variant prices + upcharges is the model; confirm the actual base price and whether veggies carry upcharges or are all included.
- **Double protein** — not specced; if wanted it's a 2× multiplier on the chosen protein variant. Decide before D4.
- **Auth swap** (Gap F1) — confirm magic link is still wanted given password auth already works.
- **Brand identity** — logo, voice, final tagline. Tokens are a solid neutral starter; re-skin via `globals.css` when brand is locked.
