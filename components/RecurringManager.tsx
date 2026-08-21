"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, RotateCw, Repeat } from "lucide-react";
import Modal from "./Modal";
import {
  createRecurring,
  applyRecurring,
  deleteRecurring,
} from "@/app/(app)/goals/actions";
import { formatCurrency, formatDate, today, classNames } from "@/lib/utils";
import type { Category, RecurringTransaction, TxType } from "@/lib/types";

const FREQ_LABEL: Record<string, string> = {
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

export default function RecurringManager({
  items,
  categories,
}: {
  items: RecurringTransaction[];
  categories: Category[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TxType>("expense");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = categories.filter((c) => c.type === type);

  function handleCreate(formData: FormData) {
    setError(null);
    formData.set("type", type);
    startTransition(async () => {
      const res = await createRecurring(formData);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo guardar.");
      }
    });
  }

  function handleApply(id: string) {
    startTransition(async () => {
      await applyRecurring(id);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteRecurring(id);
      router.refresh();
    });
  }

  const todayStr = today();

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button className="btn-ghost" onClick={() => setOpen(true)}>
          <Plus size={18} />
          Nuevo recurrente
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-8 text-center text-sm text-gray-500">
          <Repeat className="text-gray-300" size={26} />
          Registra movimientos que se repiten, como tu sueldo o suscripciones.
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 p-0">
          {items.map((r) => {
            const income = r.type === "income";
            const due = r.next_date <= todayStr;
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={classNames(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    income
                      ? "bg-brand-50 text-brand-600"
                      : "bg-red-50 text-red-500"
                  )}
                >
                  <Repeat size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {r.description || r.category?.name || "Movimiento"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {FREQ_LABEL[r.frequency]} · próximo {formatDate(r.next_date)}
                    {due && (
                      <span className="ml-1 font-medium text-amber-600">
                        · pendiente
                      </span>
                    )}
                  </p>
                </div>
                <span
                  className={classNames(
                    "shrink-0 text-sm font-semibold",
                    income ? "text-brand-600" : "text-gray-900"
                  )}
                >
                  {income ? "+" : "−"}
                  {formatCurrency(Number(r.amount))}
                </span>
                <button
                  onClick={() => handleApply(r.id)}
                  disabled={pending}
                  title="Registrar ahora y avanzar la fecha"
                  className={classNames(
                    "rounded-lg p-1.5",
                    due
                      ? "text-brand-600 hover:bg-brand-50"
                      : "text-gray-300 hover:bg-gray-100 hover:text-gray-600"
                  )}
                  aria-label="Aplicar"
                >
                  <RotateCw size={16} />
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                  aria-label="Eliminar"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo movimiento recurrente"
      >
        <form action={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={classNames(
                "rounded-lg py-2 text-sm font-medium",
                type === "expense"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-gray-500"
              )}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={classNames(
                "rounded-lg py-2 text-sm font-medium",
                type === "income"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-gray-500"
              )}
            >
              Ingreso
            </button>
          </div>

          <div>
            <label className="label">Monto</label>
            <input
              name="amount"
              type="number"
              min="0"
              required
              autoFocus
              className="input"
              placeholder="0"
            />
          </div>

          <div>
            <label className="label">Descripción</label>
            <input
              name="description"
              type="text"
              className="input"
              placeholder="Ej: Sueldo, Netflix, Gimnasio"
            />
          </div>

          <div>
            <label className="label">Categoría</label>
            <select name="category_id" className="input" defaultValue="">
              <option value="">Sin categoría</option>
              {filtered.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Frecuencia</label>
              <select name="frequency" className="input" defaultValue="monthly">
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
            <div>
              <label className="label">Próxima fecha</label>
              <input
                name="next_date"
                type="date"
                required
                defaultValue={today()}
                className="input"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
