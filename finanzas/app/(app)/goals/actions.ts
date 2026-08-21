"use server";

import { revalidatePath } from "next/cache";
import { addWeeks, addMonths, addYears } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { TxType, Frequency } from "@/lib/types";

type Result = { ok: boolean; error?: string };

function revalidateAll() {
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

/* ---------------- Metas de ahorro ---------------- */

export async function createGoal(formData: FormData): Promise<Result> {
  const supabase = createClient();

  const name = String(formData.get("name") || "").trim();
  const target = Number(formData.get("target_amount"));
  const current = Number(formData.get("current_amount") || 0);
  const targetDate = String(formData.get("target_date") || "");
  const color = String(formData.get("color") || "#3b82f6");

  if (!name) return { ok: false, error: "Escribe un nombre." };
  if (!target || target <= 0)
    return { ok: false, error: "La meta debe ser mayor a 0." };

  const { error } = await supabase.from("goals").insert({
    name,
    target_amount: target,
    current_amount: current > 0 ? current : 0,
    target_date: targetDate || null,
    color,
  });

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function addToGoal(id: string, amount: number): Promise<Result> {
  const supabase = createClient();
  const { data: goal, error: readErr } = await supabase
    .from("goals")
    .select("current_amount")
    .eq("id", id)
    .single();
  if (readErr || !goal) return { ok: false, error: "Meta no encontrada." };

  const next = Math.max(0, Number(goal.current_amount) + amount);
  const { error } = await supabase
    .from("goals")
    .update({ current_amount: next })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function deleteGoal(id: string): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

/* ---------------- Movimientos recurrentes ---------------- */

export async function createRecurring(formData: FormData): Promise<Result> {
  const supabase = createClient();

  const type = String(formData.get("type")) as TxType;
  const amount = Number(formData.get("amount"));
  const categoryId = String(formData.get("category_id") || "");
  const description = String(formData.get("description") || "").trim();
  const frequency = String(formData.get("frequency")) as Frequency;
  const nextDate = String(formData.get("next_date") || "");

  if (!amount || amount <= 0) return { ok: false, error: "Monto inválido." };

  const { error } = await supabase.from("recurring_transactions").insert({
    type,
    amount,
    category_id: categoryId || null,
    description: description || null,
    frequency,
    next_date: nextDate || new Date().toISOString().slice(0, 10),
    active: true,
  });

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

// Registra el movimiento recurrente como transacción real y avanza la fecha.
export async function applyRecurring(id: string): Promise<Result> {
  const supabase = createClient();

  const { data: rec, error: readErr } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("id", id)
    .single();
  if (readErr || !rec) return { ok: false, error: "No encontrado." };

  const { error: insErr } = await supabase.from("transactions").insert({
    type: rec.type,
    amount: rec.amount,
    category_id: rec.category_id,
    description: rec.description,
    date: rec.next_date,
  });
  if (insErr) return { ok: false, error: insErr.message };

  const base = new Date(rec.next_date + "T00:00:00");
  const next =
    rec.frequency === "weekly"
      ? addWeeks(base, 1)
      : rec.frequency === "yearly"
      ? addYears(base, 1)
      : addMonths(base, 1);

  const { error: updErr } = await supabase
    .from("recurring_transactions")
    .update({ next_date: next.toISOString().slice(0, 10) })
    .eq("id", id);
  if (updErr) return { ok: false, error: updErr.message };

  revalidateAll();
  return { ok: true };
}

export async function deleteRecurring(id: string): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}
