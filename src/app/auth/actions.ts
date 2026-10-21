"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function authUrl(key: "error" | "message", value: string, next?: string) {
  const params = new URLSearchParams({ [key]: value });
  if (next?.startsWith("/") && !next.startsWith("//")) params.set("next", next);
  return `/auth?${params.toString()}`;
}

function safeNext(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/profile";
}

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const next = safeNext(formData.get("next"));

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    redirect(authUrl("error", "Введите электронную почту и пароль", next));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

  if (error) redirect(authUrl("error", "Неверная электронная почта или пароль", next));
  redirect(next);
}

export async function register(formData: FormData) {
  const displayName = formData.get("displayName");
  const email = formData.get("email");
  const password = formData.get("password");
  const next = safeNext(formData.get("next"));

  if (typeof displayName !== "string" || displayName.trim().length < 2 || displayName.trim().length > 80) {
    redirect(authUrl("error", "Укажите имя длиной от 2 до 80 символов", next));
  }

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || password.length < 8) {
    redirect(authUrl("error", "Введите почту и пароль не короче 8 символов", next));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { display_name: displayName.trim(), preferred_language: "ru" },
      emailRedirectTo: `https://tarihline.vercel.app/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) redirect(authUrl("error", "Не удалось создать аккаунт. Возможно, эта почта уже используется", next));
  if (data.session) redirect(next);
  redirect(authUrl("message", "Проверьте почту и подтвердите регистрацию", next));
}
