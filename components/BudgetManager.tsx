"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil } from "lucide-react";
import { setBudget } from "@/app/(app)/budgets/actions";
import { formatCurrency, classNames } from "@/lib/utils";
import type { Category } from "@/lib/types";

export interface BudgetRow {
  category: Category;
  spent: number;
}

export default function BudgetManager({ rows }: { rows: BudgetRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState<string>("");
  const [, startTransition] = useTransition();

  function startEdit(row: BudgetRow) {
    setEditing(row.category.id);
    setValue(row.category.monthly_budget?.toString() ?? "");
  }

  function save(id: string) {
    const amount = value ? Number(value) : null;
    startTransition(async () => {
      await setBudget(id, amount);
      setEditing(null);
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="card text-center text-sm text-gray-500">
        Crea categorías de gasto para asignarles un presupuesto mensual.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const budget = row.category.monthly_budget ?? 0;
        const hasBudget = budget > 0;
        const pct = hasBudget
          ? Math.min(100, Math.round((row.spent / budget) * 100))
          : 0;
        const over = hasBudget && row.spent > budget;

        return (
          <div key={row.category.id} className="card">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: row.category.color }}
                />
                <span className="text-sm font-medium text-gray-900">
                  {row.category.name}
                </span>
              </div>

              {editing === row.category.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="input w-32 py-1"
                    placeholder="Sin límite"
                    autoFocus
                  />
                  <button
                    onClick={() => save(row.category.id)}
                    className="rounded-lg bg-brand-600 p-1.5 text-white hover:bg-brand-700"
                    aria-label="Guardar"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEdit(row)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
                >
                  {hasBudget ? formatCurrency(budget) : "Poner límite"}
                  <Pencil size={14} />
                </button>
              )}
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={classNames(
                  "h-full rounded-full transition-all",
                  over ? "bg-red-500" : "bg-brand-500"
                )}
                style={{ width: `${hasBudget ? pct : 0}%` }}
              />
            </div>

            <div className="mt-1.5 flex justify-between text-xs">
              <span className={over ? "text-red-500" : "text-gray-500"}>
                Gastado {formatCurrency(row.spent)}
              </span>
              {hasBudget && (
                <span className="text-gray-400">
                  {over
                    ? `Excedido ${formatCurrency(row.spent - budget)}`
                    : `Quedan ${formatCurrency(budget - row.spent)}`}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
