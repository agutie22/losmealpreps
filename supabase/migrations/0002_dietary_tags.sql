-- === dietary tags: the filter chips ===
create table dietary_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  short_label text,
  icon_name text,
  color_token text,                         -- maps to a CSS var
  display_order int not null default 0
);

create table meal_dietary_tags (
  meal_id uuid references meals(id) on delete cascade,
  tag_id uuid references dietary_tags(id) on delete cascade,
  primary key (meal_id, tag_id)
);
