import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { savePredictionAction, saveSpecialAction } from "@/app/actions/predictions";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { buildRanking, isLocked, pointsForMatch, specialLocked } from "@/lib/scoring";
import { MatchRow, PredictionRow, SpecialPredictionRow, UserRow } from "@/lib/types";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [{ data: matches }, { data: myPredictions }, { data: users }, { data: allPredictions }, { data: specials }, { data: settings }, { data: mySpecial }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_at"),
    supabase.from("predictions").select("*").eq("user_id", session.id),
    supabase.from("users").select("*").order("username"),
    supabase.from("predictions").select("*"),
    supabase.from("special_predictions").select("*"),
    supabase.from("settings").select("*"),
    supabase.from("special_predictions").select("*").eq("user_id", session.id).maybeSingle(),
  ]);

  const matchRows = (matches ?? []) as MatchRow[];
  const ranking = buildRanking({
    users: (users ?? []) as UserRow[],
    matches: matchRows,
    predictions: (allPredictions ?? []) as PredictionRow[],
    specials: (specials ?? []) as SpecialPredictionRow[],
    champion: settings?.find((s) => s.key === "champion")?.value ?? null,
    topScorer: settings?.find((s) => s.key === "top_scorer")?.value ?? null,
  });

  const lockedSpecial = specialLocked(matchRows);

  return (
    <div className="container">
      <div className="nav">
        <div>
          <h1>Bolão da Copa</h1>
          <p className="muted">Logado como <b>{session.username}</b></p>
        </div>
        <form action={logoutAction}><button className="secondary">Sair</button></form>
      </div>

      <div className="grid grid2">
        <section className="card">
          <h2>Ranking</h2>
          <table>
            <thead><tr><th>#</th><th>Usuário</th><th>Total</th><th>Cravadas</th><th>Resultado</th></tr></thead>
            <tbody>
              {ranking.map((r, i) => <tr key={r.userId}><td>{i + 1}</td><td>{r.username}</td><td><b>{r.total}</b></td><td>{r.exactScores}</td><td>{r.outcomeHits}</td></tr>)}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2>Palpites especiais</h2>
          <p className="muted">Campeão e artilheiro valem 10 pontos cada. Bloqueiam no início do primeiro jogo.</p>
          <form action={saveSpecialAction} className="grid">
            <label>Campeão<input name="champion" defaultValue={(mySpecial as SpecialPredictionRow | null)?.champion ?? ""} disabled={lockedSpecial} /></label>
            <label>Artilheiro<input name="top_scorer" defaultValue={(mySpecial as SpecialPredictionRow | null)?.top_scorer ?? ""} disabled={lockedSpecial} /></label>
            <button disabled={lockedSpecial}>{lockedSpecial ? "Bloqueado" : "Salvar especiais"}</button>
          </form>
        </section>
      </div>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Jogos e palpites</h2>
        <div className="grid">
          {matchRows.map((match) => {
            const pred = (myPredictions ?? []).find((p) => p.match_id === match.id) as PredictionRow | undefined;
            const locked = isLocked(match.kickoff_at);
            const gamePoints = pointsForMatch(match, pred);
            return (
              <div key={match.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <span className="pill">{match.stage}{match.group_name ? ` • Grupo ${match.group_name}` : ""}</span>
                    <h3>{match.home_team} x {match.away_team}</h3>
                    <p className="muted">
                      {new Date(match.kickoff_at).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })} {match.venue ? `• ${match.venue}` : ""}
                    </p>
                    {match.result_home !== null && match.result_away !== null && <p>Resultado: <b>{match.result_home} x {match.result_away}</b> • seus pontos: <b>{gamePoints}</b></p>}
                  </div>
                  <form action={savePredictionAction} className="score-inputs">
                    <input type="hidden" name="match_id" value={match.id} />
                    <input name="pred_home" type="number" min="0" defaultValue={pred?.pred_home ?? ""} disabled={locked} required />
                    <span>x</span>
                    <input name="pred_away" type="number" min="0" defaultValue={pred?.pred_away ?? ""} disabled={locked} required />
                    <button
                      disabled={locked}
                      className={pred && !locked ? "saved-btn" : ""}
                    >
                      {locked ? "Bloqueado" : pred ? "Salvo!" : "Salvar"}
                    </button>
                  </form>
                </div>
                {locked && <PublicPredictions matchId={match.id} allPredictions={(allPredictions ?? []) as PredictionRow[]} users={(users ?? []) as UserRow[]} />}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PublicPredictions({ matchId, allPredictions, users }: { matchId: number; allPredictions: PredictionRow[]; users: UserRow[] }) {
  const items = allPredictions.filter((p) => p.match_id === matchId);
  if (!items.length) return <p className="muted">Nenhum palpite registrado.</p>;
  return (
    <details>
      <summary>Ver palpites dos usuários</summary>
      <table>
        <tbody>
          {items.map((p) => <tr key={p.user_id}><td>{users.find((u) => u.id === p.user_id)?.username}</td><td>{p.pred_home} x {p.pred_away}</td></tr>)}
        </tbody>
      </table>
    </details>
  );
}
