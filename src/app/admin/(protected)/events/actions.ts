"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export type EventFormState = {
  error: string | null;
};

export type EventWorkflowState = {
  error: string | null;
};

type EventFields = {
  titleRu: string;
  titleKk: string;
  summaryRu: string;
  summaryKk: string;
  descriptionRu: string;
  descriptionKk: string;
  significanceRu: string;
  significanceKk: string;
  category: string;
  datePrecision: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceAuthor: string;
  sourcePublisher: string;
  sourceLicense: string;
  startYear: number;
  endYear: number | null;
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

function readEventFields(formData: FormData): EventFields {
  const endYearValue = field(formData, "end_year");

  return {
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
    startYear: Number(field(formData, "start_year")),
    endYear: endYearValue ? Number(endYearValue) : null,
  };
}

function validateEventFields(values: EventFields) {
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

  if (required.some((value) => !value)) return "Заполните все обязательные поля";

  if (!Number.isInteger(values.startYear) || values.startYear < 1900 || values.startYear > 2000) {
    return "Год начала должен быть в диапазоне 1900–2000";
  }

  if (values.endYear !== null && (!Number.isInteger(values.endYear) || values.endYear < values.startYear || values.endYear > 2000)) {
    return "Год окончания должен быть не раньше начала и не позже 2000 года";
  }

  if (values.datePrecision === "range" && values.endYear === null) {
    return "Для диапазона укажите год окончания";
  }

  try {
    const sourceUrl = new URL(values.sourceUrl);
    if (!(sourceUrl.protocol === "http:" || sourceUrl.protocol === "https:")) {
      return "Источник должен содержать корректную ссылку HTTP или HTTPS";
    }
  } catch {
    return "Источник должен содержать корректную ссылку";
  }

  return null;
}

export async function createEventDraft(
  _state: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();
  const values = readEventFields(formData);
  const validationError = validateEventFields(values);

  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_event_draft", {
    p_slug: slugify(values.titleRu, values.startYear),
    p_title_ru: values.titleRu,
    p_title_kk: values.titleKk,
    p_summary_ru: values.summaryRu,
    p_summary_kk: values.summaryKk,
    p_description_ru: values.descriptionRu,
    p_description_kk: values.descriptionKk,
    p_category: values.category,
    p_start_year: values.startYear,
    p_end_year: values.endYear,
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
    if (error.code === "23505") return { error: "Событие с таким названием и годом уже существует" };
    return { error: "Не удалось сохранить черновик. Проверьте данные и повторите попытку" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  redirect("/admin/events?created=1");
}

export async function updateEventDraft(
  _state: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();
  const values = readEventFields(formData);
  const validationError = validateEventFields(values);

  if (validationError) return { error: validationError };

  const recordId = field(formData, "record_id");
  const sourceId = field(formData, "source_id");
  const locationRu = field(formData, "location_ru");
  const locationKk = field(formData, "location_kk");
  const locationPrecision = field(formData, "location_precision");
  const longitudeValue = field(formData, "longitude");
  const latitudeValue = field(formData, "latitude");
  const longitude = longitudeValue ? Number(longitudeValue) : Number.NaN;
  const latitude = latitudeValue ? Number(latitudeValue) : Number.NaN;

  if (!recordId || !sourceId) return { error: "Не удалось определить событие или источник" };
  if (!locationRu || !locationKk) return { error: "Укажите название места на двух языках" };
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { error: "Выберите точку события на карте" };
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { error: "Выберите точку события на карте" };
  }
  if (!(locationPrecision === "point" || locationPrecision === "approximate")) {
    return { error: "Выберите точность местоположения" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_event_draft", {
    p_record_id: recordId,
    p_source_id: sourceId,
    p_title_ru: values.titleRu,
    p_title_kk: values.titleKk,
    p_summary_ru: values.summaryRu,
    p_summary_kk: values.summaryKk,
    p_description_ru: values.descriptionRu,
    p_description_kk: values.descriptionKk,
    p_category: values.category,
    p_start_year: values.startYear,
    p_end_year: values.endYear,
    p_date_precision: values.datePrecision,
    p_significance_ru: values.significanceRu,
    p_significance_kk: values.significanceKk,
    p_source_title: values.sourceTitle,
    p_source_url: values.sourceUrl,
    p_source_author: values.sourceAuthor,
    p_source_publisher: values.sourcePublisher,
    p_source_license: values.sourceLicense,
    p_location_ru: locationRu,
    p_location_kk: locationKk,
    p_longitude: longitude,
    p_latitude: latitude,
    p_location_precision: locationPrecision,
  });

  if (error) {
    if (error.code === "P0002") return { error: "Черновик события или его источник не найден" };
    return { error: "Не удалось обновить черновик. Проверьте данные и повторите попытку" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${recordId}`);
  redirect(`/admin/events/${recordId}?saved=1`);
}

export async function changeEventStatus(
  _state: EventWorkflowState,
  formData: FormData,
): Promise<EventWorkflowState> {
  await requireAdmin();
  const recordId = field(formData, "record_id");
  const targetStatus = field(formData, "target_status");

  if (!recordId || !["draft", "verified", "published"].includes(targetStatus)) {
    return { error: "Не удалось определить действие для события" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_event_status", {
    p_record_id: recordId,
    p_target_status: targetStatus,
  });

  if (error) {
    if (error.code === "23514") {
      return { error: "Для проверки и публикации заполните источник, период и основную точку на карте" };
    }
    if (error.code === "22023") {
      return { error: "Этот переход между статусами недоступен" };
    }
    return { error: "Не удалось изменить статус события" };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${recordId}`);
  redirect(`/admin/events/${recordId}?status=${targetStatus}`);
}
