"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function loginUrl(message: string) {
  return `/admin/login?error=${encodeURIComponent(message)}`;
}

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    redirect(loginUrl("Введите электронную почту и пароль"));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect(loginUrl("Неверная электронная почта или пароль"));
  }

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (role?.role !== "admin") {
    await supabase.auth.signOut();
    redirect(loginUrl("У этой учётной записи нет доступа администратора"));
  }

  redirect("/admin");
}
