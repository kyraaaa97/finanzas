-- ============================================================
--  FINANZAS · Esquema de base de datos para Supabase
--  Copia TODO este archivo y pégalo en:
--  Supabase > SQL Editor > New query > Run
-- ============================================================

-- ---------- TABLA: categories ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null default '#2f8a58',
  monthly_budget numeric(14, 2),
  created_at timestamptz not null default now()
);

-- ---------- TABLA: transactions ----------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount >= 0),
  description text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------- TABLA: recurring_transactions ----------
create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount >= 0),
  description text,
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  next_date date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- TABLA: goals ----------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0,
  target_date date,
  color text not null default '#3b82f6',
  created_at timestamptz not null default now()
);

-- ---------- Índices para consultas rápidas ----------
create index if not exists idx_transactions_user_date
  on public.transactions (user_id, date desc);
create index if not exists idx_transactions_category
  on public.transactions (category_id);
create index if not exists idx_categories_user
  on public.categories (user_id);
create index if not exists idx_recurring_user
  on public.recurring_transactions (user_id);
create index if not exists idx_goals_user
  on public.goals (user_id);

-- ============================================================
--  ROW LEVEL SECURITY
--  Cada usuario solo puede ver y modificar SUS propios datos.
-- ============================================================

alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.goals enable row level security;

-- Políticas: categories
drop policy if exists "own categories - select" on public.categories;
create policy "own categories - select" on public.categories
  for select using (auth.uid() = user_id);
drop policy if exists "own categories - insert" on public.categories;
create policy "own categories - insert" on public.categories
  for insert with check (auth.uid() = user_id);
drop policy if exists "own categories - update" on public.categories;
create policy "own categories - update" on public.categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own categories - delete" on public.categories;
create policy "own categories - delete" on public.categories
  for delete using (auth.uid() = user_id);

-- Políticas: transactions
drop policy if exists "own transactions - select" on public.transactions;
create policy "own transactions - select" on public.transactions
  for select using (auth.uid() = user_id);
drop policy if exists "own transactions - insert" on public.transactions;
create policy "own transactions - insert" on public.transactions
  for insert with check (auth.uid() = user_id);
drop policy if exists "own transactions - update" on public.transactions;
create policy "own transactions - update" on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own transactions - delete" on public.transactions;
create policy "own transactions - delete" on public.transactions
  for delete using (auth.uid() = user_id);

-- Políticas: recurring_transactions
drop policy if exists "own recurring - select" on public.recurring_transactions;
create policy "own recurring - select" on public.recurring_transactions
  for select using (auth.uid() = user_id);
drop policy if exists "own recurring - insert" on public.recurring_transactions;
create policy "own recurring - insert" on public.recurring_transactions
  for insert with check (auth.uid() = user_id);
drop policy if exists "own recurring - update" on public.recurring_transactions;
create policy "own recurring - update" on public.recurring_transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own recurring - delete" on public.recurring_transactions;
create policy "own recurring - delete" on public.recurring_transactions
  for delete using (auth.uid() = user_id);

-- Políticas: goals
drop policy if exists "own goals - select" on public.goals;
create policy "own goals - select" on public.goals
  for select using (auth.uid() = user_id);
drop policy if exists "own goals - insert" on public.goals;
create policy "own goals - insert" on public.goals
  for insert with check (auth.uid() = user_id);
drop policy if exists "own goals - update" on public.goals;
create policy "own goals - update" on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own goals - delete" on public.goals;
create policy "own goals - delete" on public.goals
  for delete using (auth.uid() = user_id);

-- ============================================================
--  Categorías por defecto al registrarse un usuario nuevo.
--  Se crean automáticamente vía trigger sobre auth.users.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, type, color, monthly_budget) values
    (new.id, 'Sueldo',        'income',  '#2f8a58', null),
    (new.id, 'Otros ingresos','income',  '#14b8a6', null),
    (new.id, 'Arriendo',      'expense', '#ef4444', null),
    (new.id, 'Supermercado',  'expense', '#f59e0b', null),
    (new.id, 'Comida y salidas','expense','#f97316', null),
    (new.id, 'Transporte',    'expense', '#3b82f6', null),
    (new.id, 'Servicios',     'expense', '#8b5cf6', null),
    (new.id, 'Entretención',  'expense', '#ec4899', null),
    (new.id, 'Salud',         'expense', '#6366f1', null),
    (new.id, 'Otros gastos',  'expense', '#84cc16', null);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  FIN DEL ESQUEMA
-- ============================================================
