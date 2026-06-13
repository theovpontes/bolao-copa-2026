import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { buildRanking } from "@/lib/scoring";
import { MatchRow, PredictionRow, SpecialPredictionRow, UserRow } from "@/lib/types";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [
    { data: matches }, { data: myPredictions }, { data: users },
    { data: allPredictions }, { data: specials }, { data: settings }, { data: mySpecial },
  ] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_at"),
    supabase.from("predictions").select("*").eq("user_id", session.id),
    supabase.from("users").select("*").order("username"),
    supabase.from("predictions").select("*"),
    supabase.from("special_predictions").select("*"),
    supabase.from("settings").select("*"),
    supabase.from("special_predictions").select("*").eq("user_id", session.id).maybeSingle(),
  ]);

  const matchRows = (matches ?? []) as MatchRow[];
  const champion = settings?.find((s) => s.key === "champion")?.value ?? null;
  const topScorer = settings?.find((s) => s.key === "top_scorer")?.value ?? null;

  const ranking = buildRanking({
    users: (users ?? []) as UserRow[], matches: matchRows,
    predictions: (allPredictions ?? []) as PredictionRow[],
    specials: (specials ?? []) as SpecialPredictionRow[], champion, topScorer,
  });

  return (
    <DashboardClient
      session={session} matches={matchRows}
      myPredictions={(myPredictions ?? []) as PredictionRow[]}
      mySpecial={(mySpecial ?? null) as SpecialPredictionRow | null}
      allPredictions={(allPredictions ?? []) as PredictionRow[]}
      users={(users ?? []) as UserRow[]} ranking={ranking}
    />
  );
}
