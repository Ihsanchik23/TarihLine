"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export type EventFormState = {
  error: string | null;
};

const transliteration: Record<string, string> = {
  а: "a", ә: "a", б: "b", в: "v", г: "g", ғ: "g", д: "d", е: "e", ё: "e",
  ж: "zh", з: "z", и: "i", й: "i", к: "k", қ: "q", л: "l", м: "m", н: "n",
  ң: "n", о: "o", ө: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ұ: "u",
  ү: "u", ф: "f", х: "h", һ: "h", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ъ: "", ы: "y", і: "i", ь: "", э: "e", ю: "yu", я: "ya",
};

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string, year: number) {
  const transliterated = [...value.toLowerCase()]
    .map((character) => transliteration[character] ?? character)
    .join("");

  const base = transliterated
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `${base || "event"}-${year}`;
}

export async function createEventDraft(
  _state: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();

  const startYear = Number(field(formData, "start_year"));
  const endYearValue = field(formData, "end_year");
  const endYear = endYearValue ? Number(endYearValue) : null;
  const values = {
    titleRu: field(formData, "title_ru"),
    titleKk: field(formData, "title_kk"),
    summaryRu: field(formData, "summary_ru"),
    summaryKk: field(formData, "summary_kk"),
    descriptionRu: field(formData, "description_ru"),
    descriptionKk: field(formData, "description_kk"),
    significanceRu: field(formData, "significance_ru"),
    significanceKk: field(formData, "significance_kk"),
    category: field(formData, "category"),
    datePrecision: field(formData, "date_precision"),
    sourceTitle: field(formData, "source_title"),
    sourceUrl: field(formData, "source_url"),
    sourceAuthor: field(formData, "source_author"),
    sourcePublisher: field(formData, "source_publisher"),
    sourceLicense: field(formData, "source_license"),
  };

  const required = [
    values.titleRu,
    values.titleKk,
    values.summaryRu,
    values.summaryKk,
    values.descriptionRu,
    values.descriptionKk,
    values.significanceRu,
    values.significanceKk,
    values.category,
    values.datePrecision,
    values.sourceTitle,
    values.sourceUrl,
    values.sourceLicense,
  ];

  if (required.some((value) => !value)) {
    return { error: "Заполните все обязательные поля" };
  }

  if (!Number.isInteger(startYear) || startYear < 1900 || startYear > 2000) {
    return { error: "Год начала должен быть в диапазоне 1900–2000" };
  }

  if (endYear !== null && (!Number.isInteger(endYear) || endYear < startYear || endYear > 2000)) {
    return { error: "Год окончания должен быть не раньше начала и не позже 2000 года" };
  }

  if (values.datePrecision === "range" && endYear === null) {
    return { error: "Для диапазона укажите год окончания" };
  }

  try {
    const sourceUrl = new URL(values.sourceUrl);
    if (!(["http:", "https:"] as string[]).includes(sourceUrl.protocol)) {
      return { error: "Источник должен содержать корректную ссылку HTTP или HTTPS" };
    }
  } catch {
    return { error: "Источник должен содержать корректную ссылку" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_event_draft", {
    p_slug: slugify(values.titleRu, startYear),
    p_title_ru: values.titleRu,
    p_title_kk: values.titleKk,
    p_summary_ru: values.summaryRu,
    p_summary_kk: values.summaryKk,
    p_description_ru: values.descriptionRu,
    p_description_kk: values.descriptionKk,
    p_category: values.category,
    p_start_year: startYear,
    p_end_year: endYear,
    p_date_precision: values.datePrecision,
    p_significance_ru: values.significanceRu,
    p_significance_kk: values.significanceKk,
    p_source_title: values.sourceTitle,
    p_source_url: values.sourceUrl,
    p_source_author: values.sourceAuthor,
    p_source_publisher: values.sourcePublisher,
    p_source_license: values.sourceLicense,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Событие с таким названием и годом уже существует" };
    }
    return { error: "Не удалось сохранить черновик. Проверьте данные и повторите попытку" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  redirect("/admin/events?created=1");
}
