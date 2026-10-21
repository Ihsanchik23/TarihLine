"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { invalidateHistoryCache } from "@/lib/history-cache";
import { createClient } from "@/lib/supabase/server";

export type SourceActionState = { error: string | null };

function field(data: FormData, name: string) {
  const item = data.get(name);
  return typeof item === "string" ? item.trim() : "";
}

function validUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function updateSource(_state: SourceActionState, data: FormData): Promise<SourceActionState> {
  await requireAdmin();
  const sourceId = field(data, "source_id");
  const title = field(data, "title");
  const url = field(data, "url");
  if (!sourceId || !title) return { error: "Укажите название источника" };
  if (!validUrl(url)) return { error: "Ссылка должна начинаться с http:// или https://" };
  const supabase = await createClient();
  const { error } = await supabase.from("sources").update({
    title,
    url: url || null,
    author: field(data, "author") || null,
    publisher: field(data, "publisher") || null,
    license: field(data, "license") || null,
    notes: field(data, "notes") || null,
    accessed_at: new Date().toISOString().slice(0, 10),
  }).eq("id", sourceId);
  if (error) return { error: "Не удалось сохранить источник" };
  revalidatePath("/");
  invalidateHistoryCache();
  revalidatePath("/admin");
  revalidatePath("/admin/sources");
  revalidatePath(`/admin/sources/${sourceId}`);
  redirect(`/admin/sources/${sourceId}?saved=1`);
}

export async function linkSourceToRecord(_state: SourceActionState, data: FormData): Promise<SourceActionState> {
  await requireAdmin();
  const sourceId = field(data, "source_id");
  const recordId = field(data, "record_id");
  if (!sourceId || !recordId) return { error: "Выберите материал" };
  const supabase = await createClient();
  const { data: record } = await supabase.from("historical_records").select("id,status").eq("id", recordId).maybeSingle();
  if (!record || record.status !== "draft") return { error: "Источник можно добавить только к черновику" };
  const { error } = await supabase.from("record_sources").insert({ source_id: sourceId, record_id: recordId });
  if (error) return { error: error.code === "23505" ? "Источник уже связан с этим материалом" : "Не удалось добавить источник" };
  revalidatePath(`/admin/sources/${sourceId}`);
  revalidatePath(`/admin/events/${recordId}`);
  revalidatePath(`/admin/people/${recordId}`);
  redirect(`/admin/sources/${sourceId}?linked=1`);
}

export async function deleteSource(_state: SourceActionState, data: FormData): Promise<SourceActionState> {
  await requireAdmin();
  const sourceId = field(data, "source_id");
  if (!sourceId) return { error: "Источник не найден" };
  const supabase = await createClient();
  const checks = await Promise.all([
    supabase.from("record_sources").select("record_id", { count: "exact", head: true }).eq("source_id", sourceId),
    supabase.from("marker_sources").select("marker_id", { count: "exact", head: true }).eq("source_id", sourceId),
    supabase.from("relation_sources").select("relation_id", { count: "exact", head: true }).eq("source_id", sourceId),
    supabase.from("media").select("id", { count: "exact", head: true }).eq("source_id", sourceId),
    supabase.from("border_layers").select("id", { count: "exact", head: true }).eq("source_id", sourceId),
  ]);
  if (checks.some((result) => result.error)) return { error: "Не удалось проверить использование источника" };
  if (checks.some((result) => (result.count ?? 0) > 0)) return { error: "Нельзя удалить используемый источник" };
  const { error } = await supabase.from("sources").delete().eq("id", sourceId);
  if (error) return { error: error.code === "23503" ? "Нельзя удалить используемый источник" : "Не удалось удалить источник" };
  revalidatePath("/admin");
  revalidatePath("/admin/sources");
  redirect("/admin/sources?deleted=1");
}
