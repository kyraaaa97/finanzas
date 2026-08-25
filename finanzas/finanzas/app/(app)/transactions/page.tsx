import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import { formatCurrency } from "@/lib/utils";
import type { Category, Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const supabase = createClient();

  const [{ data: categories }, { data: transactions }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const cats = (categories ?? []) as Category[];
  const txs = (transactions ?? []) as Transaction[];

  const income = txs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const expense = txs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div>
      <PageHeader
        title="Movimientos"
        subtitle="Registra y revisa tus ingresos y gastos."
        action={<TransactionForm categories={cats} />}
      />

      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="card p-3 sm:p-5">
          <p className="text-[11px] text-gray-500 sm:text-xs">Ingresos</p>
          <p className="mt-1 break-words text-sm font-bold leading-tight text-brand-600 sm:text-lg">
            {formatCurrency(income)}
          </p>
        </div>
        <div className="card p-3 sm:p-5">
          <p className="text-[11px] text-gray-500 sm:text-xs">Gastos</p>
          <p className="mt-1 break-words text-sm font-bold leading-tight text-red-500 sm:text-lg">
            {formatCurrency(expense)}
          </p>
        </div>
        <div className="card p-3 sm:p-5">
          <p className="text-[11px] text-gray-500 sm:text-xs">Balance</p>
          <p className="mt-1 break-words text-sm font-bold leading-tight text-gray-900 sm:text-lg">
            {formatCurrency(income - expense)}
          </p>
        </div>
      </div>

      <TransactionList transactions={txs} />
    </div>
  );
}
