"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession, hashPassword } from "@/lib/auth";
import { supabase } from "@/lib/db";

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");
  return session;
}

const resultSchema = z.object({
  match_id: z.coerce.number().int().positive(),
  result_home: z.union([z.literal(""), z.coerce.number().int().min(0).max(30)]),
  result_away: z.union([z.literal(""), z.coerce.number().int().min(0).max(30)]),
});

export async function saveResultAction(formData: FormData) {
  await requireAdmin();
  const parsed = resultSchema.parse(Object.fromEntries(formData));
  await supabase
    .from("matches")
    .update({
      result_home: parsed.result_home === "" ? null : parsed.result_home,
      result_away: parsed.result_away === "" ? null : parsed.result_away,
    })
    .eq("id", parsed.match_id);
  redirect("/admin?saved=1");
}

const matchSchema = z.object({
  match_no: z.union([z.literal(""), z.coerce.number().int().positive()]),
  stage: z.string().min(1),
  group_name: z.string().optional(),
  home_team: z.string().min(1),
  away_team: z.string().min(1),
  kickoff_at: z.string().min(1),
  venue: z.string().optional(),
});

export async function createMatchAction(formData: FormData) {
  await requireAdmin();
  const parsed = matchSchema.parse(Object.fromEntries(formData));
  await supabase.from("matches").insert({
    match_no: parsed.match_no === "" ? null : parsed.match_no,
    stage: parsed.stage,
    group_name: parsed.group_name || null,
    home_team: parsed.home_team,
    away_team: parsed.away_team,
    kickoff_at: new Date(parsed.kickoff_at).toISOString(),
    venue: parsed.venue || null,
  });
  redirect("/admin?saved=1");
}

export async function saveTournamentWinnersAction(formData: FormData) {
  await requireAdmin();
  const champion = String(formData.get("champion") || "").trim();
  const topScorer = String(formData.get("top_scorer") || "").trim();
  await supabase.from("settings").upsert([
    { key: "champion", value: champion },
    { key: "top_scorer", value: topScorer },
  ]);
  redirect("/admin?saved=1");
}

export async function resetUserPasswordAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("user_id") || "");
  const newPassword = String(formData.get("new_password") || "");
  if (!userId || newPassword.length < 4) redirect("/admin?error=password");
  await supabase.from("users").update({ password_hash: await hashPassword(newPassword) }).eq("id", userId).neq("role", "admin");
  redirect("/admin?saved=1");
}
