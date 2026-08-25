import Link from "next/link";
import { TrendingUp, TrendingDown, Wallet, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import TransactionList from "@/components/TransactionList";
import {
  IncomeExpenseChart,
  CategoryPie,
  type MonthlyPoint,
  type CategorySlice,
} from "@/components/DashboardCharts";
import {
  formatCurrency,
  monthLabel,
  firstDayOfMonth,
  lastDayOfMonth,
} from "@/lib/utils";
import type { Category, Transaction, Goal } from "@/lib/types";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "green" | "red" | "blue" | "gray";
}) {
  const tones: Record<string, string> = {
    green: "bg-brand-50 text-brand-600",
    red: "bg-red-50 text-red-500",
    blue: "bg-blue-50 text-blue-500",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <div className="card p-3 sm:p-5">
      <div className="flex items-center justify-between gap-1">
        <p className="min-w-0 truncate text-[11px] text-gray-500 sm:text-xs">
          {label}
        </p>
        <span className={`shrink-0 rounded-lg p-1.5 ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-2 break-words text-base font-bold leading-tight text-gray-900 sm:text-xl">
        {value}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = createClient();

  // Ventana de 6 meses (incluye el mes actual).
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    .toISOString()
    .slice(0, 10);

  const [{ data: categories }, { data: sixMonthTx }, { data: recent }, { data: goals }] =
    await Promise.all([
      supabase.from("categories").select("*"),
      supabase
        .from("transactions")
        .select("*")
        .gte("date", windowStart),
      supabase
        .from("transactions")
        .select("*, category:categories(*)")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6),
      supabase.from("goals").select("*"),
    ]);

  const cats = (categories ?? []) as Category[];
  const allTx = (sixMonthTx ?? []) as Transaction[];
  const recentTx = (recent ?? []) as Transaction[];
  const goalList = (goals ?? []) as Goal[];

  // Serie mensual (últimos 6 meses).
  const monthly: MonthlyPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const label = new Intl.DateTimeFormat("es-CL", { month: "short" }).format(d);
    const inMonth = allTx.filter((t) => {
      const td = new Date(t.date + "T00:00:00");
      return td.getFullYear() === y && td.getMonth() === m;
    });
    monthly.push({
      label,
      Ingresos: inMonth
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + Number(t.amount), 0),
      Gastos: inMonth
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + Number(t.amount), 0),
    });
  }

  // Totales del mes actual.
  const monthStart = firstDayOfMonth();
  const monthEnd = lastDayOfMonth();
  const monthTx = allTx.filter((t) => t.date >= monthStart && t.date <= monthEnd);
  const income = monthTx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const expense = monthTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  // Gasto por categoría (mes actual).
  const catMap = new Map<string, CategorySlice>();
  for (const t of monthTx) {
    if (t.type !== "expense") continue;
    const cat = cats.find((c) => c.id === t.category_id);
    const key = cat?.id ?? "none";
    const existing = catMap.get(key);
    if (existing) {
      existing.value += Number(t.amount);
    } else {
      catMap.set(key, {
        name: cat?.name ?? "Sin categoría",
        color: cat?.color ?? "#cbd5e1",
        value: Number(t.amount),
      });
    }
  }
  const byCategory = Array.from(catMap.values()).sort(
    (a, b) => b.value - a.value
  );

  const totalSaved = goalList.reduce((s, g) => s + Number(g.current_amount), 0);

  return (
    <div>
      <PageHeader
        title="Resumen"
        subtitle={`Tu situación de ${monthLabel()}.`}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Ingresos del mes"
          value={formatCurrency(income)}
          icon={<TrendingUp size={16} />}
          tone="green"
        />
        <StatCard
          label="Gastos del mes"
          value={formatCurrency(expense)}
          icon={<TrendingDown size={16} />}
          tone="red"
        />
        <StatCard
          label="Balance del mes"
          value={formatCurrency(income - expense)}
          icon={<Wallet size={16} />}
          tone="blue"
        />
        <StatCard
          label="Ahorrado en metas"
          value={formatCurrency(totalSaved)}
          icon={<Target size={16} />}
          tone="gray"
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Ingresos vs gastos (6 meses)
          </h3>
          <IncomeExpenseChart data={monthly} />
        </div>
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Gastos por categoría (este mes)
          </h3>
          <CategoryPie data={byCategory} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Movimientos recientes
        </h3>
        <Link
          href="/transactions"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Ver todos
        </Link>
      </div>
      <div className="mt-3">
        <TransactionList transactions={recentTx} />
      </div>
    </div>
  );
}
