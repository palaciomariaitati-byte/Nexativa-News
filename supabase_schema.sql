/* supabase_schema.sql */

-- #########################################################
--  Supabase Schema for Nexativa News (Phase 1: E-commerce, Streaming, Accounting)
-- #########################################################

-----------------------------------------------------------------
-- 1️⃣ Profiles & Roles
-----------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  updated_at  timestamp with time zone default now(),
  username    text,
  full_name   text,
  role        text not null default 'redactor' check (role in ('admin', 'operator', 'redactor'))
);

-----------------------------------------------------------------
-- 2️⃣ Articles (News)
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
-- 3️⃣ Sponsors (Clientes Pro / Patrocinadores)
-----------------------------------------------------------------
create table if not exists public.sponsors (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  logo_url      text,
  website_url   text,
  instagram_url text,
  is_pro        boolean default true,
  created_at    timestamp with time zone default now()
);

-----------------------------------------------------------------
-- 4️⃣ E-commerce: Products
-----------------------------------------------------------------
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  price         numeric(10,2) not null,
  stock         integer default 0,
  image_url     text,
  buy_url       text, -- Optional external link (like MercadoPago)
  created_at    timestamp with time zone default now(),
  updated_at    timestamp with time zone default now()
);

-----------------------------------------------------------------
-- 5️⃣ E-commerce: Orders & Items (Carrito y Checkout)
-----------------------------------------------------------------
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  customer_name   text not null,
  customer_email  text,
  customer_phone  text,
  payment_method  text not null, -- 'transfer', 'mercadopago', 'whatsapp'
  total_amount    numeric(10,2) not null,
  status          text not null default 'pending', -- 'pending', 'paid', 'shipped', 'cancelled'
  created_at      timestamp with time zone default now(),
  updated_at      timestamp with time zone default now()
);

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references public.orders(id) on delete cascade,
  product_id  uuid references public.products(id),
  quantity    integer not null,
  price_at    numeric(10,2) not null -- Price at the time of purchase
);

-----------------------------------------------------------------
-- 6️⃣ Streaming: Video Queue
-----------------------------------------------------------------
create table if not exists public.video_queue (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  video_url     text not null, -- Youtube, Twitch, or MP4 URL
  type          text not null default 'youtube', -- 'youtube', 'twitch', 'custom'
  status        text not null default 'queued', -- 'playing', 'queued', 'finished'
  position      integer not null default 0, -- order in queue
  created_at    timestamp with time zone default now()
);

-----------------------------------------------------------------
-- 7️⃣ Accounting: Movements (Private)
-----------------------------------------------------------------
create table if not exists public.accounting_movements (
  id            uuid primary key default gen_random_uuid(),
  type          text not null, -- 'income', 'expense'
  amount        numeric(10,2) not null,
  description   text not null,
  reference_id  uuid, -- Can link to order_id, sponsor payment, etc.
  created_by    uuid references public.profiles(id),
  created_at    timestamp with time zone default now()
);

-----------------------------------------------------------------
-- 8️⃣ Auto‑create profile Trigger
-----------------------------------------------------------------
create or replace function public.create_profile_on_auth_user()
returns trigger
language plpgsql
security definer
as $$
begin
  -- First user is admin, rest are redactors by default
  insert into public.profiles (id, username, role)
  values (
    new.id, 
    new.email, 
    case when (select count(*) from public.profiles) = 0 then 'admin' else 'redactor' end
  );
  return new;
end;
$$;

drop trigger if exists create_profile_trigger on auth.users;
create trigger create_profile_trigger
after insert on auth.users
for each row execute function public.create_profile_on_auth_user();

-----------------------------------------------------------------
-- 9️⃣ Row-Level Security (RLS) Policies
-----------------------------------------------------------------
-- Allow everyone to read public tables
alter table public.articles enable row level security;
alter table public.products enable row level security;
alter table public.sponsors enable row level security;
alter table public.video_queue enable row level security;

-- Accounting is strictly private (Only Admins)
alter table public.accounting_movements enable row level security;
create policy "admin_accounting_all" on public.accounting_movements
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Helper to disable restrictions for now while developing (optional, turn off in production)
-- For the sake of this setup, we will allow read access to public tables
create policy "public_read_articles" on public.articles for select using (status = 'published');
create policy "public_read_products" on public.products for select using (true);
create policy "public_read_sponsors" on public.sponsors for select using (true);
create policy "public_read_video_queue" on public.video_queue for select using (true);

-- Admins and Operators can do anything to products, videos, sponsors
create policy "staff_manage_content" on public.products for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator'))
);
