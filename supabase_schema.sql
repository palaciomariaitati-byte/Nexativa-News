/* supabase_schema.sql */

-- #########################################################
--  Supabase Schema for Nexativa News (Phase 1: E-commerce, Streaming, Accounting)
-- #########################################################

-----------------------------------------------------------------
-- 1️⃣ Roles y Personal (Sustituye a Supabase Auth)
-----------------------------------------------------------------
create table if not exists public.staff_passwords (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamp with time zone default now(),
  password    text unique not null,
  role        text not null check (role in ('admin', 'operator', 'redactor')),
  name        text not null
);

-- Insertar clave maestra por defecto (Si falla por unique, es ignorada)
insert into public.staff_passwords (password, role, name) 
values ('Almamia08.', 'admin', 'Administrador Principal')
on conflict (password) do nothing;

-- Función segura para verificar la clave desde Next.js
create or replace function verify_staff_password(p_password text)
returns text
language plpgsql
security definer
as $$
declare
  v_role text;
begin
  select role into v_role from public.staff_passwords where password = p_password;
  return v_role;
end;
$$;

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
  banner_url    text,
  website_url   text,
  instagram_url text,
  is_pro        boolean default true,
  created_at    timestamp with time zone default now()
);

-----------------------------------------------------------------
-- 3.5️⃣ Sponsor Analytics (Estadísticas de Clics)
-----------------------------------------------------------------
create table if not exists public.sponsor_clicks (
  id            uuid primary key default gen_random_uuid(),
  sponsor_id    uuid references public.sponsors(id) on delete cascade,
  click_type    text not null, -- 'website' or 'instagram'
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

-- Para asegurar que Supabase no bloquee nada, en lugar de desactivar RLS, 
-- crearemos políticas que permitan el acceso total (ya que la seguridad la maneja Next.js)
alter table public.articles enable row level security;
alter table public.products enable row level security;
alter table public.sponsors enable row level security;
alter table public.video_queue enable row level security;
alter table public.accounting_movements enable row level security;
alter table public.sponsor_clicks enable row level security;

-- Borramos políticas viejas
drop policy if exists "public_read_articles" on public.articles;
drop policy if exists "public_read_products" on public.products;
drop policy if exists "public_read_sponsors" on public.sponsors;
drop policy if exists "public_read_video_queue" on public.video_queue;
drop policy if exists "staff_manage_content" on public.products;
drop policy if exists "allow_all_articles" on public.articles;
drop policy if exists "allow_all_products" on public.products;
drop policy if exists "allow_all_sponsors" on public.sponsors;
drop policy if exists "allow_all_video_queue" on public.video_queue;
drop policy if exists "allow_all_accounting" on public.accounting_movements;

-- Creamos políticas nuevas de acceso total
create policy "allow_all_articles" on public.articles for all using (true) with check (true);
create policy "allow_all_products" on public.products for all using (true) with check (true);
create policy "allow_all_sponsors" on public.sponsors for all using (true) with check (true);
create policy "allow_all_video_queue" on public.video_queue for all using (true) with check (true);
create policy "allow_all_accounting" on public.accounting_movements for all using (true) with check (true);
create policy "allow_all_sponsor_clicks" on public.sponsor_clicks for all using (true) with check (true);

-----------------------------------------------------------------
-- 9?? Storage: Bucket for Uploads
-----------------------------------------------------------------
-- Debes ejecutar esto en el SQL Editor para crear el bucket de im�genes
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true) on conflict do nothing;
create policy "public_uploads" on storage.objects for select using ( bucket_id = 'uploads' );
create policy "allow_uploads" on storage.objects for insert with check ( bucket_id = 'uploads' );
create policy "allow_update" on storage.objects for update using ( bucket_id = 'uploads' );
create policy "allow_delete" on storage.objects for delete using ( bucket_id = 'uploads' );

