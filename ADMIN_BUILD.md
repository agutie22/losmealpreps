# ADMIN_BUILD.md — Admin Dashboard & Custom Line

> Grounded in the codebase audit. This describes what the admin **currently does**, what the schema **currently is**, and the **additive** changes that complete it. Companion to `PROJECT_PLAN.md` (see its §7 gap list — this file is the detail for Gaps C and D).
>
> **Nothing here replaces working code.** Every schema change is a new migration file. Every UI change extends an existing component or adds a new one — it does not rebuild what works.

---

## 1. Two systems — the architecture

The storefront has two product lines. They share a brand and almost no logic. Keep them separate.

| | **Signature line** | **Custom line** |
|---|---|---|
| Tables | `meals`, `bundles` (exist) | `ingredients` (+ new `ingredient_variants`, `custom_meal_config`) |
| Customizable? | No | Yes |
| Macros | Stored directly on the row | Computed live from selected ingredients |
| Pricing | Flat, admin-entered | Itemized: base + variant prices + upcharges |
| Built? | **Partially** — see §2 | **Not at all** — see §6 |

---

## 2. Current state of the admin

`/admin` is `admin.astro` hosting `AdminApp.tsx` as a `client:only="react"` island. **It works** — these things are done and should be left alone except where a gap item names them:

- **Auth** — `LoginForm.tsx` uses `signInWithPassword`; session persisted via `onAuthStateChange`. Works. (Target is magic link — `PROJECT_PLAN.md` Gap F1, confirm before swapping.)
- **Two tabs** — "Manage Meals" and "Site Settings."
- **`SettingsEditor.tsx`** — edits `hero_headline`, `tagline`, `instagram_handle`, `contact_email`; saves on blur. Works — leave alone.
- **`DeployManager.tsx`** — inserts a `deploy_triggers` row. Works as a write; nothing consumes it yet (`PROJECT_PLAN.md` Gap E4). Has a lint error (Gap A4).
- **`MealEditor.tsx`** — lists all meals; edits `base_price_cents`, toggles `is_active`/`is_featured`. **This is the partial one** — no create, no delete, no image upload, no editing of name/description/category/macros. Gap C3 extends it.

**To finish the admin, two things are added:** full meal CRUD (extend `MealEditor`), and the Custom-line modules (new). Everything else stays.

---

## 3. Schema changes — additive migrations only

Current migrations run `0001`–`0005`. **Never edit them.** Add new files. Full current schema is in `PROJECT_PLAN.md` §4.1.

### Migration `0006_signature_meal_macros.sql`

The `meals` table *is* the Signature line. It is **not renamed**. It gains direct macro storage and a staple/weekly type.

```sql
alter table meals
  add column meal_type text not null default 'weekly'
    check (meal_type in ('staple','weekly')),
  add column calories  int          not null default 0,
  add column protein_g numeric(5,1) not null default 0,
  add column carbs_g   numeric(5,1) not null default 0,
  add column fat_g     numeric(5,1) not null default 0;

-- backfill existing rows with real values via seed.sql or the admin UI afterward
```

After applying: regenerate `types/database.types.ts`, and update `lib/queries/meals.ts` to select the new columns.

### Migration `0007_custom_line.sql`

```sql
-- 1. extend the ingredient type set + add custom-line columns
alter table ingredients
  drop constraint ingredients_type_check,
  add  constraint ingredients_type_check
       check (type in ('protein','carb','veggie','sauce','flavor'));

alter table ingredients
  add column available_as_side boolean not null default false,
  add column display_order     int     not null default 0;

-- 2. size variants — only proteins (6oz/8oz) and side-sauces (2oz/8oz) get rows here.
--    each variant carries its OWN macros and its OWN price.
create table ingredient_variants (
  id            uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  size_label    text not null,            -- '6 oz' | '8 oz' | '2 oz'
  calories      int          not null,
  protein_g     numeric(5,1) not null,
  carbs_g       numeric(5,1) not null,
  fat_g         numeric(5,1) not null,
  price_cents   int          not null,    -- always entered manually
  is_default    boolean      not null default false,
  display_order int          not null default 0,
  unique (ingredient_id, size_label)
);

-- 3. custom-meal rules — single row enforced
create table custom_meal_config (
  id                    int primary key default 1 check (id = 1),
  base_price_cents      int not null,
  included_veggie_count int not null default 2,
  included_sauce_count  int not null default 1,
  max_veggie_count      int not null default 4,
  updated_at            timestamptz not null default now()
);

-- 4. RLS — match the existing pattern from 0004
alter table ingredient_variants enable row level security;
alter table custom_meal_config  enable row level security;

create policy "public read variants" on ingredient_variants
  for select using (true);
create policy "admin write variants" on ingredient_variants
  for all using (is_admin(auth.jwt()->>'email'))
  with check (is_admin(auth.jwt()->>'email'));

create policy "public read config" on custom_meal_config
  for select using (true);
create policy "admin write config" on custom_meal_config
  for all using (is_admin(auth.jwt()->>'email'))
  with check (is_admin(auth.jwt()->>'email'));

insert into custom_meal_config (id, base_price_cents) values (1, 0)
  on conflict (id) do nothing;
```

### Migration `0008_admin_allowlist.sql` (also Gap A6)

Remove the placeholder admin email from `is_admin()`. Recreate the function with only the real addresses (confirm them first).

```sql
create or replace function is_admin(email text) returns boolean as $$
  select email in ('hello@losmealpreps.com', 'alex@losmealpreps.com');
$$ language sql stable;
```

### Migration `0009_drop_dead_joins.sql` (optional cleanup, low priority)

`meal_default_ingredients` and `meal_swap_options` are dead in the two-system model — signature meals store their own macros, the custom builder composes freely. Safe to drop. Skip if uncertain; they harm nothing.

```sql
drop table if exists meal_swap_options;
drop table if exists meal_default_ingredients;
```

---

## 4. Macro & price logic — `src/lib/`

These files don't exist yet (`PROJECT_PLAN.md` Gap B). Create them as pure functions; the admin previews, the custom builder, and `format-order.ts` all import from here. No inline duplication.

### `src/lib/macros.ts`

```ts
export type Macros = { calories: number; protein_g: number; carbs_g: number; fat_g: number };

const round1 = (n: number) => Math.round(n * 10) / 10;

// 8oz protein variant auto-fill from 6oz. Admin can override any field after.
export function scaleProteinMacros(sixOz: Macros): Macros {
  const f = 8 / 6;
  return {
    calories:  Math.round(sixOz.calories * f),
    protein_g: round1(sixOz.protein_g * f),
    carbs_g:   round1(sixOz.carbs_g * f),
    fat_g:     round1(sixOz.fat_g * f),
  };
}

// 8oz side-sauce auto-fill from 2oz. Admin can override.
export function scaleSauceMacros(twoOz: Macros): Macros {
  const f = 4;
  return {
    calories:  Math.round(twoOz.calories * f),
    protein_g: round1(twoOz.protein_g * f),
    carbs_g:   round1(twoOz.carbs_g * f),
    fat_g:     round1(twoOz.fat_g * f),
  };
}

// Sum a fully-selected custom meal into total macros.
export function sumCustomMealMacros(parts: Macros[]): Macros { /* reduce + round1 */ }
```

### `src/lib/pricing.ts`

```ts
export const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

// Custom meal — itemized, transparent.
export function priceCustomMeal(sel: CustomSelection, cfg: CustomMealConfig): number {
  let c = cfg.base_price_cents;
  c += sel.proteinVariant.price_cents;                       // 6oz or 8oz
  if (sel.sideSauceVariant) c += sel.sideSauceVariant.price_cents;
  c += sel.extraVeggies.reduce((s, v) => s + v.upcharge_cents, 0);
  c += sel.flavor?.upcharge_cents ?? 0;
  return c;
}

// Signature meals & bundles: no computation — price_cents / base_price_cents is read directly.
```

`formatPrice` replaces the inline `(cents/100).toFixed(2)` in `MealCard.astro`, `BundleTierCard.astro`, `OrderSummary.tsx`, `MealEditor.tsx` — a pure extraction, no behavior change.

---

## 5. Admin modules

### 5.1 Extend `MealEditor` — full Signature CRUD (Gap C3)

Keep the existing list + price/toggle editing. **Add:**

- **Create** — new meal form: name, slug (auto from name), description, `category`, `meal_type` (staple/weekly), `hero_image_url` (upload), the four macro fields (entered directly), `is_active`/`is_featured`.
- **Delete** — with confirm.
- **Edit** — the create form, prefilled; today only price/toggles are editable, extend it to all fields.
- **Image upload** — Supabase Storage bucket `meal-photos` (public); store the returned URL. Validate type/size client-side.

The weekly workflow this enables: deactivate last week's 3 weekly meals, create/activate this week's 3, leave the 2 staples alone.

### 5.2 New — Ingredient Library module

A third admin tab. Tabbed by type: **Proteins · Carbs · Veggies · Sauces · Flavors**. Each is a table with inline active toggle + reorder (`display_order`).

Create/edit form is **type-aware**:

- **Protein** — name, photo, then a 2-row variant editor: *6 oz* (enter macros + price) and *8 oz* (price manual; macros auto-fill via `scaleProteinMacros` on blur of the 6oz fields, every field overridable). Mark one variant `is_default`. Writes `ingredients` + two `ingredient_variants` rows.
- **Sauce** — name, photo, single-portion macros (on-meal use), and an **"available as a side"** toggle. When on, reveal a 2-row variant editor: *2 oz* and *8 oz* (8oz auto-fills via `scaleSauceMacros`, overridable).
- **Carb / Veggie / Flavor** — name, photo, single-portion macros, optional `upcharge_cents`. No variant editor. Flavor macros default to 0 — fine for dry seasonings.

Include a **"Clone ingredient"** action for near-duplicate entries. Images → Supabase Storage bucket `ingredient-photos`.

### 5.3 New — Custom Meal Config module

A single-record editor for the one `custom_meal_config` row: base price, included veggie count, included sauce count, max veggie count. Rarely touched.

### 5.4 Deploy

`DeployManager` already exists. Per `PROJECT_PLAN.md` Gap E4, have its button call the GitHub `workflow_dispatch` API directly so a rebuild actually happens; the `deploy_triggers` insert stays as an audit log. After any admin save, the existing "changes go live on next build" messaging applies.

---

## 6. The Custom builder (Gap D4) — client side

A new route, `/customize` (`src/pages/customize.astro`), build-time-fetching the active ingredient library + variants + `custom_meal_config`, hosting a React island for the build.

Flow: customer picks **protein → size (6/8oz) → flavor → carb → veggies (up to `max_veggie_count`) → on-meal sauces (up to `included_sauce_count`) → optional side sauce → side size (2/8oz)**. The island shows macros summing live (`sumCustomMealMacros`) and price summing live (`priceCustomMeal`), the same way the bundle builder shows its total. On completion, `format-order.ts` produces the Instagram message and the handoff uses the **clipboard + `ig.me` redirect** pattern (the corrected A1 pattern — not `?text=`).

The Custom line is independent of the bundle builder on `/build` — different route, different island, no shared slot logic. It composes from `ingredients`/`ingredient_variants` at runtime and persists nothing.

---

## 7. Build order for Gaps C & D

1. Migration `0006`, regenerate types, update `lib/queries/meals.ts`.
2. `lib/macros.ts` + `lib/pricing.ts` (Gap B) — pure functions first; everything below needs them.
3. Extend `MealEditor` to full CRUD (5.1). Replace the "Placeholder Macros" pill on `MealCard` with real values (Gap C2).
4. Migration `0007`, regenerate types.
5. Ingredient Library module (5.2), then Custom Meal Config module (5.3).
6. `/customize` page + builder island (6), `format-order.ts` custom formatter.
7. Migrations `0008` (allowlist) and optionally `0009` (drop dead joins).

---

## 8. Confirm before building

- **Admin emails** — are `hello@` and `alex@losmealpreps.com` the real and only admin addresses? (Blocks `0008`.)
- **Custom base price** — the actual `custom_meal_config.base_price_cents`, and whether veggies are all included (`upcharge_cents = 0`) or some carry an upcharge.
- **Double protein** — offer it? If yes, it's a 2× multiplier on the chosen protein variant's macros + price in the builder.
- **Auth swap** — magic link still wanted, given password auth already works? (`PROJECT_PLAN.md` Gap F1.)
