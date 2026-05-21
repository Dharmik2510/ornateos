-- OrnateOS ledger schema
create extension if not exists "uuid-ossp";

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  status text not null check (status in ('pending', 'confirmed')),
  source text not null check (source in ('voice', 'image', 'text')),
  raw_input text not null,
  summary text not null,
  record jsonb not null,
  receipt_url text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_created_at_idx
  on public.transactions (created_at desc);

alter table public.transactions enable row level security;

create policy "Allow anon read transactions"
  on public.transactions for select
  to anon, authenticated
  using (true);

create policy "Allow anon insert transactions"
  on public.transactions for insert
  to anon, authenticated
  with check (true);
