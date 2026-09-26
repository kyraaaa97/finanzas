"use server";

import { createClient } from "@/lib/supabase/server";

export interface Todo {
  id: string;
  text: string;
  person: string | null;
  date: string;
  done: boolean;
  created_at: string;
}

type Result = { ok: boolean; error?: string };

export async function getTodos(): Promise<Todo[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("todos")
    .select("*")
    .order("created_at", { ascending: true });
  return (data ?? []) as Todo[];
}

export async function addTodo(
  text: string,
  person: string,
  date: string
): Promise<Result> {
  if (!text.trim()) return { ok: false, error: "Escribe la tarea." };
  const supabase = createClient();
  const { error } = await supabase.from("todos").insert({
    text: text.trim(),
    person: person.trim() || null,
    date: date || new Date().toISOString().slice(0, 10),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function toggleTodo(id: string, done: boolean): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase.from("todos").update({ done }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteTodo(id: string): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
