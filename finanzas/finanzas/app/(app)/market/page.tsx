"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
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
import { Plus, Trash2, ShoppingCart, Check, Camera } from "lucide-react";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import { formatCurrency, formatNumber, classNames, today } from "@/lib/utils";
import {
  getMarket,
  addNeeded,
  toggleNeeded,
  addPurchase,
  addPurchasesBulk,
  deleteItem,
  type MarketItem,
} from "./actions";

function loadTesseract(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    const w = window as any;
    if (w.Tesseract) return resolve(w.Tesseract);
    const s = document.createElement("script");
    s.src =
      "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
    s.onload = () => resolve((window as any).Tesseract);
    s.onerror = () => reject(new Error("No se pudo cargar el lector."));
    document.body.appendChild(s);
  });
}

interface ScanRow {
  name: string;
  category: string;
  price: number;
}

function parseReceipt(text: string): ScanRow[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const items: ScanRow[] = [];
  const skipRe =
    /total|subtotal|rut|boleta|fecha|vuelto|efectivo|tarjeta|cambio|iva|nro|n°|cliente|gracias|ticket|caja|autoriza|monto|propina/i;
  const priceRe = /(\d{1,3}(?:[.,]\d{3})+|\d{3,6})(?!.*\d)/;
  const discRe = /desc|dcto|ahorro|promo|rebaj|oferta/i;
  for (const line of lines) {
    if (skipRe.test(line)) continue;
    const m = line.match(priceRe);
    if (!m || m.index === undefined) continue;
    const price = Number(m[1].replace(/[^\d]/g, ""));
    if (!price || price < 50) continue;
    let name = line
      .slice(0, m.index)
      .replace(/[^0-9A-Za-zÁÉÍÓÚáéíóúÑñ %.\-]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    const isDiscount = discRe.test(line) || /^-/.test(line);
    if (isDiscount && items.length) {
      const last = items[items.length - 1];
      last.price = Math.max(0, last.price - price);
      continue;
    }
    if (name.length < 2) name = "Producto";
    items.push({ name, category: "", price });
  }
  return items;
}

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
  const [pending, startTransition] = useTransition();

  const [neededName, setNeededName] = useState("");
  const [neededCat, setNeededCat] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanItems, setScanItems] = useState<ScanRow[]>([]);

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

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setScanning(true);
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = () => rej(new Error("read"));
        r.readAsDataURL(file);
      });
      const T = await loadTesseract();
      const { data } = await T.recognize(dataUrl, "spa");
      const parsed = parseReceipt(data?.text || "");
      setScanItems(
        parsed.length ? parsed : [{ name: "", category: "", price: 0 }]
      );
      setScanOpen(true);
    } catch {
      setError(
        "No se pudo leer la boleta. Prueba con una foto más nítida y derecha, o agrega las compras a mano."
      );
    } finally {
      setScanning(false);
    }
  }

  function updateScanRow(i: number, patch: Partial<ScanRow>) {
    setScanItems((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r))
    );
  }
  function removeScanRow(i: number) {
    setScanItems((rows) => rows.filter((_, idx) => idx !== i));
  }
  function addScanRow() {
    setScanItems((rows) => [...rows, { name: "", category: "", price: 0 }]);
  }
  function saveScanned() {
    startTransition(async () => {
      const res = await addPurchasesBulk(
        scanItems.map((r) => ({ ...r, date: today() }))
      );
      if (res.ok) {
        setScanOpen(false);
        setScanItems([]);
        await load();
      } else {
        setError(res.error ?? "No se pudo guardar.");
      }
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
