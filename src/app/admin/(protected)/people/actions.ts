"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export type PersonFormState = { error: string | null };
export type PersonWorkflowState = { error: string | null };

type PersonFields = {
  titleRu: string;
  titleKk: string;
  summaryRu: string;
  summaryKk: string;
  biographyRu: string;
  biographyKk: string;
  occupationRu: string;
  occupationKk: string;
  category: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceAuthor: string;
  sourcePublisher: string;
  sourceLicense: string;
  birthYear: number;
  deathYear: number | null;
};

const transliteration: Record<string, string> = {
  а: "a", ә: "a", б: "b", в: "v", г: "g", ғ: "g", д: "d", е: "e", ё: "e",
  ж: "zh", з: "z", и: "i", й: "i", к: "k", қ: "q", л: "l", м: "m", н: "n",
  ң: "n", о: "o", ө: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ұ: "u",
  ү: "u", ф: "f", х: "h", һ: "h", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ъ: "", ы: "y", і: "i", ь: "", э: "e", ю: "yu", я: "ya",
};

function field(data: FormData, name: string) {
  const item = data.get(name);
  return typeof item === "string" ? item.trim() : "";
}

function slugify(text: string, year: number) {
  const transliterated = [...text.toLowerCase()].map((character) => transliteration[character] ?? character).join("");
  const base = transliterated.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return `${base || "person"}-${year}-${crypto.randomUUID().slice(0, 8)}`;
}

function readPersonFields(data: FormData): PersonFields {
  const deathValue = field(data, "death_year");
  return {
    titleRu: field(data, "title_ru"), titleKk: field(data, "title_kk"),
    summaryRu: field(data, "summary_ru"), summaryKk: field(data, "summary_kk"),
    biographyRu: field(data, "biography_ru"), biographyKk: field(data, "biography_kk"),
    occupationRu: field(data, "occupation_ru"), occupationKk: field(data, "occupation_kk"),
    category: field(data, "category"), sourceTitle: field(data, "source_title"),
    sourceUrl: field(data, "source_url"), sourceAuthor: field(data, "source_author"),
    sourcePublisher: field(data, "source_publisher"), sourceLicense: field(data, "source_license"),
    birthYear: Number(field(data, "birth_year")), deathYear: deathValue ? Number(deathValue) : null,
  };
}

function validatePersonFields(values: PersonFields) {
  const required = [values.titleRu, values.titleKk, values.summaryRu, values.summaryKk, values.biographyRu, values.biographyKk, values.occupationRu, values.occupationKk, values.category, values.sourceTitle, values.sourceUrl, values.sourceLicense];
  if (required.some((value) => !value)) return "Заполните все обязательные поля";
  if (!Number.isInteger(values.birthYear) || values.birthYear < 1800 || values.birthYear > 2000) return "Год рождения должен быть в диапазоне 1800–2000";
  if (values.deathYear !== null && (!Number.isInteger(values.deathYear) || values.deathYear < values.birthYear || values.deathYear > 2026)) return "Проверьте год смерти";
  try {
    const url = new URL(values.sourceUrl);
    if (!(url.protocol === "http:" || url.protocol === "https:")) return "Укажите корректную ссылку на источник";
  } catch {
    return "Укажите корректную ссылку на источник";
  }
  return null;
}

export async function createPersonDraft(_state: PersonFormState, data: FormData): Promise<PersonFormState> {
  await requireAdmin();
  const values = readPersonFields(data);
  const validationError = validatePersonFields(values);
  if (validationError) return { error: validationError };
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_person_draft", {
    p_slug: slugify(values.titleRu, values.birthYear), p_title_ru: values.titleRu, p_title_kk: values.titleKk,
    p_summary_ru: values.summaryRu, p_summary_kk: values.summaryKk, p_biography_ru: values.biographyRu,
    p_biography_kk: values.biographyKk, p_category: values.category, p_birth_year: values.birthYear,
    p_death_year: values.deathYear, p_occupation_ru: values.occupationRu, p_occupation_kk: values.occupationKk,
    p_source_title: values.sourceTitle, p_source_url: values.sourceUrl, p_source_author: values.sourceAuthor,
    p_source_publisher: values.sourcePublisher, p_source_license: values.sourceLicense,
  });
  if (error) return { error: error.code === "23505" ? "Такая личность уже существует" : "Не удалось сохранить черновик" };
  revalidatePath("/admin");
  revalidatePath("/admin/people");
  redirect("/admin/people?created=1");
}

export async function updatePersonDraft(_state: PersonFormState, data: FormData): Promise<PersonFormState> {
  await requireAdmin();
  const values = readPersonFields(data);
  const validationError = validatePersonFields(values);
  if (validationError) return { error: validationError };
  const recordId = field(data, "record_id");
  const sourceId = field(data, "source_id");
  const locationRu = field(data, "location_ru");
  const locationKk = field(data, "location_kk");
  const locationPrecision = field(data, "location_precision");
  const longitudeValue = field(data, "longitude");
  const latitudeValue = field(data, "latitude");
  const longitude = longitudeValue ? Number(longitudeValue) : Number.NaN;
  const latitude = latitudeValue ? Number(latitudeValue) : Number.NaN;
  if (!recordId || !sourceId) return { error: "Не удалось определить личность или источник" };
  if (!locationRu || !locationKk) return { error: "Укажите название места на двух языках" };
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return { error: "Выберите точку на карте" };
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return { error: "Выберите точку на карте" };
  if (!(locationPrecision === "point" || locationPrecision === "approximate")) return { error: "Выберите точность местоположения" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_person_draft", {
    p_record_id: recordId, p_source_id: sourceId, p_title_ru: values.titleRu, p_title_kk: values.titleKk,
    p_summary_ru: values.summaryRu, p_summary_kk: values.summaryKk, p_biography_ru: values.biographyRu,
    p_biography_kk: values.biographyKk, p_category: values.category, p_birth_year: values.birthYear,
    p_death_year: values.deathYear, p_occupation_ru: values.occupationRu, p_occupation_kk: values.occupationKk,
    p_source_title: values.sourceTitle, p_source_url: values.sourceUrl, p_source_author: values.sourceAuthor,
    p_source_publisher: values.sourcePublisher, p_source_license: values.sourceLicense, p_location_ru: locationRu,
    p_location_kk: locationKk, p_longitude: longitude, p_latitude: latitude, p_location_precision: locationPrecision,
  });
  if (error) {
    if (error.code === "P0002") return { error: "Черновик личности или его источник не найден" };
    return { error: "Не удалось обновить черновик. Проверьте данные и повторите попытку" };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/people");
  revalidatePath(`/admin/people/${recordId}`);
  redirect(`/admin/people/${recordId}?saved=1`);
}

export async function changePersonStatus(_state: PersonWorkflowState, data: FormData): Promise<PersonWorkflowState> {
  await requireAdmin();
  const recordId = field(data, "record_id");
  const targetStatus = field(data, "target_status");
  if (!recordId || !["draft", "verified", "published"].includes(targetStatus)) return { error: "Не удалось определить действие для личности" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_person_status", { p_record_id: recordId, p_target_status: targetStatus });
  if (error) {
    if (error.code === "23514") return { error: "Для проверки и публикации заполните биографию, источник и основную точку на карте" };
    if (error.code === "22023") return { error: "Этот переход между статусами недоступен" };
    return { error: "Не удалось изменить статус личности" };
  }
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/people");
  revalidatePath(`/admin/people/${recordId}`);
  redirect(`/admin/people/${recordId}?status=${targetStatus}`);
}
