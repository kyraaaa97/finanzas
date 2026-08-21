"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { deleteTransaction } from "@/app/(app)/transactions/actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

export default function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    setPendingId(id);
    startTransition(async () => {
      await deleteTransaction(id);
      setPendingId(null);
      router.refresh();
    });
  }

  if (transactions.length === 0) {
    return (
      <div className="card text-center text-sm text-gray-500">
        Aún no hay movimientos. Agrega tu primer ingreso o gasto con el botón
        “Nuevo movimiento”.
      </div>
    );
  }

  return (
    <div className="card divide-y divide-gray-100 p-0">
      {transactions.map((t) => {
        const income = t.type === "income";
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl hover:bg-gray-50"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                income ? "bg-brand-50 text-brand-600" : "bg-red-50 text-red-500"
              }`}
            >
              {income ? (
                <ArrowUpRight size={18} />
              ) : (
                <ArrowDownLeft size={18} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {t.description || t.category?.name || "Movimiento"}
              </p>
              <p className="text-xs text-gray-400">
                {t.category?.name ? `${t.category.name} · ` : ""}
                {formatDate(t.date)}
              </p>
            </div>

            <span
              className={`shrink-0 text-sm font-semibold ${
                income ? "text-brand-600" : "text-gray-900"
              }`}
            >
              {income ? "+" : "−"}
              {formatCurrency(t.amount)}
            </span>

            <button
              onClick={() => handleDelete(t.id)}
              disabled={pendingId === t.id}
              className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
              aria-label="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
