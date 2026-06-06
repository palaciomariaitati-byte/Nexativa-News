/* supabase_schema.sql */

-- #########################################################
--  Supabase schema for Nexativa News (enhanced version)
--  ---------------------------------------------------------
--  1️⃣ Table profiles (id directly references auth.users)
--  2️⃣ Table articles
--  3️⃣ Trigger to auto‑create profile on user sign‑up
--  4️⃣ Row‑Level Security (RLS) policies
-- #########################################################

-----------------------------------------------------------------
-- 1️⃣  Profiles
-----------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  updated_at  timestamp with time zone default now(),
  username    text,                 -- will hold the email from auth.users
  full_name   text,
  role        text not null default 'redactor'
);

-----------------------------------------------------------------
-- 2️⃣  Articles
-----------------------------------------------------------------
create table if not exists public.articles (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  excerpt     text,
  content     text,
  image_url   text,
  category    text,
  status      text not null default 'draft',
  created_at  timestamp with time zone default now(),
  updated_at  timestamp with time zone default now(),
  author_id   uuid references public.profiles (id) on delete set null
);

-----------------------------------------------------------------
-- 3️⃣  Auto‑create profile on auth.users insert
-----------------------------------------------------------------
create or replace function public.create_profile_on_auth_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, username, role)
  values (new.id, new.email, 'redactor');
  return new;
end;
$$;

create trigger create_profile_trigger
after insert on auth.users
for each row execute function public.create_profile_on_auth_user();

-----------------------------------------------------------------
-- 4️⃣  Row‑Level Security (RLS) and policies
-----------------------------------------------------------------
-- Enable RLS
alter table public.profiles enable row level security;
alter table public.articles enable row level security;

-- ==== profiles ==== 
-- Anyone can read profiles
create policy "public read profiles"
  on public.profiles
  for select
  using (true);

-- Only the owner can update/delete their own profile
create policy "owner can modify own profile"
  on public.profiles
  for update, delete
  using (auth.uid() = id);

-- ==== articles ==== 
-- Public can read only published articles
create policy "public read published articles"
  on public.articles
  for select
  using (status = 'published');

-- Authenticated users with role admin or redactor can create, update, delete
create policy "authors can modify articles"
  on public.articles
  for all
  using (auth.role() in ('admin', 'redactor'));

-- Optional: authors can edit only their own articles (extra safety)
create policy "author can edit own article"
  on public.articles
  for update, delete
  using (
    auth.role() in ('admin', 'redactor')
    and author_id = (select id from public.profiles where id = auth.uid())
  );

-----------------------------------------------------------------
-- 5️⃣  Helper: reset default deny (optional)
-----------------------------------------------------------------
reset all;
