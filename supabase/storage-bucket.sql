insert into storage.buckets (id, name, public) values ('menu-images', 'menu-images', true) ON CONFLICT (id) DO NOTHING;

drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Admin Upload" on storage.objects;
drop policy if exists "Admin Update" on storage.objects;
drop policy if exists "Admin Delete" on storage.objects;

create policy "Public Access" on storage.objects for select using ( bucket_id = 'menu-images' );

create policy "Admin Upload" on storage.objects for insert to authenticated with check ( bucket_id = 'menu-images' and (auth.jwt() ->> 'email') = 'losmealpreps@gmail.com' );
create policy "Admin Update" on storage.objects for update to authenticated using ( bucket_id = 'menu-images' and (auth.jwt() ->> 'email') = 'losmealpreps@gmail.com' );
create policy "Admin Delete" on storage.objects for delete to authenticated using ( bucket_id = 'menu-images' and (auth.jwt() ->> 'email') = 'losmealpreps@gmail.com' );
