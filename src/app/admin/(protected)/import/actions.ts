"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { invalidateHistoryCache } from "@/lib/history-cache";
import { parseCsv, type CsvRow } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

export type ImportState = {
  error: string | null;
  imported: number;
  rejected: number;
  jobId: string | null;
};

const requiredHeaders = [
  "type",
  "title_ru",
  "description_ru",
  "year",
  "latitude",
  "longitude",
  "location_ru",
];

const transliteration: Record<string, string> = {
  а: "a", ә: "a", б: "b", в: "v", г: "g", ғ: "g", д: "d", е: "e", ё: "e",
  ж: "zh", з: "z", и: "i", й: "i", к: "k", қ: "q", л: "l", м: "m", н: "n",
  ң: "n", о: "o", ө: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ұ: "u",
  ү: "u", ф: "f", х: "h", һ: "h", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ъ: "", ы: "y", і: "i", ь: "", э: "e", ю: "yu", я: "ya",
};

function slugify(value: string, year: number) {
  const transliterated = [...value.toLowerCase()]
    .map((character) => transliteration[character] ?? character)
    .join("");
  const base = transliterated
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return `${base || "record"}-${year}-${randomUUID().slice(0, 8)}`;
}

function shorten(value: string) {
  if (value.length <= 240) return value;
  return `${value.slice(0, 237).trimEnd()}…`;
}

function numberValue(row: CsvRow, name: string) {
  const value = Number(row[name]);
  return Number.isFinite(value) ? value : null;
}

function prepareRow(row: CsvRow) {
  const recordType = row.type.toLowerCase();
  if (!(recordType === "event" || recordType === "person")) {
    throw new Error("type должен быть event или person");
  }

  const titleRu = row.title_ru.trim();
  const descriptionRu = row.description_ru.trim();
  const locationRu = row.location_ru.trim();
  if (!titleRu || !descriptionRu || !locationRu) throw new Error("Не заполнено обязательное текстовое поле");

  const startYear = numberValue(row, "year");
  const endYear = row.end_year ? numberValue(row, "end_year") : null;
  const latitude = numberValue(row, "latitude");
  const longitude = numberValue(row, "longitude");

  if (startYear === null || !Number.isInteger(startYear)) throw new Error("year должен быть целым числом");
  if (recordType === "event" && (startYear < 1900 || startYear > 2000)) throw new Error("Год события должен быть в диапазоне 1900–2000");
  if (recordType === "person" && (startYear < 1800 || startYear > 2000)) throw new Error("Год рождения должен быть в диапазоне 1800–2000");
  if (endYear !== null && (!Number.isInteger(endYear) || endYear < startYear)) throw new Error("end_year должен быть не раньше year");
  if (recordType === "event" && endYear !== null && endYear > 2000) throw new Error("Год окончания события должен быть не позже 2000");
  if (recordType === "person" && endYear !== null && endYear > 2026) throw new Error("Год смерти должен быть не позже 2026");
  if (latitude === null || latitude < -90 || latitude > 90) throw new Error("latitude должна быть от -90 до 90");
  if (longitude === null || longitude < -180 || longitude > 180) throw new Error("longitude должна быть от -180 до 180");

  if (row.source_url) {
    try {
      const sourceUrl = new URL(row.source_url);
      if (!(sourceUrl.protocol === "http:" || sourceUrl.protocol === "https:")) throw new Error();
    } catch {
      throw new Error("source_url должен содержать корректную ссылку HTTP или HTTPS");
    }
  }

  if (row.source_url && !row.source_title) throw new Error("Для source_url укажите source_title");

  const titleKk = row.title_kk || titleRu;
  const descriptionKk = row.description_kk || descriptionRu;
  const summaryRu = row.summary_ru || shorten(descriptionRu);
  const summaryKk = row.summary_kk || shorten(descriptionKk);
  const occupationRu = row.occupation_ru || "Историческая личность";
  const occupationKk = row.occupation_kk || occupationRu;
  const significanceRu = row.significance_ru || summaryRu;
  const significanceKk = row.significance_kk || summaryKk;

  return {
    record_type: recordType,
    slug: slugify(titleRu, startYear),
    title_ru: titleRu,
    title_kk: titleKk,
    summary_ru: summaryRu,
    summary_kk: summaryKk,
    description_ru: descriptionRu,
    description_kk: descriptionKk,
    category: row.category || "history",
    start_year: startYear,
    end_year: endYear === null ? "" : endYear,
    latitude,
    longitude,
    location_ru: locationRu,
    location_kk: row.location_kk || locationRu,
    occupation_ru: occupationRu,
    occupation_kk: occupationKk,
    significance_ru: significanceRu,
    significance_kk: significanceKk,
    source_title: row.source_title || "",
    source_url: row.source_url || "",
    source_author: row.source_author || "",
    source_publisher: row.source_publisher || "",
    source_license: row.source_license || "",
  };
}

export async function importCsv(
  _state: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const admin = await requireAdmin();
  const file = formData.get("file");

  if (!(file instanceof File) || !file.size) {
    return { error: "Выберите CSV-файл", imported: 0, rejected: 0, jobId: null };
  }
  if (file.size > 900_000) {
    return { error: "Размер CSV не должен превышать 900 КБ", imported: 0, rejected: 0, jobId: null };
  }

  const text = await file.text();
  let parsed: ReturnType<typeof parseCsv>;
  try {
    parsed = parseCsv(text);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Не удалось прочитать CSV", imported: 0, rejected: 0, jobId: null };
  }

  const missing = requiredHeaders.filter((header) => !parsed.headers.includes(header));
  if (missing.length) {
    return { error: `Не хватает столбцов: ${missing.join(", ")}`, imported: 0, rejected: 0, jobId: null };
  }
  if (parsed.rows.length > 100) {
    return { error: "За один раз можно импортировать не более 100 строк", imported: 0, rejected: 0, jobId: null };
  }

  const checksum = createHash("sha256").update(text).digest("hex");
  const supabase = await createClient();
  const startedAt = new Date().toISOString();
  const { data: job, error: jobError } = await supabase
    .from("import_jobs")
    .insert({
      initiated_by: admin.id,
      filename: file.name.slice(0, 240),
      checksum,
      status: "importing",
      total_rows: parsed.rows.length,
      started_at: startedAt,
    })
    .select("id")
    .single();

  if (jobError) {
    const message = jobError.code === "23505"
      ? "Этот файл уже импортировался. Измените данные или имя содержимого и загрузите снова"
      : "Не удалось создать задание импорта";
    return { error: message, imported: 0, rejected: 0, jobId: null };
  }

  let imported = 0;
  let rejected = 0;

  for (let index = 0; index < parsed.rows.length; index += 1) {
    try {
      const payload = prepareRow(parsed.rows[index]);
      const { error } = await supabase.rpc("import_historical_record", { p_data: payload });
      if (error) throw new Error(error.message);
      imported += 1;
    } catch (error) {
      rejected += 1;
      await supabase.from("import_errors").insert({
        import_job_id: job.id,
        row_number: index + 2,
        error_code: "INVALID_ROW",
        message: error instanceof Error ? error.message.slice(0, 500) : "Неизвестная ошибка строки",
      });
    }
  }

  await supabase
    .from("import_jobs")
    .update({
      status: imported ? "completed" : "failed",
      imported_rows: imported,
      rejected_rows: rejected,
      finished_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  revalidatePath("/");
  invalidateHistoryCache();
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath("/admin/people");
  revalidatePath("/admin/import");

  return { error: null, imported, rejected, jobId: job.id };
}
