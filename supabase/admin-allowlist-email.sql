-- Admin access only for this email (magic-link sign-in must match).
-- Replaces open "Admin read" + "Authenticated write" policies.
-- Safe to re-run: drops then recreates.
drop policy if exists "Admin read all meal_items" on public.meal_items;
drop policy if exists "Admin read all ingredients" on public.ingredients;
drop policy if exists "Admin read all bundle_deals" on public.bundle_deals;
drop policy if exists "Admin read all bundle_deal_proteins" on public.bundle_deal_proteins;

drop policy if exists "Authenticated write meal_items" on public.meal_items;
drop policy if exists "Authenticated write ingredients" on public.ingredients;
drop policy if exists "Authenticated write bundle_deals" on public.bundle_deals;
drop policy if exists "Authenticated write bundle_deal_proteins" on public.bundle_deal_proteins;

-- Read all rows (incl. inactive) for admin UI — only this email
create policy "Admin read all meal_items"
on public.meal_items for select
to authenticated
using ((auth.jwt() ->> 'email') = 'losmealpreps@gmail.com');

create policy "Admin read all ingredients"
on public.ingredients for select
to authenticated
using ((auth.jwt() ->> 'email') = 'losmealpreps@gmail.com');

create policy "Admin read all bundle_deals"
on public.bundle_deals for select
to authenticated
using ((auth.jwt() ->> 'email') = 'losmealpreps@gmail.com');

create policy "Admin read all bundle_deal_proteins"
on public.bundle_deal_proteins for select
to authenticated
using ((auth.jwt() ->> 'email') = 'losmealpreps@gmail.com');

-- Writes — only this email
create policy "Authenticated write meal_items"
on public.meal_items for all
to authenticated
using ((auth.jwt() ->> 'email') = 'losmealpreps@gmail.com')
with check ((auth.jwt() ->> 'email') = 'losmealpreps@gmail.com');

create policy "Authenticated write ingredients"
on public.ingredients for all
to authenticated
using ((auth.jwt() ->> 'email') = 'losmealpreps@gmail.com')
with check ((auth.jwt() ->> 'email') = 'losmealpreps@gmail.com');

create policy "Authenticated write bundle_deals"
on public.bundle_deals for all
to authenticated
using ((auth.jwt() ->> 'email') = 'losmealpreps@gmail.com')
with check ((auth.jwt() ->> 'email') = 'losmealpreps@gmail.com');

create policy "Authenticated write bundle_deal_proteins"
on public.bundle_deal_proteins for all
to authenticated
using ((auth.jwt() ->> 'email') = 'losmealpreps@gmail.com')
with check ((auth.jwt() ->> 'email') = 'losmealpreps@gmail.com');
