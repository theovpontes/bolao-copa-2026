import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { createMatchAction, resetUserPasswordAction, saveResultAction, saveTournamentWinnersAction } from "@/app/actions/admin";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { buildRanking } from "@/lib/scoring";
import { MatchRow, PredictionRow, SpecialPredictionRow, UserRow } from "@/lib/types";

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
  const ranking = buildRanking({
    users: (users ?? []) as UserRow[],
    matches: matchRows,
    predictions: (predictions ?? []) as PredictionRow[],
    specials: (specials ?? []) as SpecialPredictionRow[],
    champion: settings?.find((s) => s.key === "champion")?.value ?? null,
    topScorer: settings?.find((s) => s.key === "top_scorer")?.value ?? null,
  });

  return (
    <div className="container">
      <div className="nav">
        <div>
          <h1>Painel Admin</h1>
          <p className="muted">Resultados, usuários, mata-mata e pontuação.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a className="btn secondary" href="/dashboard">Ver como usuário</a>
          <form action={logoutAction}><button className="secondary">Sair</button></form>
        </div>
      </div>

      <div className="grid grid2">
        <section className="card">
          <h2>Ranking atual</h2>
          <table>
            <thead><tr><th>#</th><th>Usuário</th><th>Total</th><th>Jogos</th><th>Especiais</th></tr></thead>
            <tbody>{ranking.map((r, i) => <tr key={r.userId}><td>{i + 1}</td><td>{r.username}</td><td><b>{r.total}</b></td><td>{r.matchPoints}</td><td>{r.specialPoints}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="card">
          <h2>Resultado final dos especiais</h2>
          <form action={saveTournamentWinnersAction} className="grid">
            <label>Seleção campeã<input name="champion" defaultValue={settings?.find((s) => s.key === "champion")?.value ?? ""} /></label>
            <label>Artilheiro<input name="top_scorer" defaultValue={settings?.find((s) => s.key === "top_scorer")?.value ?? ""} /></label>
            <button>Salvar especiais reais</button>
          </form>
        </section>
      </div>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Usuários</h2>
        <p className="muted">As senhas reais não são exibidas. Para alguém que esqueceu a senha, defina uma nova senha aqui.</p>
        <table>
          <thead><tr><th>Usuário</th><th>Tipo</th><th>Reset de senha</th></tr></thead>
          <tbody>
            {((users ?? []) as UserRow[]).map((u) => <tr key={u.id}>
              <td>{u.username}</td><td>{u.role}</td>
              <td>{u.role === "user" && <form action={resetUserPasswordAction} style={{ display: "flex", gap: 8 }}><input type="hidden" name="user_id" value={u.id} /><input name="new_password" placeholder="Nova senha" /><button>Resetar</button></form>}</td>
            </tr>)}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Criar jogo / mata-mata</h2>
        <form action={createMatchAction} className="grid grid2">
          <label>Nº do jogo<input name="match_no" type="number" /></label>
          <label>Fase<input name="stage" defaultValue="Mata-mata" required /></label>
          <label>Grupo<input name="group_name" placeholder="A, B... ou vazio" /></label>
          <label>Mandante<input name="home_team" required /></label>
          <label>Visitante<input name="away_team" required /></label>
          <label>Data/hora<input name="kickoff_at" type="datetime-local" required /></label>
          <label>Estádio/cidade<input name="venue" /></label>
          <button>Criar jogo</button>
        </form>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Tabela universal de jogos</h2>
        <table>
          <thead><tr><th>Jogo</th><th>Data</th><th>Partida</th><th>Resultado real</th></tr></thead>
          <tbody>
            {matchRows.map((m) => <tr key={m.id}>
              <td>{m.match_no ?? m.id}<br /><span className="pill">{m.stage}{m.group_name ? ` • ${m.group_name}` : ""}</span></td>
              <td>{new Date(m.kickoff_at).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}</td>
              <td>{m.home_team} x {m.away_team}<br /><span className="muted">{m.venue}</span></td>
              <td>
                <form action={saveResultAction} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="hidden" name="match_id" value={m.id} />
                  <input name="result_home" type="number" min="0" defaultValue={m.result_home ?? ""} style={{ width: 75 }} />
                  <span>x</span>
                  <input name="result_away" type="number" min="0" defaultValue={m.result_away ?? ""} style={{ width: 75 }} />
                  <button>Salvar</button>
                </form>
              </td>
            </tr>)}
          </tbody>
        </table>
      </section>
    </div>
  );
}
