import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { buildRanking } from "@/lib/scoring";
import { MatchRow, PredictionRow, SpecialPredictionRow, UserRow } from "@/lib/types";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const [{ data: matches }, { data: users }, { data: predictions }, { data: specials }, { data: settings }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_at"),
    supabase.from("users").select("*").order("username"),
    supabase.from("predictions").select("*"),
    supabase.from("special_predictions").select("*"),
    supabase.from("settings").select("*"),
  ]);

  const matchRows = (matches ?? []) as MatchRow[];
  const champion = settings?.find((s) => s.key === "champion")?.value ?? "";
  const topScorer = settings?.find((s) => s.key === "top_scorer")?.value ?? "";

  const ranking = buildRanking({
    users: (users ?? []) as UserRow[], matches: matchRows,
    predictions: (predictions ?? []) as PredictionRow[],
    specials: (specials ?? []) as SpecialPredictionRow[],
    champion: champion || null, topScorer: topScorer || null,
  });

  return (
    <AdminClient session={session} matches={matchRows} users={(users ?? []) as UserRow[]}
      ranking={ranking} champion={champion} topScorer={topScorer} />
  );
}
