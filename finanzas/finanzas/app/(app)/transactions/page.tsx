import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import { formatCurrency } from "@/lib/utils";
import type { Category, Transaction } from "@/lib/types";

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
function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export default async function TransactionsPage({
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

  const [{ data: categories }, { data: transactions }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .gte("date", first)
      .lte("date", last)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const cats = (categories ?? []) as Category[];
  const txs = (transactions ?? []) as Transaction[];

  const income = txs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const expense = txs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const prev = shiftMonth(ym, -1);
  const next = shiftMonth(ym, 1);

  return (
    <div>
      <PageHeader
        title="Movimientos"
        subtitle="Tus ingresos y gastos, mes a mes."
        action={<TransactionForm categories={cats} />}
      />

      <div className="card mb-4 flex items-center justify-between">
        <Link
          href={`/transactions?mes=${prev}`}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="text-center">
          <p className="text-sm font-semibold capitalize text-gray-900">
            {monthLabel(ym)}
          </p>
          {ym !== currentYm && (
            <Link
              href="/transactions"
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Ver mes actual
            </Link>
          )}
        </div>
        <Link
          href={`/transactions?mes=${next}`}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={20} />
        </Link>
      </div>

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
