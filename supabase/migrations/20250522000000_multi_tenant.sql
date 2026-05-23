-- Multi-tenant: each jewellery business is isolated

create table if not exists public.businesses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  business_type text not null default 'wholesaler'
    check (business_type in ('wholesaler', 'retailer', 'manufacturer')),
  city text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

create index if not exists profiles_business_idx on public.profiles (business_id);

alter table public.transactions add column if not exists business_id uuid references public.businesses (id);
alter table public.makers add column if not exists business_id uuid references public.businesses (id);
alter table public.maker_orders add column if not exists business_id uuid references public.businesses (id);

create index if not exists transactions_business_idx on public.transactions (business_id);
create index if not exists makers_business_idx on public.makers (business_id);
create index if not exists maker_orders_business_idx on public.maker_orders (business_id);

-- Drop permissive anon policies from MVP
drop policy if exists "Allow anon read transactions" on public.transactions;
drop policy if exists "Allow anon insert transactions" on public.transactions;
drop policy if exists "Allow anon read makers" on public.makers;
drop policy if exists "Allow anon insert makers" on public.makers;
drop policy if exists "Allow anon update makers" on public.makers;
drop policy if exists "Allow anon read maker_orders" on public.maker_orders;
drop policy if exists "Allow anon insert maker_orders" on public.maker_orders;
drop policy if exists "Allow anon update maker_orders" on public.maker_orders;

create or replace function public.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id from public.profiles where id = auth.uid() limit 1;
$$;

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;

create policy "Users read own business"
  on public.businesses for select
  to authenticated
  using (id = public.current_business_id());

create policy "Owners update own business"
  on public.businesses for update
  to authenticated
  using (id = public.current_business_id());

create policy "Users read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Users insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "Users read business profiles"
  on public.profiles for select
  to authenticated
  using (business_id = public.current_business_id());

create policy "transactions_tenant_select"
  on public.transactions for select to authenticated
  using (business_id = public.current_business_id());

create policy "transactions_tenant_insert"
  on public.transactions for insert to authenticated
  with check (business_id = public.current_business_id());

create policy "makers_tenant_select"
  on public.makers for select to authenticated
  using (business_id = public.current_business_id());

create policy "makers_tenant_insert"
  on public.makers for insert to authenticated
  with check (business_id = public.current_business_id());

create policy "makers_tenant_update"
  on public.makers for update to authenticated
  using (business_id = public.current_business_id());

create policy "maker_orders_tenant_select"
  on public.maker_orders for select to authenticated
  using (business_id = public.current_business_id());

create policy "maker_orders_tenant_insert"
  on public.maker_orders for insert to authenticated
  with check (business_id = public.current_business_id());

create policy "maker_orders_tenant_update"
  on public.maker_orders for update to authenticated
  using (business_id = public.current_business_id());

-- Signup: authenticated user can create a business (once)
create policy "Authenticated insert business"
  on public.businesses for insert
  to authenticated
  with check (true);
