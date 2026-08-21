import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import BudgetManager, { type BudgetRow } from "@/components/BudgetManager";
import CategoryManager from "@/components/CategoryManager";
import SeedCategoriesButton from "@/components/SeedCategoriesButton";
import { firstDayOfMonth, lastDayOfMonth, monthLabel } from "@/lib/utils";
import type { Category, Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const supabase = createClient();

  const [{ data: categories }, { data: monthTx }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("transactions")
      .select("*")
      .eq("type", "expense")
      .gte("date", firstDayOfMonth())
      .lte("date", lastDayOfMonth()),
  ]);

  const cats = (categories ?? []) as Category[];
  const txs = (monthTx ?? []) as Transaction[];

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
    .map((c) => ({ category: c, spent: spentByCategory.get(c.id) ?? 0 }))
    .sort((a, b) => b.spent - a.spent);

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
