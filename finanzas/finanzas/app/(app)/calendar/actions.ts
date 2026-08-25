"use server";

import { createClient } from "@/lib/supabase/server";

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string | null;
  label: string | null;
  color: string;
  created_at: string;
}

type Result = { ok: boolean; error?: string };

export async function getEvents(): Promise<EventItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true, nullsFirst: true });
  return (data ?? []) as EventItem[];
}

export async function createEvent(formData: FormData): Promise<Result> {
  const supabase = createClient();
  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const color = String(formData.get("color") || "#3b82f6");

  if (!title) return { ok: false, error: "Escribe un título." };
  if (!date) return { ok: false, error: "Elige una fecha." };

  const { error } = await supabase.from("events").insert({
    title,
    date,
    time: time || null,
    label: label || null,
    color,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteEvent(id: string): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
