import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import BudgetManager, { type BudgetRow } from "@/components/BudgetManager";
import CategoryManager from "@/components/CategoryManager";
import SeedCategoriesButton from "@/components/SeedCategoriesButton";
import {
  firstDayOfMonth,
  lastDayOfMonth,
  monthLabel,
  formatCurrency,
} from "@/lib/utils";
import type { Category, Transaction, BudgetItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const supabase = createClient();

  const [{ data: categories }, { data: monthTx }, { data: budgetItems }] =
    await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase
        .from("transactions")
        .select("*")
        .eq("type", "expense")
        .gte("date", firstDayOfMonth())
        .lte("date", lastDayOfMonth()),
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
          subtitle={`Límites de gasto de ${monthLabel()}.`}
        />

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
