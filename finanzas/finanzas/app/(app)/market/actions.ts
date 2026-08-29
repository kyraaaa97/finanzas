"use server";

import { createClient } from "@/lib/supabase/server";

export interface MarketItem {
  id: string;
  type: "needed" | "purchase";
  name: string;
  category: string | null;
  price: number | null;
  checked: boolean;
  date: string | null;
  created_at: string;
}

type Result = { ok: boolean; error?: string };

export async function getMarket(): Promise<MarketItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("market_items")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as MarketItem[];
}

export async function addNeeded(
  name: string,
  category: string
): Promise<Result> {
  if (!name.trim()) return { ok: false, error: "Escribe un nombre." };
  const supabase = createClient();
  const { error } = await supabase.from("market_items").insert({
    type: "needed",
    name: name.trim(),
    category: category || null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function toggleNeeded(
  id: string,
  checked: boolean
): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase
    .from("market_items")
    .update({ checked })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function addPurchase(formData: FormData): Promise<Result> {
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "");
  const price = Number(formData.get("price"));
  const date = String(formData.get("date") || "");

  if (!name) return { ok: false, error: "Escribe un nombre." };
  if (!price || price < 0) return { ok: false, error: "Precio inválido." };

  const supabase = createClient();
  const { error } = await supabase.from("market_items").insert({
    type: "purchase",
    name,
    category: category || null,
    price,
    date: date || new Date().toISOString().slice(0, 10),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteItem(id: string): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase.from("market_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
