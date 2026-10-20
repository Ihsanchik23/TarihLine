import { HistoryExplorer } from "@/components/history/history-explorer";
import { getHistoryData } from "@/lib/history";

export default async function Home() {
  const data = await getHistoryData();

  return <HistoryExplorer records={data.records} relations={data.relations} prototype={data.prototype} />;
}
