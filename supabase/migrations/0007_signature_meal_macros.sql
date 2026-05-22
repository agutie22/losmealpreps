alter table meals
  add column meal_type text not null default 'weekly'
    check (meal_type in ('staple','weekly')),
  add column calories  int          not null default 0,
  add column protein_g numeric(5,1) not null default 0,
  add column carbs_g   numeric(5,1) not null default 0,
  add column fat_g     numeric(5,1) not null default 0;
