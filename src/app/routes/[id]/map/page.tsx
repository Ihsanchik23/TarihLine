import { notFound, redirect } from "next/navigation";
import { getHistoryData } from "@/lib/history";
import { createClient } from "@/lib/supabase/server";
import { RouteJourney } from "@/components/routes/route-journey";

export const dynamic = "force-dynamic";

export default async function RouteMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect(`/auth?next=${encodeURIComponent(`/routes/${id}/map`)}`);

  const [{ data: route }, { data: rawItems }, history] = await Promise.all([
    supabase.from("routes").select("id, title, description").eq("id", id).eq("user_id", userId).maybeSingle(),
    supabase.from("route_items").select("id, record_id, position, author_comment").eq("route_id", id).order("position"),
    getHistoryData(),
  ]);
  if (!route) notFound();

  const recordById = new Map(history.records.filter((record) => record.type === "event").map((record) => [record.id, record]));
  const items = (rawItems ?? []).flatMap((item) => {
    const record = recordById.get(item.record_id);
    return record ? [{ id: item.id, authorComment: item.author_comment, record }] : [];
  });
  if (!items.length) redirect(`/routes/${route.id}`);

  return <RouteJourney route={route} items={items} mapLayers={history.mapLayers} />;
}
