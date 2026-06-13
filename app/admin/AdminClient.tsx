"use client";

import { useMemo, useRef, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { createMatchAction, resetUserPasswordAction, saveTournamentWinnersAction } from "@/app/actions/admin";
import { saveResultLive } from "@/app/actions/predictions-live";
import { MatchRow, UserRow } from "@/lib/types";
import { Flag } from "@/app/components/Flag";
import { ThemeToggle } from "@/app/components/ThemeToggle";

type Session = { id: string; username: string; role: "admin" | "user" };
type RankRow = { userId: string; username: string; total: number; matchPoints: number; specialPoints: number; exactScores: number; outcomeHits: number; };

const TZ = "America/Sao_Paulo";
const fmtData = (iso: string) => {
  const d = new Date(iso);
  const dia = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: TZ }).format(d).replace(".", "");
  const dm = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: TZ }).format(d);
  return `${dia} ${dm}`;
};
const fmtHora = (iso: string) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).format(new Date(iso));

export function AdminClient(props: {
  session: Session; matches: MatchRow[]; users: UserRow[]; ranking: RankRow[]; champion: string; topScorer: string;
}) {
  const { matches, users, ranking } = props;
  const [aba, setAba] = useState<"resultados" | "ranking" | "gabarito" | "usuarios" | "criar">("resultados");
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [results, setResults] = useState<Record<number, { h: string; a: string }>>(() => {
    const init: Record<number, { h: string; a: string }> = {};
    matches.forEach((m) => { init[m.id] = { h: m.result_home !== null ? String(m.result_home) : "", a: m.result_away !== null ? String(m.result_away) : "" }; });
    return init;
  });

  const grupos = useMemo(() => [...new Set(matches.map((m) => m.group_name).filter(Boolean))].sort() as string[], [matches]);
  const [fGrupo, setFGrupo] = useState<string>("todos");

  function showFlash(msg: string) {
    setFlash(msg);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 1700);
  }
  async function salvarResultado(matchId: number) {
    const v = results[matchId];
    const h = v.h === "" ? null : Number(v.h);
    const a = v.a === "" ? null : Number(v.a);
    if ((h === null) !== (a === null)) return;
    const res = await saveResultLive({ match_id: matchId, result_home: h, result_away: a });
    showFlash("ok" in res ? "✓ Resultado salvo" : "⛔ " + res.error);
  }

  const jogos = matches.filter((m) => fGrupo === "todos" || m.group_name === fGrupo);

  return (
    <>
      <header className="topo">
        <div className="topo-in">
          <div className="topo-logo"><span className="mini">⚙️</span> <span>Painel Admin</span></div>
          <div className="topo-dir">
            <a href="/dashboard" className="btn secondary" style={{ padding: "7px 12px", fontSize: 13 }}>Ver como usuário</a>
            <ThemeToggle />
            <form action={logoutAction}><button className="secondary" style={{ padding: "7px 12px", fontSize: 13 }}>Sair</button></form>
          </div>
        </div>
        <nav className="tabs">
          <button className={aba === "resultados" ? "on" : ""} onClick={() => setAba("resultados")}>Resultados</button>
          <button className={aba === "ranking" ? "on" : ""} onClick={() => setAba("ranking")}>Ranking</button>
          <button className={aba === "gabarito" ? "on" : ""} onClick={() => setAba("gabarito")}>Gabarito</button>
          <button className={aba === "usuarios" ? "on" : ""} onClick={() => setAba("usuarios")}>Usuários</button>
          <button className={aba === "criar" ? "on" : ""} onClick={() => setAba("criar")}>Criar jogo</button>
        </nav>
      </header>

      <main className="container">
        {aba === "resultados" && (
          <>
            <div className="filtros">
              <span className="lbl">Grupo:</span>
              <button className={"chip " + (fGrupo === "todos" ? "on" : "")} onClick={() => setFGrupo("todos")}>todos</button>
              {grupos.map((g) => <button key={g} className={"chip " + (fGrupo === g ? "on" : "")} onClick={() => setFGrupo(g)}>{g}</button>)}
            </div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>Digite o placar e ele salva sozinho. O ranking recalcula automaticamente.</p>
            {jogos.map((m) => {
              const v = results[m.id] || { h: "", a: "" };
              return (
                <div key={m.id} className="jogo">
                  <div className="jogo-topo">
                    <div className="jogo-meta"><span className="grp-tag">{m.group_name ? `Grupo ${m.group_name}` : m.stage}</span> {fmtData(m.kickoff_at)} · {fmtHora(m.kickoff_at)}h</div>
                  </div>
                  <div className="confronto">
                    <div className="time dir">{m.home_team} <Flag team={m.home_team} h={17} /></div>
                    <input className="placar-in" type="number" min="0" value={v.h}
                      onChange={(e) => setResults((s) => ({ ...s, [m.id]: { h: e.target.value, a: s[m.id]?.a ?? "" } }))}
                      onBlur={() => salvarResultado(m.id)} aria-label={`resultado ${m.home_team}`} />
                    <span className="x">×</span>
                    <input className="placar-in" type="number" min="0" value={v.a}
                      onChange={(e) => setResults((s) => ({ ...s, [m.id]: { h: s[m.id]?.h ?? "", a: e.target.value } }))}
                      onBlur={() => salvarResultado(m.id)} aria-label={`resultado ${m.away_team}`} />
                    <div className="time"><Flag team={m.away_team} h={17} /> {m.away_team}</div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {aba === "ranking" && (
          <div>
            {ranking.map((r, i) => (
              <div key={r.userId} className="rank-row">
                <div className="rank-pos">{["🥇", "🥈", "🥉"][i] || `${i + 1}º`}</div>
                <div className="rank-nome">@{r.username}<div className="rank-det">{r.matchPoints} de jogos · {r.specialPoints} de especiais · {r.exactScores} cravadas</div></div>
                <div className="rank-pts">{r.total}<small> pts</small></div>
              </div>
            ))}
          </div>
        )}

        {aba === "gabarito" && (
          <div className="esp-card">
            <h3>🏆 Resultado final dos especiais</h3>
            <p className="muted" style={{ fontSize: 13, margin: "0 0 12px" }}>Preencha no fim da Copa. Define quem ganha os 10+10.</p>
            <form action={saveTournamentWinnersAction}>
              <div className="esp-row"><label>Campeã</label><input name="champion" defaultValue={props.champion} placeholder="seleção campeã" /></div>
              <div className="esp-row"><label>Artilheiro</label><input name="top_scorer" defaultValue={props.topScorer} placeholder="nome do jogador" /></div>
              <button style={{ marginTop: 4 }}>Salvar gabarito</button>
            </form>
          </div>
        )}

        {aba === "usuarios" && (
          <div className="card">
            <h3>Usuários</h3>
            <p className="muted" style={{ fontSize: 13 }}>As senhas reais não aparecem. Para quem esqueceu, defina uma nova senha.</p>
            <table>
              <thead><tr><th>Usuário</th><th>Tipo</th><th>Reset de senha</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>@{u.username}</td>
                    <td>{u.role === "admin" ? <span className="badge-mod">admin</span> : "user"}</td>
                    <td>{u.role === "user" && (
                      <form action={resetUserPasswordAction} style={{ display: "flex", gap: 8 }}>
                        <input type="hidden" name="user_id" value={u.id} />
                        <input name="new_password" placeholder="Nova senha" />
                        <button className="secondary">Resetar</button>
                      </form>
                    )}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {aba === "criar" && (
          <div className="card">
            <h3>Criar jogo / mata-mata</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>Use para adicionar os jogos do mata-mata conforme forem definidos.</p>
            <form action={createMatchAction} className="grid">
              <div className="esp-row"><label>Nº do jogo</label><input name="match_no" type="number" /></div>
              <div className="esp-row"><label>Fase</label><input name="stage" defaultValue="Mata-mata" required /></div>
              <div className="esp-row"><label>Grupo</label><input name="group_name" placeholder="A, B... ou vazio" /></div>
              <div className="esp-row"><label>Mandante</label><input name="home_team" required /></div>
              <div className="esp-row"><label>Visitante</label><input name="away_team" required /></div>
              <div className="esp-row"><label>Data/hora</label><input name="kickoff_at" type="datetime-local" required /></div>
              <div className="esp-row"><label>Estádio</label><input name="venue" /></div>
              <button style={{ marginTop: 4 }}>Criar jogo</button>
            </form>
          </div>
        )}
      </main>

      <div className={"flash" + (flash ? " show" : "")}>{flash}</div>
    </>
  );
}
