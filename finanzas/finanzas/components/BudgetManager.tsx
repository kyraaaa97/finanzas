"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import {
  setBudget,
  addBudgetItem,
  deleteBudgetItem,
} from "@/app/(app)/budgets/actions";
import { formatCurrency, classNames } from "@/lib/utils";
import type { Category, BudgetItem } from "@/lib/types";

export interface BudgetRow {
  category: Category;
  spent: number;
  items: BudgetItem[];
}

export default function BudgetManager({ rows }: { rows: BudgetRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState<string>("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [itemName, setItemName] = useState("");
  const [itemAmount, setItemAmount] = useState("");
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

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addItem(categoryId: string) {
    const amount = Number(itemAmount);
    if (!itemName.trim() || !amount) return;
    startTransition(async () => {
      await addBudgetItem(categoryId, itemName, amount);
      setItemName("");
      setItemAmount("");
      router.refresh();
    });
  }

  function removeItem(id: string) {
    startTransition(async () => {
      await deleteBudgetItem(id);
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
        const isOpen = expanded.has(row.category.id);
        const itemsTotal = row.items.reduce((s, i) => s + Number(i.amount), 0);

        return (
          <div key={row.category.id} className="card">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: row.category.color }}
                />
                <span className="truncate text-sm font-medium text-gray-900">
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
                  className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm text-gray-500 hover:text-gray-800"
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

            {/* Desglose por sub-ítems */}
            <button
              onClick={() => toggle(row.category.id)}
              className="mt-3 flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
            >
              <span className="flex items-center gap-1">
                {isOpen ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
                Desglose{" "}
                {row.items.length > 0 && (
                  <span className="text-gray-400">({row.items.length})</span>
                )}
              </span>
              {itemsTotal > 0 && (
                <span className="text-gray-400">
                  suma {formatCurrency(itemsTotal)}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="mt-1 space-y-1.5 border-t border-gray-100 pt-2">
                {row.items.length === 0 && (
                  <p className="px-1 text-xs text-gray-400">
                    Sin detalle aún. Agrega conceptos abajo (ej: remedios,
                    consulta médica).
                  </p>
                )}

                {row.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-1 text-sm"
                  >
                    <span className="flex-1 text-gray-700">{item.name}</span>
                    <span className="text-gray-900">
                      {formatCurrency(Number(item.amount))}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="input flex-1 py-1.5 text-sm"
                    placeholder="Concepto (ej: remedios)"
                  />
                  <input
                    type="number"
                    min="0"
                    value={itemAmount}
                    onChange={(e) => setItemAmount(e.target.value)}
                    className="input w-28 py-1.5 text-sm"
                    placeholder="Monto"
                  />
                  <button
                    onClick={() => addItem(row.category.id)}
                    className="rounded-lg bg-brand-600 p-2 text-white hover:bg-brand-700"
                    aria-label="Agregar"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
