import { MatchRow, PredictionRow, SpecialPredictionRow, UserRow } from "@/lib/types";

export function isLocked(kickoffAt: string) {
  return Date.now() >= new Date(kickoffAt).getTime();
}

function outcome(home: number, away: number) {
  if (home > away) return "H";
  if (home < away) return "A";
  return "D";
}

export function pointsForMatch(match: MatchRow, prediction?: PredictionRow | null) {
  if (!prediction || match.result_home === null || match.result_away === null) return 0;
  if (prediction.pred_home === match.result_home && prediction.pred_away === match.result_away) return 3;
  if (outcome(prediction.pred_home, prediction.pred_away) === outcome(match.result_home, match.result_away)) return 1;
  return 0;
}

export function specialLocked(matches: MatchRow[]) {
  const first = [...matches].sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime())[0];
  if (!first) return false;
  return isLocked(first.kickoff_at);
}

export function pointsForSpecial(prediction: SpecialPredictionRow | undefined, champion: string | null, topScorer: string | null) {
  let points = 0;
  if (champion && prediction?.champion?.trim().toLowerCase() === champion.trim().toLowerCase()) points += 10;
  if (topScorer && prediction?.top_scorer?.trim().toLowerCase() === topScorer.trim().toLowerCase()) points += 10;
  return points;
}

export function buildRanking(params: {
  users: UserRow[];
  matches: MatchRow[];
  predictions: PredictionRow[];
  specials: SpecialPredictionRow[];
  champion: string | null;
  topScorer: string | null;
}) {
  const rows = params.users.map((user) => {
    const userPredictions = params.predictions.filter((p) => p.user_id === user.id);
    const matchPoints = params.matches.reduce((sum, match) => {
      const p = userPredictions.find((item) => item.match_id === match.id);
      return sum + pointsForMatch(match, p);
    }, 0);
    const exactScores = params.matches.filter((match) => {
      const p = userPredictions.find((item) => item.match_id === match.id);
      return p && match.result_home !== null && match.result_away !== null && p.pred_home === match.result_home && p.pred_away === match.result_away;
    }).length;
    const outcomeHits = params.matches.filter((match) => {
      const p = userPredictions.find((item) => item.match_id === match.id);
      return p && match.result_home !== null && match.result_away !== null && outcome(p.pred_home, p.pred_away) === outcome(match.result_home, match.result_away);
    }).length;
    const special = params.specials.find((s) => s.user_id === user.id);
    const specialPoints = pointsForSpecial(special, params.champion, params.topScorer);
    return {
      userId: user.id,
      username: user.username,
      total: matchPoints + specialPoints,
      matchPoints,
      specialPoints,
      exactScores,
      outcomeHits,
    };
  });

  return rows.sort((a, b) => b.total - a.total || b.exactScores - a.exactScores || b.outcomeHits - a.outcomeHits || a.username.localeCompare(b.username));
}
