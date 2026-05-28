"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { comparePassword, createSession, clearSession, hashPassword, ensureAdminSeeded } from "@/lib/auth";
import { supabase } from "@/lib/db";

const credentialsSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/, "Use apenas letras, números, _, . ou -"),
  password: z.string().min(4).max(100),
});

export async function loginAction(_: unknown, formData: FormData) {
  await ensureAdminSeeded();
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const username = parsed.data.username.trim().toLowerCase();
  const { data: user } = await supabase.from("users").select("*").eq("username", username).maybeSingle();
  if (!user) return { error: "Usuário ou senha inválidos" };

  const ok = await comparePassword(parsed.data.password, user.password_hash);
  if (!ok) return { error: "Usuário ou senha inválidos" };

  await createSession(user);
  redirect(user.role === "admin" ? "/admin" : "/dashboard");
}

export async function registerAction(_: unknown, formData: FormData) {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const username = parsed.data.username.trim().toLowerCase();
  const { data: existing } = await supabase.from("users").select("id").eq("username", username).maybeSingle();
  if (existing) return { error: "Esse nome de usuário já existe" };

  const { data: user, error } = await supabase
    .from("users")
    .insert({ username, password_hash: await hashPassword(parsed.data.password), role: "user" })
    .select("*")
    .single();

  if (error || !user) return { error: "Não foi possível cadastrar" };
  await createSession(user);
  redirect("/dashboard");
}

export async function logoutAction() {
  clearSession();
  redirect("/login");
}
