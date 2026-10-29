import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import BudgetManager, { type BudgetRow } from "@/components/BudgetManager";
import CategoryManager from "@/components/CategoryManager";
import SeedCategoriesButton from "@/components/SeedCategoriesButton";
import { formatCurrency } from "@/lib/utils";
import type { Category, Transaction, BudgetItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function monthBounds(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const first = `${ym}-01`;
  const last = new Date(y, m, 0);
  const lastStr = `${ym}-${String(last.getDate()).padStart(2, "0")}`;
  return { first, last: lastStr };
}
function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabelYm(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams?: { mes?: string };
}) {
  const supabase = createClient();

  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
  const ym =
    searchParams?.mes && /^\d{4}-\d{2}$/.test(searchParams.mes)
      ? searchParams.mes
      : currentYm;
  const { first, last } = monthBounds(ym);

  const [{ data: categories }, { data: monthTx }, { data: budgetItems }] =
    await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase
        .from("transactions")
        .select("*")
        .eq("type", "expense")
        .gte("date", first)
        .lte("date", last),
      supabase
        .from("budget_items")
        .select("*")
        .order("created_at", { ascending: true }),
    ]);

  const cats = (categories ?? []) as Category[];
  const txs = (monthTx ?? []) as Transaction[];
  const items = (budgetItems ?? []) as BudgetItem[];

  const itemsByCategory = new Map<string, BudgetItem[]>();
  for (const it of items) {
    const list = itemsByCategory.get(it.category_id) ?? [];
    list.push(it);
    itemsByCategory.set(it.category_id, list);
  }

  const spentByCategory = new Map<string, number>();
  for (const t of txs) {
    if (!t.category_id) continue;
    spentByCategory.set(
      t.category_id,
      (spentByCategory.get(t.category_id) ?? 0) + Number(t.amount)
    );
  }

  const rows: BudgetRow[] = cats
    .filter((c) => c.type === "expense")
    .map((c) => ({
      category: c,
      spent: spentByCategory.get(c.id) ?? 0,
      items: itemsByCategory.get(c.id) ?? [],
    }))
    .sort((a, b) => b.spent - a.spent);

  // Totales del mes: presupuesto asignado, gastado y restante.
  const totalBudget = rows.reduce(
    (s, r) => s + Number(r.category.monthly_budget ?? 0),
    0
  );
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const prev = shiftMonth(ym, -1);
  const next = shiftMonth(ym, 1);

  if (cats.length === 0) {
    return (
      <div>
        <PageHeader
          title="Presupuestos"
          subtitle="Organiza tus gastos por categoría y ponles un límite mensual."
        />
        <div className="card flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-sm text-gray-500">
            Aún no tienes categorías. Empieza con un set sugerido y edítalo a tu
            gusto.
          </p>
          <SeedCategoriesButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Presupuestos"
          subtitle="Tus límites de gasto, mes a mes."
        />

        <div className="card mb-4 flex items-center justify-between">
          <Link
            href={`/budgets?mes=${prev}`}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="text-center">
            <p className="text-sm font-semibold capitalize text-gray-900">
              {monthLabelYm(ym)}
            </p>
            {ym !== currentYm && (
              <Link
                href="/budgets"
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Ver mes actual
              </Link>
            )}
          </div>
          <Link
            href={`/budgets?mes=${next}`}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={20} />
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="card p-3 sm:p-5">
            <p className="text-[11px] text-gray-500 sm:text-xs">
              Presupuesto total
            </p>
            <p className="mt-1 break-words text-sm font-bold leading-tight text-gray-900 sm:text-lg">
              {formatCurrency(totalBudget)}
            </p>
          </div>
          <div className="card p-3 sm:p-5">
            <p className="text-[11px] text-gray-500 sm:text-xs">Gastado</p>
            <p className="mt-1 break-words text-sm font-bold leading-tight text-red-500 sm:text-lg">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="card p-3 sm:p-5">
            <p className="text-[11px] text-gray-500 sm:text-xs">Disponible</p>
            <p
              className={`mt-1 break-words text-sm font-bold leading-tight sm:text-lg ${
                totalRemaining < 0 ? "text-red-500" : "text-brand-600"
              }`}
            >
              {formatCurrency(totalRemaining)}
            </p>
          </div>
        </div>

        <BudgetManager rows={rows} />
      </div>

      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          Tus categorías
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Crea, edita o elimina las categorías de ingresos y gastos.
        </p>
        <CategoryManager categories={cats} />
      </div>
    </div>
  );
}
