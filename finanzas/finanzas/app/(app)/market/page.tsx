"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Plus, Trash2, ShoppingCart, Check } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { formatCurrency, formatNumber, classNames, today } from "@/lib/utils";
import {
  getMarket,
  addNeeded,
  toggleNeeded,
  addPurchase,
  deleteItem,
  type MarketItem,
} from "./actions";

const CATEGORIES = [
  { name: "Carne", color: "#ef4444" },
  { name: "Lácteos", color: "#3b82f6" },
  { name: "Frutas y verduras", color: "#2f8a58" },
  { name: "Acompañamientos", color: "#f59e0b" },
  { name: "Colaciones", color: "#8b5cf6" },
  { name: "Desayuno", color: "#f97316" },
  { name: "Bebidas", color: "#14b8a6" },
  { name: "Limpieza", color: "#6366f1" },
  { name: "Otros", color: "#84cc16" },
];

function catColor(name: string | null): string {
  return CATEGORIES.find((c) => c.name === name)?.color ?? "#94a3b8";
}

function monthPrefix(): string {
  return today().slice(0, 7);
}

export default function MarketPage() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"needed" | "purchases">("needed");
  const [, startTransition] = useTransition();

  const [neededName, setNeededName] = useState("");
  const [neededCat, setNeededCat] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await getMarket();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const needed = items.filter((i) => i.type === "needed");
  const purchases = items.filter((i) => i.type === "purchase");

  const monthPurchases = purchases.filter(
    (p) => (p.date ?? "").slice(0, 7) === monthPrefix()
  );
  const totalMonth = monthPurchases.reduce(
    (s, p) => s + Number(p.price ?? 0),
    0
  );

  const byCat = new Map<string, number>();
  for (const p of monthPurchases) {
    const key = p.category ?? "Otros";
    byCat.set(key, (byCat.get(key) ?? 0) + Number(p.price ?? 0));
  }
  const chartData = Array.from(byCat.entries())
    .map(([name, value]) => ({ name, value, color: catColor(name) }))
    .sort((a, b) => b.value - a.value);

  function handleAddNeeded() {
    if (!neededName.trim()) return;
    setError(null);
    startTransition(async () => {
      await addNeeded(neededName, neededCat);
      setNeededName("");
      setNeededCat("");
      await load();
    });
  }

  function handleToggle(id: string, checked: boolean) {
    startTransition(async () => {
      await toggleNeeded(id, checked);
      await load();
    });
  }

  function handleAddPurchase(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addPurchase(formData);
      if (res.ok) {
        const form = document.getElementById(
          "purchase-form"
        ) as HTMLFormElement | null;
        form?.reset();
        await load();
      } else {
        setError(res.error ?? "No se pudo guardar.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteItem(id);
      await load();
    });
  }

  return (
    <div>
      <PageHeader
        title="Supermercado"
        subtitle="Lo que falta comprar y el registro de compras."
      />

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setTab("needed")}
          className={classNames(
            "rounded-lg py-2 text-sm font-medium transition-colors",
            tab === "needed" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          )}
        >
          Cosas que faltan
        </button>
        <button
          onClick={() => setTab("purchases")}
          className={classNames(
            "rounded-lg py-2 text-sm font-medium transition-colors",
            tab === "purchases"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500"
          )}
        >
          Compras
        </button>
      </div>

      {loading ? (
        <div className="card text-center text-sm text-gray-400">Cargando…</div>
      ) : tab === "needed" ? (
        <div>
          <div className="card mb-4">
            <label className="label">Agregar algo que falta</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={neededName}
                onChange={(e) => setNeededName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNeeded()}
                className="input flex-1"
                placeholder="Ej: Leche, Pan, Detergente"
              />
              <select
                value={neededCat}
                onChange={(e) => setNeededCat(e.target.value)}
                className="input sm:w-48"
              >
                <option value="">Categoría (opcional)</option>
                {CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button className="btn-primary" onClick={handleAddNeeded}>
                <Plus size={18} />
                Agregar
              </button>
            </div>
          </div>

          {needed.length === 0 ? (
            <div className="card text-center text-sm text-gray-500">
              La lista está vacía. Agrega lo que falta comprar. 🛒
            </div>
          ) : (
            <div className="card divide-y divide-gray-100 p-0">
              {needed.map((it) => (
                <div key={it.id} className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => handleToggle(it.id, !it.checked)}
                    className={classNames(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2",
                      it.checked
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-gray-300"
                    )}
                    aria-label="Marcar"
                  >
                    {it.checked && <Check size={14} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={classNames(
                        "truncate text-sm font-medium",
                        it.checked
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      )}
                    >
                      {it.name}
                    </p>
                    {it.category && (
                      <span
                        className="mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                        style={{ backgroundColor: catColor(it.category) }}
                      >
                        {it.category}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(it.id)}
                    className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="card mb-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Gasto del mes</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(totalMonth)}
                </p>
              </div>
              <ShoppingCart className="text-gray-300" size={28} />
            </div>
            {chartData.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                Registra compras para ver el gráfico por categoría.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#eef0ef"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatNumber(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={96}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    cursor={{ fill: "#f7f8f7" }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={26}>
                    {chartData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card mb-4">
            <label className="label">Registrar una compra</label>
            <form id="purchase-form" action={handleAddPurchase} className="space-y-2">
              <input
                name="name"
                className="input"
                placeholder="Ej: Carne molida"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select name="category" className="input" defaultValue="">
                  <option value="">Categoría</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  name="price"
                  type="number"
                  min="0"
                  className="input"
                  placeholder="Precio"
                  required
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  name="date"
                  type="date"
                  defaultValue={today()}
                  className="input sm:flex-1"
                  required
                />
                <button type="submit" className="btn-primary sm:w-40">
                  <Plus size={18} />
                  Guardar compra
                </button>
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
            </form>
          </div>

          {monthPurchases.length === 0 ? (
            <div className="card text-center text-sm text-gray-500">
              No hay compras este mes todavía.
            </div>
          ) : (
            <div className="card divide-y divide-gray-100 p-0">
              {monthPurchases.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="h-8 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: catColor(p.category) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {p.name}
                    </p>
                    {p.category && (
                      <span className="text-xs text-gray-400">{p.category}</span>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-gray-900">
                    {formatCurrency(Number(p.price ?? 0))}
                  </span>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
