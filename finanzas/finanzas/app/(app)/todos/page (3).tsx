"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  ListChecks,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { PALETTE, classNames, today } from "@/lib/utils";
import { getTodos, addTodo, toggleTodo, deleteTodo, type Todo } from "./actions";

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

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return ymd(d);
}
function longDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${WEEKDAYS[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}
function personColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return (
    (p[0]?.[0] ?? "?").toUpperCase() + (p[1]?.[0] ?? "").toUpperCase()
  );
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(today());
  const [text, setText] = useState("");
  const [person, setPerson] = useState("");
  const [, startTransition] = useTransition();

  const load = useCallback(async () => {
    const data = await getTodos();
    setTodos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dayTodos = todos.filter((t) => t.date === viewDate);

  // Personas conocidas (para chips rápidos)
  const knownPeople = Array.from(
    new Set(
      todos
        .map((t) => (t.person || "").trim())
        .filter(Boolean)
    )
  ).slice(0, 6);

  // Agrupar por persona
  const groups = new Map<string, Todo[]>();
  for (const t of dayTodos) {
    const key = (t.person || "Sin asignar").trim();
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }
  const groupNames = Array.from(groups.keys()).sort((a, b) =>
    a.localeCompare(b)
  );

  function handleAdd() {
    if (!text.trim()) return;
    startTransition(async () => {
      await addTodo(text, person, viewDate);
      setText("");
      await load();
    });
  }
  function handleToggle(id: string, done: boolean) {
    startTransition(async () => {
      await toggleTodo(id, done);
      await load();
    });
  }
  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTodo(id);
      await load();
    });
  }

  const isToday = viewDate === today();

  return (
    <div>
      <PageHeader
        title="Pendientes"
        subtitle="Tareas del día por persona. Marca lo que vayas completando."
      />

      {/* Navegación por día */}
      <div className="card mb-4 flex items-center justify-between">
        <button
          onClick={() => setViewDate((d) => addDays(d, -1))}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          aria-label="Día anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold capitalize text-gray-900">
            {isToday ? "Hoy" : longDate(viewDate)}
          </p>
          {isToday && (
            <p className="text-xs capitalize text-gray-400">
              {longDate(viewDate)}
            </p>
          )}
          {!isToday && (
            <button
              onClick={() => setViewDate(today())}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Volver a hoy
            </button>
          )}
        </div>
        <button
          onClick={() => setViewDate((d) => addDays(d, 1))}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          aria-label="Día siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Agregar tarea */}
      <div className="card mb-6">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            className="input sm:w-40"
            placeholder="¿Para quién?"
          />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="input flex-1"
            placeholder="Ej: ir al supermercado, llamar cliente…"
          />
          <button className="btn-primary" onClick={handleAdd}>
            <Plus size={18} />
            Agregar
          </button>
        </div>
        {knownPeople.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {knownPeople.map((p) => (
              <button
                key={p}
                onClick={() => setPerson(p)}
                className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: personColor(p) }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="card text-center text-sm text-gray-400">Cargando…</div>
      ) : dayTodos.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-10 text-center text-sm text-gray-500">
          <ListChecks className="text-gray-300" size={28} />
          No hay pendientes para este día. Agrega el primero arriba. ✍️
        </div>
      ) : (
        <div className="space-y-5">
          {groupNames.map((name) => {
            const list = groups.get(name)!;
            const doneCount = list.filter((t) => t.done).length;
            const color =
              name === "Sin asignar" ? "#94a3b8" : personColor(name);
            const sorted = [...list].sort(
              (a, b) => Number(a.done) - Number(b.done)
            );
            return (
              <div key={name}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {name === "Sin asignar" ? "?" : initials(name)}
                  </span>
                  <span className="text-sm font-semibold capitalize text-gray-900">
                    {name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {doneCount}/{list.length}
                  </span>
                </div>

                <div className="card divide-y divide-gray-100 p-0">
                  {sorted.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <button
                        onClick={() => handleToggle(t.id, !t.done)}
                        className={classNames(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          t.done
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-gray-300 hover:border-brand-400"
                        )}
                        aria-label="Completar"
                      >
                        {t.done && <Check size={14} />}
                      </button>
                      <p
                        className={classNames(
                          "flex-1 text-sm",
                          t.done
                            ? "text-gray-400 line-through"
                            : "text-gray-900"
                        )}
                      >
                        {t.text}
                      </p>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
