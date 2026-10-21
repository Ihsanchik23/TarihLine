import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecordDetail } from "@/components/catalog/record-detail";
import { getHistoryData } from "@/lib/history";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ slug: string }>;
};

async function loadRecord(slug: string) {
  const data = await getHistoryData();
  const record = data.records.find((item) => item.slug === slug);
  if (!record) return null;

  const related = data.relations.flatMap((relation) => {
    if (relation.fromRecordId !== record.id && relation.toRecordId !== record.id) return [];
    const relatedId = relation.fromRecordId === record.id ? relation.toRecordId : relation.fromRecordId;
    const relatedRecord = data.records.find((item) => item.id === relatedId);
    return relatedRecord ? [{ record: relatedRecord, relation }] : [];
  });

  return { record, related };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadRecord(slug);

  if (!result) return { title: "Материал не найден — TarihLine" };

  return {
    title: `${result.record.title.ru} — TarihLine`,
    description: result.record.summary.ru,
  };
}

export default async function RecordPage({ params }: Props) {
  const { slug } = await params;
  const result = await loadRecord(slug);
  if (!result) notFound();

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const [bookmark, notes] = userId
    ? await Promise.all([
      supabase.from("bookmarks").select("record_id").eq("user_id", userId).eq("record_id", result.record.id).maybeSingle(),
      supabase.from("notes").select("id, title, content, created_at, updated_at").eq("user_id", userId).eq("record_id", result.record.id).order("updated_at", { ascending: false }),
    ])
    : [null, null];

  return <RecordDetail record={result.record} related={result.related} notes={notes?.data ?? []} isAuthenticated={Boolean(userId)} isBookmarked={Boolean(bookmark?.data)} />;
}
