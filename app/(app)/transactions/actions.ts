"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TxType } from "@/lib/types";

type Result = { ok: boolean; error?: string };

function revalidateAll() {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
}

export async function createTransaction(formData: FormData): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const type = String(formData.get("type")) as TxType;
  const amount = Number(formData.get("amount"));
  const categoryId = String(formData.get("category_id") || "");
  const description = String(formData.get("description") || "").trim();
  const date = String(formData.get("date") || "");

  if (!amount || amount <= 0) return { ok: false, error: "Monto inválido." };
  if (type !== "income" && type !== "expense")
    return { ok: false, error: "Tipo inválido." };

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type,
    amount,
    category_id: categoryId || null,
    description: description || null,
    date: date || new Date().toISOString().slice(0, 10),
  });

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}
