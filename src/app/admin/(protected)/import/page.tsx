import Link from "next/link";
import { CsvImportForm } from "@/components/admin/csv-import-form";
import { createClient } from "@/lib/supabase/server";

const fields = [
  ["type", "Да", "event для события или person для личности"],
  ["title_ru", "Да", "Название события или имя личности"],
  ["description_ru", "Да", "Полное описание или биография"],
  ["year", "Да", "Год события или рождения"],
  ["end_year", "Нет", "Год окончания или смерти"],
  ["latitude", "Да", "Широта от −90 до 90"],
  ["longitude", "Да", "Долгота от −180 до 180"],
  ["location_ru", "Да", "Название места"],
  ["title_kk", "Нет", "Название на казахском"],
  ["description_kk", "Нет", "Описание на казахском"],
  ["category", "Нет", "Категория записи"],
  ["summary_ru, summary_kk", "Нет", "Краткое описание"],
  ["location_kk", "Нет", "Название места на казахском"],
  ["occupation_ru, occupation_kk", "Нет", "Род деятельности личности"],
  ["significance_ru, significance_kk", "Нет", "Значение события"],
  ["source_title", "Нет", "Название источника"],
  ["source_url", "Нет", "Ссылка на источник"],
  ["source_author", "Нет", "Автор источника"],
  ["source_publisher", "Нет", "Издатель"],
  ["source_license", "Нет", "Лицензия"],
];

export default async function ImportPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("import_jobs")
    .select("id,filename,status,total_rows,imported_rows,rejected_rows,created_at,import_errors(row_number,message)")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <div>
          <span className="admin-kicker">Массовое добавление</span>
          <h1>Импорт CSV</h1>
          <p>Строки сразу публикуются и появляются на карте. Проверка редактором для MVP не требуется.</p>
        </div>
        <Link className="admin-map-link" href="/templates/tarihline-import.csv" download>Скачать шаблон</Link>
      </header>

      <section className="admin-import-layout">
        <div>
          <CsvImportForm />
          <div className="admin-import-note">
            <strong>Как появляются точки</strong>
            <p>Для маркера нужны latitude и longitude. Поля year и end_year определяют, в какой период точка видна на таймлайне.</p>
          </div>
        </div>

        <section className="admin-import-fields" aria-labelledby="fields-title">
          <h2 id="fields-title">Столбцы таблицы</h2>
          <div className="admin-import-table-wrap">
            <table>
              <thead><tr><th>Столбец</th><th>Обязателен</th><th>Содержание</th></tr></thead>
              <tbody>
                {fields.map(([name, required, description]) => (
                  <tr key={name}><td><code>{name}</code></td><td>{required}</td><td>{description}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>Если казахские поля не заполнены, временно используется русский текст. Краткое описание, категория и служебные поля создаются автоматически.</p>
        </section>
      </section>

      <section className="admin-import-history" aria-labelledby="history-title">
        <h2 id="history-title">Последние загрузки</h2>
        {jobs?.length ? (
          <div className="admin-import-jobs">
            {jobs.map((job) => (
              <article key={job.id}>
                <div><strong>{job.filename}</strong><span>{new Date(job.created_at).toLocaleString("ru-RU")}</span></div>
                <div><span>Добавлено: {job.imported_rows}</span><span>Отклонено: {job.rejected_rows}</span></div>
                {job.import_errors?.length ? (
                  <ul>{job.import_errors.slice(0, 5).map((error) => <li key={`${error.row_number}-${error.message}`}>Строка {error.row_number}: {error.message}</li>)}</ul>
                ) : null}
              </article>
            ))}
          </div>
        ) : <p className="admin-import-empty">Импортов пока не было.</p>}
      </section>
    </div>
  );
}
