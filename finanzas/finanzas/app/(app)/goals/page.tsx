import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import GoalManager from "@/components/GoalManager";
import RecurringManager from "@/components/RecurringManager";
import type { Category, Goal, RecurringTransaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const supabase = createClient();

  const [{ data: goals }, { data: recurring }, { data: categories }] =
    await Promise.all([
      supabase.from("goals").select("*").order("created_at", { ascending: false }),
      supabase
        .from("recurring_transactions")
        .select("*, category:categories(*)")
        .order("next_date", { ascending: true }),
      supabase.from("categories").select("*").order("name"),
    ]);

  const goalList = (goals ?? []) as Goal[];
  const recurringList = (recurring ?? []) as RecurringTransaction[];
  const cats = (categories ?? []) as Category[];

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Metas de ahorro"
          subtitle="Define cuánto quieres juntar y sigue tu avance."
        />
        <GoalManager goals={goalList} />
      </div>

      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          Movimientos recurrentes
        </h2>
        <p className="mb-1 text-sm text-gray-500">
          Ingresos y gastos que se repiten (sueldo, arriendo, suscripciones).
          Usa el botón de registrar para dejar el movimiento en tus finanzas.
        </p>
        <RecurringManager items={recurringList} categories={cats} />
      </div>
    </div>
  );
}
