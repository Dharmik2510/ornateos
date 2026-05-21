-- Makers (karigars / workshops)
create table if not exists public.makers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists makers_name_lower_idx
  on public.makers (lower(trim(name)));

-- Orders placed with makers
create table if not exists public.maker_orders (
  id uuid primary key default uuid_generate_v4(),
  maker_id uuid not null references public.makers (id) on delete restrict,
  item_category text not null,
  weight_ordered numeric not null check (weight_ordered > 0),
  unit text not null check (unit in ('gram', 'kilo')),
  status text not null default 'pending'
    check (status in ('pending', 'received', 'cancelled')),
  ordered_at date not null default current_date,
  promised_at date,
  received_at timestamptz,
  weight_received numeric,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists maker_orders_status_idx
  on public.maker_orders (status, ordered_at desc);

create index if not exists maker_orders_maker_idx
  on public.maker_orders (maker_id);

alter table public.makers enable row level security;
alter table public.maker_orders enable row level security;

create policy "Allow anon read makers"
  on public.makers for select to anon, authenticated using (true);
create policy "Allow anon insert makers"
  on public.makers for insert to anon, authenticated with check (true);
create policy "Allow anon update makers"
  on public.makers for update to anon, authenticated using (true);

create policy "Allow anon read maker_orders"
  on public.maker_orders for select to anon, authenticated using (true);
create policy "Allow anon insert maker_orders"
  on public.maker_orders for insert to anon, authenticated with check (true);
create policy "Allow anon update maker_orders"
  on public.maker_orders for update to anon, authenticated using (true);
