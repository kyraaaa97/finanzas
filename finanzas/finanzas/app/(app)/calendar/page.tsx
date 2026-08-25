"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
} from "lucide-react";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import { PALETTE, classNames } from "@/lib/utils";
import {
  getEvents,
  createEvent,
  deleteEvent,
  type EventItem,
} from "./actions";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const PRESET_LABELS = [
  { name: "Mamá", color: "#ec4899" },
  { name: "Papá", color: "#3b82f6" },
  { name: "Médico", color: "#ef4444" },
  { name: "Colegio", color: "#f59e0b" },
  { name: "Comida", color: "#f97316" },
  { name: "Cumpleaños", color: "#8b5cf6" },
  { name: "Otro", color: "#2f8a58" },
];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function longDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${WEEKDAYS[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

export default function CalendarPage() {
  const now = new Date();
  const todayStr = ymd(now);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [open, setOpen] = useState(false);
  const [formDate, setFormDate] = useState(todayStr);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(PALETTE[1]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const data = await getEvents();
    setEvents(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byDate = new Map<string, EventItem[]>();
  for (const ev of events) {
    const list = byDate.get(ev.date) ?? [];
    list.push(ev);
    byDate.set(ev.date, list);
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(ymd(new Date(viewYear, viewMonth, d)));
  }

  const upcoming = events.filter((e) => e.date >= todayStr).slice(0, 40);
  const agendaDates = Array.from(new Set(upcoming.map((e) => e.date)));

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  function openNew(date: string) {
    setFormDate(date);
    setLabel("");
    setColor(PALETTE[1]);
    setError(null);
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("date", formDate);
    formData.set("label", label);
    formData.set("color", color);
    startTransition(async () => {
      const res = await createEvent(formData);
      if (res.ok) {
        setOpen(false);
        await load();
      } else {
        setError(res.error ?? "No se pudo guardar.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteEvent(id);
      await load();
    });
  }

  function pickPreset(name: string, c: string) {
    setLabel(name);
    setColor(c);
  }

  return (
    <div>
      <PageHeader
        title="Calendario"
        subtitle="Organización familiar: eventos, horarios y recordatorios."
        action={
          <button className="btn-primary" onClick={() => openNew(todayStr)}>
            <Plus size={18} />
            Nuevo evento
          </button>
        }
      />

      <div className="card mb-6">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-sm font-semibold capitalize text-gray-900">
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={nextMonth}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="pb-1 text-center text-[11px] font-medium text-gray-400"
            >
              {w}
            </div>
          ))}
          {cells.map((date, i) => {
            if (!date) return <div key={`e${i}`} />;
            const dayEvents = byDate.get(date) ?? [];
            const isToday = date === todayStr;
            const dayNum = Number(date.slice(8, 10));
            return (
              <button
                key={date}
                onClick={() => openNew(date)}
                className={classNames(
                  "flex min-h-[54px] flex-col rounded-lg border p-1 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40",
                  isToday ? "border-brand-400 bg-brand-50" : "border-gray-100"
                )}
              >
                <span
                  className={classNames(
                    "mb-0.5 text-[11px] font-medium",
                    isToday ? "text-brand-700" : "text-gray-500"
                  )}
                >
                  {dayNum}
                </span>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      className="truncate rounded px-1 text-[10px] leading-tight text-white"
                      style={{ backgroundColor: ev.color }}
                      title={ev.title}
                    >
                      {ev.time ? `${ev.time} ` : ""}
                      {ev.title}
                    </span>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-gray-400">
                      +{dayEvents.length - 3} más
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-gray-900">
        Próximos eventos
      </h2>

      {loading ? (
        <div className="card text-center text-sm text-gray-400">Cargando…</div>
      ) : agendaDates.length === 0 ? (
        <div className="card text-center text-sm text-gray-500">
          No hay eventos próximos. Toca un día del calendario o “Nuevo evento”
          para agregar el primero.
        </div>
      ) : (
        <div className="space-y-4">
          {agendaDates.map((date) => (
            <div key={date}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {date === todayStr ? "Hoy · " : ""}
                <span className="capitalize">{longDate(date)}</span>
              </p>
              <div className="card divide-y divide-gray-100 p-0">
                {(byDate.get(date) ?? []).map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className="h-8 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: ev.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {ev.title}
                      </p>
                      <p className="flex items-center gap-2 text-xs text-gray-400">
                        {ev.time && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {ev.time}
                          </span>
                        )}
                        {ev.label && (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                            style={{ backgroundColor: ev.color }}
                          >
                            {ev.label}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      disabled={pending}
                      className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo evento">
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="label">¿Qué es?</label>
            <input
              name="title"
              type="text"
              required
              autoFocus
              className="input"
              placeholder="Ej: Médico, Almuerzo: puré con carne"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Hora (opcional)</label>
              <input name="time" type="time" className="input" />
            </div>
          </div>

          <div>
            <label className="label">Etiqueta (opcional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="input mb-2"
              placeholder="Ej: Mamá, Colegio…"
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESET_LABELS.map((p) => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() => pickPreset(p.name, p.color)}
                  className={classNames(
                    "rounded-full px-2.5 py-1 text-xs font-medium text-white transition-transform",
                    label === p.name ? "ring-2 ring-gray-900 ring-offset-1" : ""
                  )}
                  style={{ backgroundColor: p.color }}
                >
                  {p.name}
                </button>
              ))}
            </div>
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
            {pending ? "Guardando…" : "Guardar evento"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
