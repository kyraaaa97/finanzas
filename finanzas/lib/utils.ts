// Utilidades de formato y fechas.

// Moneda por defecto: peso chileno (CLP), sin decimales.
// Para cambiarla, ajusta CURRENCY_LOCALE y CURRENCY_CODE.
export const CURRENCY_LOCALE = "es-CL";
export const CURRENCY_CODE = "CLP";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: CURRENCY_CODE,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : date;
  return new Intl.DateTimeFormat(CURRENCY_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

// Primer día del mes actual en formato YYYY-MM-DD.
export function firstDayOfMonth(d = new Date()): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

// Último día del mes actual en formato YYYY-MM-DD.
export function lastDayOfMonth(d = new Date()): string {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Nombre del mes (ej: "agosto 2026").
export function monthLabel(d = new Date()): string {
  return new Intl.DateTimeFormat(CURRENCY_LOCALE, {
    month: "long",
    year: "numeric",
  }).format(d);
}

// Paleta de colores sugerida para categorías y metas.
export const PALETTE = [
  "#2f8a58",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
];

export function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
