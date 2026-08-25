"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TxType } from "@/lib/types";

type Result = { ok: boolean; error?: string };

function revalidateAll() {
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function createCategory(formData: FormData): Promise<Result> {
  const supabase = createClient();

  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type")) as TxType;
  const color = String(formData.get("color") || "#2f8a58");
  const budgetRaw = String(formData.get("monthly_budget") || "");
  const monthly_budget =
    type === "expense" && budgetRaw ? Number(budgetRaw) : null;

  if (!name) return { ok: false, error: "Escribe un nombre." };
  if (type !== "income" && type !== "expense")
    return { ok: false, error: "Tipo inválido." };

  const { error } = await supabase.from("categories").insert({
    name,
    type,
    color,
    monthly_budget,
  });

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<Result> {
  const supabase = createClient();
  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "#2f8a58");
  const budgetRaw = String(formData.get("monthly_budget") || "");
  const monthly_budget = budgetRaw ? Number(budgetRaw) : null;

  if (!name) return { ok: false, error: "Escribe un nombre." };

  const { error } = await supabase
    .from("categories")
    .update({ name, color, monthly_budget })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

// Actualiza solo el presupuesto (usado en la vista de presupuestos).
export async function setBudget(
  id: string,
  amount: number | null
): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase
    .from("categories")
    .update({ monthly_budget: amount })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

// ---- Sub-ítems del desglose por categoría ----

export async function addBudgetItem(
  categoryId: string,
  name: string,
  amount: number
): Promise<Result> {
  if (!name.trim()) return { ok: false, error: "Escribe un nombre." };
  if (!amount || amount < 0) return { ok: false, error: "Monto inválido." };

  const supabase = createClient();
  const { error } = await supabase.from("budget_items").insert({
    category_id: categoryId,
    name: name.trim(),
    amount,
  });
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function deleteBudgetItem(id: string): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase.from("budget_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

// Crea un set de categorías por defecto (útil si la cuenta quedó sin ninguna).
export async function seedDefaultCategories(): Promise<Result> {
  const supabase = createClient();

  const defaults = [
    { name: "Sueldo", type: "income", color: "#2f8a58" },
    { name: "Otros ingresos", type: "income", color: "#14b8a6" },
    { name: "Arriendo", type: "expense", color: "#ef4444" },
    { name: "Supermercado", type: "expense", color: "#f59e0b" },
    { name: "Comida y salidas", type: "expense", color: "#f97316" },
    { name: "Transporte", type: "expense", color: "#3b82f6" },
    { name: "Servicios", type: "expense", color: "#8b5cf6" },
    { name: "Entretención", type: "expense", color: "#ec4899" },
    { name: "Salud", type: "expense", color: "#6366f1" },
    { name: "Otros gastos", type: "expense", color: "#84cc16" },
  ];

  const { error } = await supabase.from("categories").insert(
    defaults.map((d) => ({ ...d, monthly_budget: null }))
  );
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}
