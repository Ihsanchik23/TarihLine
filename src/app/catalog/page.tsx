import type { Metadata } from "next";
import { CatalogExplorer } from "@/components/catalog/catalog-explorer";
import { getHistoryData } from "@/lib/history";

export const metadata: Metadata = {
  title: "Каталог исторических материалов — TarihLine",
  description: "Опубликованные события и личности истории Казахстана и мира с поиском по периоду и тематике",
};

export default async function CatalogPage() {
  const data = await getHistoryData();
  return <CatalogExplorer records={data.records} />;
}
