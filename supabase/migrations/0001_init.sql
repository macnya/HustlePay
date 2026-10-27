-- HustlePay initial schema
-- Run this in the Supabase SQL Editor (or `supabase db push`).

-- =============================================================
-- Tables
-- =============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text not null unique,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.chamas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  goal_amount numeric(14, 2) check (goal_amount is null or goal_amount >= 0),
  contribution_amount numeric(14, 2) not null check (contribution_amount > 0),
  contribution_frequency text not null check (contribution_frequency in ('daily', 'weekly', 'monthly')),
  admin_id uuid not null references public.profiles (id) on delete restrict,
  next_meeting timestamptz,
  total_collected numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.chama_members (
  id uuid primary key default gen_random_uuid(),
  chama_id uuid not null references public.chamas (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  phone text not null,
  joined_date date not null default current_date,
  total_contributed numeric(14, 2) not null default 0
);

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  chama_id uuid references public.chamas (id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  contributed_on date not null default current_date,
  description text not null,
  member_name text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue')),
  payment_method text not null default 'manual'
    check (payment_method in ('mpesa', 'cash', 'bank', 'manual')),
  mpesa_receipt text,
  checkout_request_id text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  chama_id uuid not null references public.chamas (id) on delete cascade,
  type text not null check (type in ('deposit', 'withdrawal', 'fee', 'payout', 'fine')),
  amount numeric(14, 2) not null check (amount > 0),
  description text not null default '',
  member text,
  status text not null default 'completed' check (status in ('completed', 'pending', 'failed')),
  method text not null default 'mpesa' check (method in ('mpesa', 'cash', 'bank')),
  transaction_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists chamas_admin_id_idx on public.chamas (admin_id);
create index if not exists chama_members_chama_id_idx on public.chama_members (chama_id);
create index if not exists chama_members_user_id_idx on public.chama_members (user_id);
create index if not exists contributions_user_id_idx on public.contributions (user_id);
create index if not exists contributions_chama_id_idx on public.contributions (chama_id);
create index if not exists contributions_checkout_request_id_idx on public.contributions (checkout_request_id);
create index if not exists transactions_chama_id_idx on public.transactions (chama_id);
create index if not exists transactions_transaction_date_idx on public.transactions (transaction_date desc);

-- =============================================================
-- Profile auto-creation on signup (phone OTP)
-- =============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, coalesce(new.phone, ''))
  on conflict (id) do update set phone = excluded.phone;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- Membership helpers (security definer: used inside RLS policies)
-- =============================================================

create or replace function public.is_chama_member(target_chama uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.chama_members
    where chama_id = target_chama and user_id = auth.uid()
  );
$$;

create or replace function public.is_chama_admin(target_chama uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.chamas
    where id = target_chama and admin_id = auth.uid()
  );
$$;

create or replace function public.shares_a_chama(other_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.chama_members me
    join public.chama_members them on them.chama_id = me.chama_id
    where me.user_id = auth.uid() and them.user_id = other_user
  );
$$;

-- =============================================================
-- Derived totals: chamas.total_collected & chama_members.total_contributed
-- =============================================================

create or replace function public.refresh_chama_totals(target_chama uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_chama is null then
    return;
  end if;

  update public.chamas c
  set total_collected = coalesce(
    (select sum(amount) from public.contributions
     where chama_id = target_chama and status = 'paid'),
    0
  )
  where c.id = target_chama;

  update public.chama_members cm
  set total_contributed = coalesce(
    (
      select sum(ct.amount)
      from public.contributions ct
      where ct.chama_id = cm.chama_id
        and ct.status = 'paid'
        and (
          (cm.user_id is not null and ct.user_id = cm.user_id)
          or (ct.member_name is not null and lower(ct.member_name) = lower(cm.name))
        )
    ),
    0
  )
  where cm.chama_id = target_chama;
end;
$$;

create or replace function public.on_contribution_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_chama_totals(coalesce(new.chama_id, old.chama_id));
  if new.chama_id is not null and old.chama_id is not null
     and new.chama_id is distinct from old.chama_id then
    perform public.refresh_chama_totals(old.chama_id);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists contributions_refresh_totals on public.contributions;
create trigger contributions_refresh_totals
  after insert or update or delete on public.contributions
  for each row execute function public.on_contribution_change();

-- =============================================================
-- Row Level Security
-- =============================================================

alter table public.profiles enable row level security;
alter table public.chamas enable row level security;
alter table public.chama_members enable row level security;
alter table public.contributions enable row level security;
alter table public.transactions enable row level security;

-- profiles: own profile, plus people who share a chama with me
drop policy if exists "profiles_select_own_or_shared" on public.profiles;
create policy "profiles_select_own_or_shared"
  on public.profiles for select
  using (
    id = auth.uid()
    or public.shares_a_chama(id)
  );

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- chamas: visible to members and the admin
drop policy if exists "chamas_select_member" on public.chamas;
create policy "chamas_select_member"
  on public.chamas for select
  using (admin_id = auth.uid() or public.is_chama_member(id));

drop policy if exists "chamas_insert_self_as_admin" on public.chamas;
create policy "chamas_insert_self_as_admin"
  on chamas for insert
  with check (admin_id = auth.uid());

drop policy if exists "chamas_update_admin" on public.chamas;
create policy "chamas_update_admin"
  on public.chamas for update
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());

drop policy if exists "chamas_delete_admin" on public.chamas;
create policy "chamas_delete_admin"
  on public.chamas for delete
  using (admin_id = auth.uid());

-- chama_members
drop policy if exists "chama_members_select" on public.chama_members;
create policy "chama_members_select"
  on public.chama_members for select
  using (user_id = auth.uid() or public.is_chama_member(chama_id));

drop policy if exists "chama_members_insert" on public.chama_members;
create policy "chama_members_insert"
  on public.chama_members for insert
  with check (
    (user_id is not null and user_id = auth.uid())
    or public.is_chama_admin(chama_id)
  );

drop policy if exists "chama_members_update" on public.chama_members;
create policy "chama_members_update"
  on public.chama_members for update
  using (public.is_chama_admin(chama_id) or user_id = auth.uid())
  with check (public.is_chama_admin(chama_id) or user_id = auth.uid());

drop policy if exists "chama_members_delete" on public.chama_members;
create policy "chama_members_delete"
  on public.chama_members for delete
  using (public.is_chama_admin(chama_id));

-- contributions: own, plus transparency inside shared chamas
drop policy if exists "contributions_select" on public.contributions;
create policy "contributions_select"
  on public.contributions for select
  using (
    user_id = auth.uid()
    or (chama_id is not null and public.is_chama_member(chama_id))
  );

drop policy if exists "contributions_insert_own" on public.contributions;
create policy "contributions_insert_own"
  on public.contributions for insert
  with check (user_id = auth.uid());

drop policy if exists "contributions_update_own" on public.contributions;
create policy "contributions_update_own"
  on public.contributions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "contributions_delete_own" on public.contributions;
create policy "contributions_delete_own"
  on public.contributions for delete
  using (user_id = auth.uid());

-- transactions: chama members and admins
drop policy if exists "transactions_select" on public.transactions;
create policy "transactions_select"
  on public.transactions for select
  using (public.is_chama_member(chama_id) or public.is_chama_admin(chama_id));

drop policy if exists "transactions_insert" on public.transactions;
create policy "transactions_insert"
  on public.transactions for insert
  with check (public.is_chama_member(chama_id) or public.is_chama_admin(chama_id));