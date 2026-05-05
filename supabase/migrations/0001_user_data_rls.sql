create table if not exists public.user_data (
  id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "user_data_select_own"
  on public.user_data for select
  using ((select auth.uid()) = id);

create policy "user_data_insert_own"
  on public.user_data for insert
  with check ((select auth.uid()) = id);

create policy "user_data_update_own"
  on public.user_data for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "user_data_delete_own"
  on public.user_data for delete
  using ((select auth.uid()) = id);

create index if not exists user_data_updated_at_idx on public.user_data(updated_at desc);
