"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { isLocked, specialLocked } from "@/lib/scoring";
import { MatchRow } from "@/lib/types";

const matchPredictionSchema = z.object({
  match_id: z.coerce.number().int().positive(),
  pred_home: z.coerce.number().int().min(0).max(30),
  pred_away: z.coerce.number().int().min(0).max(30),
});

export async function savePredictionAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const parsed = matchPredictionSchema.parse(Object.fromEntries(formData));

  const { data: match } = await supabase.from("matches").select("*").eq("id", parsed.match_id).single();
  if (!match || isLocked((match as MatchRow).kickoff_at)) redirect("/dashboard?error=locked");

  await supabase.from("predictions").upsert({
    user_id: session.id,
    match_id: parsed.match_id,
    pred_home: parsed.pred_home,
    pred_away: parsed.pred_away,
    updated_at: new Date().toISOString(),
  });
  redirect("/dashboard?saved=1");
}

export async function saveSpecialAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const champion = String(formData.get("champion") || "").trim();
  const top_scorer = String(formData.get("top_scorer") || "").trim();

  const { data: matches } = await supabase.from("matches").select("*");
  if (specialLocked((matches ?? []) as MatchRow[])) redirect("/dashboard?error=speciallocked");

  await supabase.from("special_predictions").upsert({
    user_id: session.id,
    champion,
    top_scorer,
    updated_at: new Date().toISOString(),
  });
  redirect("/dashboard?saved=1");
}
