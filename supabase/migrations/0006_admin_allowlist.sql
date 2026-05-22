create or replace function is_admin(user_email text)
returns boolean
language sql security definer as $$
  select user_email in (
    'losmealpreps@gmail.com'
  );
$$;
