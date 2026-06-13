"use server";

import { z } from "zod";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { isLocked, specialLocked } from "@/lib/scoring";
import { MatchRow } from "@/lib/types";

const predSchema = z.object({
  match_id: z.coerce.number().int().positive(),
  pred_home: z.coerce.number().int().min(0).max(30),
  pred_away: z.coerce.number().int().min(0).max(30),
});

export async function savePredictionLive(
  input: { match_id: number; pred_home: number; pred_away: number }
): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Sessão expirada" };
  const parsed = predSchema.safeParse(input);
  if (!parsed.success) return { error: "Palpite inválido" };

  const { data: match } = await supabase.from("matches").select("*").eq("id", parsed.data.match_id).single();
  if (!match || isLocked((match as MatchRow).kickoff_at)) return { error: "Jogo já começou" };

  const { error } = await supabase.from("predictions").upsert({
    user_id: session.id, match_id: parsed.data.match_id,
    pred_home: parsed.data.pred_home, pred_away: parsed.data.pred_away,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "Não foi possível salvar" };
  return { ok: true };
}

export async function saveSpecialLive(
  input: { champion: string; top_scorer: string }
): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Sessão expirada" };
  const { data: matches } = await supabase.from("matches").select("*");
  if (specialLocked((matches ?? []) as MatchRow[])) return { error: "Mercado fechado" };

  const { error } = await supabase.from("special_predictions").upsert({
    user_id: session.id,
    champion: String(input.champion || "").trim(),
    top_scorer: String(input.top_scorer || "").trim(),
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "Não foi possível salvar" };
  return { ok: true };
}

const resultSchema = z.object({
  match_id: z.coerce.number().int().positive(),
  result_home: z.union([z.literal(null), z.coerce.number().int().min(0).max(30)]),
  result_away: z.union([z.literal(null), z.coerce.number().int().min(0).max(30)]),
});

export async function saveResultLive(
  input: { match_id: number; result_home: number | null; result_away: number | null }
): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { error: "Sem permissão" };
  const parsed = resultSchema.safeParse(input);
  if (!parsed.success) return { error: "Resultado inválido" };

  const { error } = await supabase.from("matches").update({
    result_home: parsed.data.result_home, result_away: parsed.data.result_away,
  }).eq("id", parsed.data.match_id);
  if (error) return { error: "Não foi possível salvar" };
  return { ok: true };
}
