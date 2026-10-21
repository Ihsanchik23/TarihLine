"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function routeUrl(routeId: string, key: "error" | "message", value: string) {
  return `/routes/${routeId}?${new URLSearchParams({ [key]: value }).toString()}`;
}

async function authenticatedClient(next = "/routes") {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect(`/auth?next=${encodeURIComponent(next)}`);
  return { supabase, userId };
}

export async function createRoute(formData: FormData) {
  const titleValue = formData.get("title");
  const descriptionValue = formData.get("description");
  const title = typeof titleValue === "string" ? titleValue.trim() : "";
  const description = typeof descriptionValue === "string" ? descriptionValue.trim() : "";
  const requestedIds = [...new Set(formData.getAll("recordIds").filter((value): value is string => typeof value === "string"))];

  if (!title || title.length > 120 || description.length > 1000) {
    redirect(`/routes?${new URLSearchParams({ error: "Проверьте название и описание маршрута" }).toString()}`);
  }

  const { supabase, userId } = await authenticatedClient();
  const { data: route, error } = await supabase.from("routes").insert({
    user_id: userId,
    title,
    description: description || null,
    visibility: "private",
  }).select("id").single();

  if (error || !route) redirect(`/routes?${new URLSearchParams({ error: "Не удалось создать маршрут" }).toString()}`);

  if (requestedIds.length) {
    const { data: records } = await supabase.from("historical_records").select("id").in("id", requestedIds).eq("record_type", "event").eq("status", "published");
    const allowedIds = new Set((records ?? []).map((record) => record.id));
    const recordIds = requestedIds.filter((id) => allowedIds.has(id));
    if (recordIds.length) {
      const { error: itemsError } = await supabase.from("route_items").insert(recordIds.map((recordId, index) => ({
        route_id: route.id,
        record_id: recordId,
        position: (index + 1) * 1000,
      })));
      if (itemsError) {
        await supabase.from("routes").delete().eq("id", route.id).eq("user_id", userId);
        redirect(`/routes?${new URLSearchParams({ error: "Не удалось добавить события в маршрут" }).toString()}`);
      }
    }
  }

  revalidatePath("/routes");
  revalidatePath("/profile");
  redirect(routeUrl(route.id, "message", "Маршрут создан"));
}

export async function updateRoute(formData: FormData) {
  const routeId = formData.get("routeId");
  const titleValue = formData.get("title");
  const descriptionValue = formData.get("description");
  if (typeof routeId !== "string") return;

  const title = typeof titleValue === "string" ? titleValue.trim() : "";
  const description = typeof descriptionValue === "string" ? descriptionValue.trim() : "";
  if (!title || title.length > 120 || description.length > 1000) redirect(routeUrl(routeId, "error", "Проверьте название и описание"));

  const { supabase, userId } = await authenticatedClient(`/routes/${routeId}`);
  const { error } = await supabase.from("routes").update({ title, description: description || null }).eq("id", routeId).eq("user_id", userId);
  if (error) redirect(routeUrl(routeId, "error", "Не удалось сохранить маршрут"));

  revalidatePath("/routes");
  revalidatePath(`/routes/${routeId}`);
  revalidatePath(`/routes/${routeId}/map`);
  redirect(routeUrl(routeId, "message", "Маршрут сохранён"));
}

export async function deleteRoute(formData: FormData) {
  const routeId = formData.get("routeId");
  if (typeof routeId !== "string") return;
  const { supabase, userId } = await authenticatedClient(`/routes/${routeId}`);
  await supabase.from("routes").delete().eq("id", routeId).eq("user_id", userId);
  revalidatePath("/routes");
  revalidatePath("/profile");
  redirect("/routes?message=Маршрут+удалён");
}

export async function addRouteItem(formData: FormData) {
  const routeId = formData.get("routeId");
  const recordId = formData.get("recordId");
  const commentValue = formData.get("authorComment");
  if (typeof routeId !== "string" || typeof recordId !== "string") return;
  const authorComment = typeof commentValue === "string" ? commentValue.trim() : "";
  if (authorComment.length > 1000) redirect(routeUrl(routeId, "error", "Комментарий слишком длинный"));

  const { supabase, userId } = await authenticatedClient(`/routes/${routeId}`);
  const [{ data: route }, { data: record }, { data: lastItem }] = await Promise.all([
    supabase.from("routes").select("id").eq("id", routeId).eq("user_id", userId).maybeSingle(),
    supabase.from("historical_records").select("id").eq("id", recordId).eq("record_type", "event").eq("status", "published").maybeSingle(),
    supabase.from("route_items").select("position").eq("route_id", routeId).order("position", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!route || !record) redirect(routeUrl(routeId, "error", "Маршрут или событие недоступны"));

  const { error } = await supabase.from("route_items").insert({
    route_id: routeId,
    record_id: recordId,
    position: (lastItem?.position ?? 0) + 1000,
    author_comment: authorComment || null,
  });
  if (error?.code === "23505") redirect(routeUrl(routeId, "error", "Это событие уже есть в маршруте"));
  if (error) redirect(routeUrl(routeId, "error", "Не удалось добавить событие"));

  revalidatePath(`/routes/${routeId}`);
  revalidatePath(`/routes/${routeId}/map`);
  redirect(routeUrl(routeId, "message", "Событие добавлено"));
}

export async function updateRouteItemComment(formData: FormData) {
  const routeId = formData.get("routeId");
  const itemId = formData.get("itemId");
  const commentValue = formData.get("authorComment");
  if (typeof routeId !== "string" || typeof itemId !== "string") return;
  const authorComment = typeof commentValue === "string" ? commentValue.trim() : "";
  if (authorComment.length > 1000) redirect(routeUrl(routeId, "error", "Комментарий слишком длинный"));

  const { supabase } = await authenticatedClient(`/routes/${routeId}`);
  const { error } = await supabase.from("route_items").update({ author_comment: authorComment || null }).eq("id", itemId).eq("route_id", routeId);
  if (error) redirect(routeUrl(routeId, "error", "Не удалось сохранить комментарий"));

  revalidatePath(`/routes/${routeId}`);
  revalidatePath(`/routes/${routeId}/map`);
  redirect(routeUrl(routeId, "message", "Комментарий сохранён"));
}

export async function removeRouteItem(formData: FormData) {
  const routeId = formData.get("routeId");
  const itemId = formData.get("itemId");
  if (typeof routeId !== "string" || typeof itemId !== "string") return;
  const { supabase } = await authenticatedClient(`/routes/${routeId}`);
  await supabase.from("route_items").delete().eq("id", itemId).eq("route_id", routeId);
  revalidatePath(`/routes/${routeId}`);
  revalidatePath(`/routes/${routeId}/map`);
}

export async function moveRouteItem(formData: FormData) {
  const routeId = formData.get("routeId");
  const itemId = formData.get("itemId");
  const direction = formData.get("direction");
  if (typeof routeId !== "string" || typeof itemId !== "string" || (direction !== "up" && direction !== "down")) return;
  const { supabase } = await authenticatedClient(`/routes/${routeId}`);
  await supabase.rpc("move_route_item", { p_item_id: itemId, p_direction: direction });
  revalidatePath(`/routes/${routeId}`);
  revalidatePath(`/routes/${routeId}/map`);
}
