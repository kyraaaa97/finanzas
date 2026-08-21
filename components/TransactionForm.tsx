"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Modal from "./Modal";
import { createTransaction } from "@/app/(app)/transactions/actions";
import { today } from "@/lib/utils";
import type { Category, TxType } from "@/lib/types";

export default function TransactionForm({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TxType>("expense");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = categories.filter((c) => c.type === type);

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("type", type);
    startTransition(async () => {
      const res = await createTransaction(formData);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo guardar.");
      }
    });
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={18} />
        Nuevo movimiento
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo movimiento">
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                type === "expense"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                type === "income"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-gray-500"
              }`}
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
              step="1"
              required
              autoFocus
              className="input"
              placeholder="0"
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

          <div>
            <label className="label">Descripción (opcional)</label>
            <input
              name="description"
              type="text"
              className="input"
              placeholder="Ej: Almuerzo con amigos"
            />
          </div>

          <div>
            <label className="label">Fecha</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={today()}
              className="input"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? "Guardando…" : "Guardar movimiento"}
          </button>
        </form>
      </Modal>
    </>
  );
}
