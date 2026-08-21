"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil } from "lucide-react";
import Modal from "./Modal";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/(app)/budgets/actions";
import { PALETTE, classNames } from "@/lib/utils";
import type { Category, TxType } from "@/lib/types";

export default function CategoryManager({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [type, setType] = useState<TxType>("expense");
  const [color, setColor] = useState<string>(PALETTE[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setEditing(null);
    setType("expense");
    setColor(PALETTE[0]);
    setError(null);
    setOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setType(cat.type);
    setColor(cat.color);
    setError(null);
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("type", type);
    formData.set("color", color);
    startTransition(async () => {
      const res = editing
        ? await updateCategory(editing.id, formData)
        : await createCategory(formData);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo guardar.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteCategory(id);
      router.refresh();
    });
  }

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  function Group({ title, items }: { title: string; items: Category[] }) {
    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          {title}
        </p>
        <div className="card divide-y divide-gray-100 p-0">
          {items.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">
              Sin categorías todavía.
            </p>
          )}
          {items.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="flex-1 text-sm text-gray-900">{c.name}</span>
              <button
                onClick={() => openEdit(c)}
                className="rounded-lg p-1.5 text-gray-300 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Editar"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                aria-label="Eliminar"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button className="btn-ghost" onClick={openNew}>
          <Plus size={18} />
          Nueva categoría
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Group title="Ingresos" items={income} />
        <Group title="Gastos" items={expense} />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar categoría" : "Nueva categoría"}
      >
        <form action={handleSubmit} className="space-y-4">
          {!editing && (
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
          )}

          <div>
            <label className="label">Nombre</label>
            <input
              name="name"
              type="text"
              required
              autoFocus
              defaultValue={editing?.name ?? ""}
              className="input"
              placeholder="Ej: Supermercado"
            />
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

          {type === "expense" && (
            <div>
              <label className="label">Presupuesto mensual (opcional)</label>
              <input
                name="monthly_budget"
                type="number"
                min="0"
                defaultValue={editing?.monthly_budget ?? ""}
                className="input"
                placeholder="Sin límite"
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={pending}
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </form>
      </Modal>
    </>
  );
}
