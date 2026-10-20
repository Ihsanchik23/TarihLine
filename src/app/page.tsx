import { HistoryExplorer } from "@/components/history/history-explorer";
import { getHistoryData } from "@/lib/history";

export default async function Home({ searchParams }: { searchParams: Promise<{ year?: string; record?: string }> }) {
  const params = await searchParams;
  const data = await getHistoryData();
  const parsedYear = Number(params.year);
  const initialYear = Number.isInteger(parsedYear) ? Math.min(2000, Math.max(1900, parsedYear)) : undefined;

  return <HistoryExplorer records={data.records} relations={data.relations} mapLayers={data.mapLayers} initialYear={initialYear} initialRecordId={params.record} />;
}
