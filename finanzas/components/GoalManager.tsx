"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check, Target } from "lucide-react";
import Modal from "./Modal";
import { createGoal, addToGoal, deleteGoal } from "@/app/(app)/goals/actions";
import { formatCurrency, formatDate, PALETTE, classNames } from "@/lib/utils";
import type { Goal } from "@/lib/types";

export default function GoalManager({ goals }: { goals: Goal[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(PALETTE[1]);
  const [error, setError] = useState<string | null>(null);
  const [aporteId, setAporteId] = useState<string | null>(null);
  const [aporteValue, setAporteValue] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    setError(null);
    formData.set("color", color);
    startTransition(async () => {
      const res = await createGoal(formData);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo guardar.");
      }
    });
  }

  function handleAporte(id: string) {
    const amount = Number(aporteValue);
    if (!amount) return;
    startTransition(async () => {
      await addToGoal(id, amount);
      setAporteId(null);
      setAporteValue("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteGoal(id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={18} />
          Nueva meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-10 text-center text-sm text-gray-500">
          <Target className="text-gray-300" size={28} />
          Aún no tienes metas de ahorro. Crea una para empezar a juntar.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const pct = Math.min(
              100,
              Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)
            );
            const done = Number(g.current_amount) >= Number(g.target_amount);
            return (
              <div key={g.id} className="card">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: g.color }}
                    />
                    <span className="font-medium text-gray-900">{g.name}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="rounded-lg p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <p className="mb-2 text-sm text-gray-500">
                  {formatCurrency(Number(g.current_amount))}{" "}
                  <span className="text-gray-400">
                    de {formatCurrency(Number(g.target_amount))}
                  </span>
                </p>

                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={classNames(
                      "h-full rounded-full",
                      done ? "bg-brand-500" : ""
                    )}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: done ? undefined : g.color,
                    }}
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
                  <span>{pct}%</span>
                  {g.target_date && <span>Meta: {formatDate(g.target_date)}</span>}
                </div>

                {aporteId === g.id ? (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      value={aporteValue}
                      onChange={(e) => setAporteValue(e.target.value)}
                      className="input py-1.5"
                      placeholder="Monto a aportar"
                      autoFocus
                    />
                    <button
                      onClick={() => handleAporte(g.id)}
                      disabled={pending}
                      className="rounded-lg bg-brand-600 p-2 text-white hover:bg-brand-700"
                      aria-label="Confirmar aporte"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAporteId(g.id);
                      setAporteValue("");
                    }}
                    className="btn-ghost mt-3 w-full border border-gray-200"
                  >
                    <Plus size={16} />
                    Aportar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva meta de ahorro">
        <form action={handleCreate} className="space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input
              name="name"
              type="text"
              required
              autoFocus
              className="input"
              placeholder="Ej: Vacaciones, Fondo de emergencia"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Meta ($)</label>
              <input
                name="target_amount"
                type="number"
                min="1"
                required
                className="input"
                placeholder="1000000"
              />
            </div>
            <div>
              <label className="label">Ya tengo ($)</label>
              <input
                name="current_amount"
                type="number"
                min="0"
                className="input"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="label">Fecha objetivo (opcional)</label>
            <input name="target_date" type="date" className="input" />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={classNames(
                    "h-8 w-8 rounded-full border-2",
                    color === c ? "border-gray-900" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? "Guardando…" : "Crear meta"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
