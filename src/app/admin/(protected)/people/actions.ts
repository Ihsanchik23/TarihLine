"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export type PersonFormState = { error: string | null };

function value(data: FormData, name: string) {
  const item = data.get(name);
  return typeof item === "string" ? item.trim() : "";
}

function slugify(text: string, year: number) {
  const latin = text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return `${latin || "person"}-${year}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function createPersonDraft(_state: PersonFormState, data: FormData): Promise<PersonFormState> {
  await requireAdmin();
  const birthYear = Number(value(data, "birth_year"));
  const deathValue = value(data, "death_year");
  const deathYear = deathValue ? Number(deathValue) : null;
  const fields = ["title_ru", "title_kk", "summary_ru", "summary_kk", "biography_ru", "biography_kk", "occupation_ru", "occupation_kk", "category", "source_title", "source_url", "source_license"];
  if (fields.some((name) => !value(data, name))) return { error: "Заполните все обязательные поля" };
  if (!Number.isInteger(birthYear) || birthYear < 1800 || birthYear > 2000) return { error: "Год рождения должен быть в диапазоне 1800–2000" };
  if (deathYear !== null && (!Number.isInteger(deathYear) || deathYear < birthYear || deathYear > 2026)) return { error: "Проверьте год смерти" };
  try {
    const url = new URL(value(data, "source_url"));
    if (!['http:', 'https:'].includes(url.protocol)) return { error: "Укажите корректную ссылку на источник" };
  } catch { return { error: "Укажите корректную ссылку на источник" }; }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_person_draft", {
    p_slug: slugify(value(data, "title_ru"), birthYear),
    p_title_ru: value(data, "title_ru"), p_title_kk: value(data, "title_kk"),
    p_summary_ru: value(data, "summary_ru"), p_summary_kk: value(data, "summary_kk"),
    p_biography_ru: value(data, "biography_ru"), p_biography_kk: value(data, "biography_kk"),
    p_category: value(data, "category"), p_birth_year: birthYear, p_death_year: deathYear,
    p_occupation_ru: value(data, "occupation_ru"), p_occupation_kk: value(data, "occupation_kk"),
    p_source_title: value(data, "source_title"), p_source_url: value(data, "source_url"),
    p_source_author: value(data, "source_author"), p_source_publisher: value(data, "source_publisher"),
    p_source_license: value(data, "source_license"),
  });
  if (error) return { error: error.code === "23505" ? "Такая личность уже существует" : "Не удалось сохранить черновик" };
  revalidatePath("/admin"); revalidatePath("/admin/people");
  redirect("/admin/people?created=1");
}
