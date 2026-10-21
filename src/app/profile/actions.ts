"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function profileUrl(key: "error" | "message", value: string) {
  return `/profile?${new URLSearchParams({ [key]: value }).toString()}`;
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/auth?next=/profile");
  return { supabase, userId };
}

export async function updateProfile(formData: FormData) {
  const displayName = formData.get("displayName");
  const usernameValue = formData.get("username");
  const preferredLanguage = formData.get("preferredLanguage");

  if (typeof displayName !== "string" || displayName.trim().length < 2 || displayName.trim().length > 80) {
    redirect(profileUrl("error", "Имя должно содержать от 2 до 80 символов"));
  }

  const username = typeof usernameValue === "string" ? usernameValue.trim().toLowerCase() : "";
  if (username && !/^[a-z0-9][a-z0-9_-]{2,31}$/.test(username)) {
    redirect(profileUrl("error", "Логин: 3–32 символа, латинские буквы, цифры, _ или -"));
  }

  const { supabase, userId } = await authenticatedClient();
  const { error } = await supabase.from("profiles").update({
    display_name: displayName.trim(),
    username: username || null,
    preferred_language: preferredLanguage === "kk" ? "kk" : "ru",
  }).eq("id", userId);

  if (error?.code === "23505") redirect(profileUrl("error", "Этот логин уже занят"));
  if (error) redirect(profileUrl("error", "Не удалось сохранить профиль"));

  revalidatePath("/profile");
  redirect(profileUrl("message", "Профиль сохранён"));
}

export async function toggleBookmark(formData: FormData) {
  const recordId = formData.get("recordId");
  const slug = formData.get("slug");
  if (typeof recordId !== "string" || typeof slug !== "string") return;

  const { supabase, userId } = await authenticatedClient();
  const { data } = await supabase.from("bookmarks").select("record_id").eq("user_id", userId).eq("record_id", recordId).maybeSingle();

  if (data) {
    await supabase.from("bookmarks").delete().eq("user_id", userId).eq("record_id", recordId);
  } else {
    await supabase.from("bookmarks").insert({ user_id: userId, record_id: recordId });
  }

  revalidatePath("/profile");
  revalidatePath(`/catalog/${slug}`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
