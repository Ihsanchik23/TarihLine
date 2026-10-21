export default function Loading() {
  return (
    <main className="page-loading" aria-live="polite" aria-label="Загрузка страницы">
      <div className="page-loading__brand"><span>T</span><strong>TarihLine</strong></div>
      <div className="page-loading__bar"><span /></div>
      <p>Загрузка…</p>
    </main>
  );
}
