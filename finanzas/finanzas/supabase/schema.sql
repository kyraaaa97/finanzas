-- ============================================================
--  FINANZAS · Esquema de base de datos (modo: acceso compartido)
--  Datos compartidos (una sola base común) + acceso solo desde el
--  servidor con la clave secreta. La app se protege con contraseña.
--
--  Pégalo en: Supabase > SQL Editor > New query > Run
--  (Puedes correrlo aunque ya tuvieras tablas: primero las reinicia.)
-- ============================================================

-- ---------- Reinicio (borra versiones anteriores) ----------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.transactions cascade;
drop table if exists public.recurring_transactions cascade;
drop table if exists public.goals cascade;
drop table if exists public.categories cascade;

-- ---------- TABLA: categories ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null default '#2f8a58',
  monthly_budget numeric(14, 2),
  created_at timestamptz not null default now()
);

-- ---------- TABLA: transactions ----------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount >= 0),
  description text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------- TABLA: recurring_transactions ----------
create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
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
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0,
  target_date date,
  color text not null default '#3b82f6',
  created_at timestamptz not null default now()
);

-- ---------- TABLA: budget_items (desglose por categoría) ----------
create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

-- ---------- Índices ----------
create index idx_budget_items_category on public.budget_items (category_id);
create index idx_transactions_date on public.transactions (date desc);
create index idx_transactions_category on public.transactions (category_id);
create index idx_recurring_next on public.recurring_transactions (next_date);

-- ============================================================
--  SEGURIDAD
--  Activamos RLS y NO creamos políticas para el rol público (anon).
--  Resultado: la clave pública NO puede leer ni escribir directamente.
--  Todo el acceso ocurre desde el servidor con la clave secreta
--  (service role), que ignora RLS. La app se protege con contraseña.
-- ============================================================
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.goals enable row level security;
alter table public.budget_items enable row level security;

-- ============================================================
--  Categorías por defecto (compartidas)
-- ============================================================
insert into public.categories (name, type, color) values
  ('Sueldo',           'income',  '#2f8a58'),
  ('Otros ingresos',   'income',  '#14b8a6'),
  ('Arriendo',         'expense', '#ef4444'),
  ('Supermercado',     'expense', '#f59e0b'),
  ('Comida y salidas', 'expense', '#f97316'),
  ('Transporte',       'expense', '#3b82f6'),
  ('Servicios',        'expense', '#8b5cf6'),
  ('Entretención',     'expense', '#ec4899'),
  ('Salud',            'expense', '#6366f1'),
  ('Otros gastos',     'expense', '#84cc16');

-- ============================================================
--  FIN DEL ESQUEMA
-- ============================================================
