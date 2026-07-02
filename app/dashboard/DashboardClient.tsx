"use client";

import { useMemo, useRef, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { savePredictionLive, saveSpecialLive } from "@/app/actions/predictions-live";
import { pointsForMatch, isLocked, specialLocked } from "@/lib/scoring";
import { MatchRow, PredictionRow, SpecialPredictionRow, UserRow } from "@/lib/types";
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

export function DashboardClient(props: {
  session: Session; matches: MatchRow[]; myPredictions: PredictionRow[];
  mySpecial: SpecialPredictionRow | null; allPredictions: PredictionRow[]; users: UserRow[]; ranking: RankRow[];
}) {
  const { session, matches, allPredictions, users, ranking } = props;
  const [aba, setAba] = useState<"palpites" | "ranking" | "revelados">("palpites");
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [meus, setMeus] = useState<Record<number, { h: string; a: string }>>(() => {
    const init: Record<number, { h: string; a: string }> = {};
    props.myPredictions.forEach((p) => { init[p.match_id] = { h: String(p.pred_home), a: String(p.pred_away) }; });
    return init;
  });
  const [special, setSpecial] = useState({
    champion: props.mySpecial?.champion ?? "", top_scorer: props.mySpecial?.top_scorer ?? "",
  });

  const lockedSpecial = useMemo(() => specialLocked(matches), [matches]);
  const grupos = useMemo(() => [...new Set(matches.map((m) => m.group_name).filter(Boolean))].sort() as string[], [matches]);
  const [fGrupo, setFGrupo] = useState<string>("todos");

  function showFlash(msg: string) {
    setFlash(msg);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 1700);
  }

  async function salvarPalpite(matchId: number) {
    const v = meus[matchId];
    if (!v || v.h === "" || v.a === "") return;
    const res = await savePredictionLive({ match_id: matchId, pred_home: Number(v.h), pred_away: Number(v.a) });
    showFlash("ok" in res ? "✓ Palpite salvo" : "⛔ " + res.error);
  }
  async function salvarEspecial() {
    if (lockedSpecial) { showFlash("⛔ Mercado fechado"); return; }
    const res = await saveSpecialLive(special);
    showFlash("ok" in res ? "✓ Especiais salvos" : "⛔ " + res.error);
  }

  const jogosFiltrados = matches.filter((m) => fGrupo === "todos" || m.group_name === fGrupo);

  return (
    <>
      <header className="topo">
        <div className="topo-in">
          <div className="topo-logo"><span className="mini">⚽</span> <span>Bolão da Copa</span></div>
          <div className="topo-dir">
            <span>@{session.username}</span>
            {session.role === "admin" && <a href="/admin" className="badge-mod">admin</a>}
            <ThemeToggle />
            <form action={logoutAction}><button className="secondary" style={{ padding: "7px 12px", fontSize: 13 }}>Sair</button></form>
          </div>
        </div>
        <nav className="tabs">
          <button className={aba === "palpites" ? "on" : ""} onClick={() => setAba("palpites")}>Meus palpites</button>
          <button className={aba === "ranking" ? "on" : ""} onClick={() => setAba("ranking")}>Classificação</button>
          <button className={aba === "revelados" ? "on" : ""} onClick={() => setAba("revelados")}>Revelados</button>
        </nav>
      </header>

      <main className="container">
        {aba === "palpites" && (
          <PalpitesTab jogos={jogosFiltrados} grupos={grupos} fGrupo={fGrupo} setFGrupo={setFGrupo}
            meus={meus} setMeus={setMeus} salvarPalpite={salvarPalpite}
            special={special} setSpecial={setSpecial} lockedSpecial={lockedSpecial} salvarEspecial={salvarEspecial} />
        )}
        {aba === "ranking" && <RankingTab ranking={ranking} meId={session.id} />}
        {aba === "revelados" && <ReveladosTab matches={matches} allPredictions={allPredictions} users={users} grupos={grupos} />}
      </main>

      <div className={"flash" + (flash ? " show" : "")}>{flash}</div>
    </>
  );
}

function PalpitesTab(props: {
  jogos: MatchRow[]; grupos: string[]; fGrupo: string; setFGrupo: (g: string) => void;
  meus: Record<number, { h: string; a: string }>; setMeus: React.Dispatch<React.SetStateAction<Record<number, { h: string; a: string }>>>;
  salvarPalpite: (id: number) => void;
  special: { champion: string; top_scorer: string }; setSpecial: React.Dispatch<React.SetStateAction<{ champion: string; top_scorer: string }>>;
  lockedSpecial: boolean; salvarEspecial: () => void;
}) {
  const { jogos, grupos, fGrupo, setFGrupo, meus, setMeus, salvarPalpite, special, setSpecial, lockedSpecial, salvarEspecial } = props;
  let lastDay = "";
  return (
    <>
      <div className="esp-card">
        <h3>⭐ Palpites especiais <small style={{ fontWeight: 400, color: "var(--txt2)", fontSize: 12 }}>(10 pts cada)</small></h3>
        <p className="muted" style={{ fontSize: 13, margin: "0 0 12px" }}>
          {lockedSpecial ? "⛔ Mercado fechado — começou no primeiro jogo." : "Escolha antes do primeiro jogo. Depois, congela."}
        </p>
        <div className="esp-row"><label>Campeão</label>
          <input value={special.champion} disabled={lockedSpecial} onChange={(e) => setSpecial((s) => ({ ...s, champion: e.target.value }))} placeholder="seleção campeã" /></div>
        <div className="esp-row"><label>Artilheiro</label>
          <input value={special.top_scorer} disabled={lockedSpecial} onChange={(e) => setSpecial((s) => ({ ...s, top_scorer: e.target.value }))} placeholder="nome do jogador" /></div>
        {!lockedSpecial && <button onClick={salvarEspecial} style={{ marginTop: 4 }}>Salvar especiais</button>}
      </div>

      <div className="filtros">
        <span className="lbl">Grupo:</span>
        <button className={"chip " + (fGrupo === "todos" ? "on" : "")} onClick={() => setFGrupo("todos")}>todos</button>
        {grupos.map((g) => <button key={g} className={"chip " + (fGrupo === g ? "on" : "")} onClick={() => setFGrupo(g)}>{g}</button>)}
      </div>

      <div>
        {jogos.map((m) => {
          const diaKey = fmtData(m.kickoff_at);
          const showDay = diaKey !== lastDay;
          if (showDay) lastDay = diaKey;
          const locked = isLocked(m.kickoff_at);
          const v = meus[m.id] || { h: "", a: "" };
          const hasResult = m.result_home !== null && m.result_away !== null;
          const pred = v.h !== "" && v.a !== "" ? { user_id: "", match_id: m.id, pred_home: Number(v.h), pred_away: Number(v.a), updated_at: "" } : null;
          const pts = hasResult ? pointsForMatch(m, pred) : null;
          return (
            <div key={m.id}>
              {showDay && <div className="dia-sep">{diaKey}</div>}
              <div className="jogo">
                <div className="jogo-topo">
                  <div className="jogo-meta">
                    <span className="grp-tag">{m.group_name ? `Grupo ${m.group_name}` : m.stage}</span> {fmtData(m.kickoff_at)} · {fmtHora(m.kickoff_at)}h
                  </div>
                  <span className={"estado " + (locked ? "fechado" : "aberto")}>{locked ? "fechado" : "aberto"}</span>
                </div>
                <div className="confronto">
                  <div className="time dir">{m.home_team} <Flag team={m.home_team} h={18} /></div>
                  <input className="placar-in" type="number" min="0" inputMode="numeric" value={v.h} disabled={locked}
                    onChange={(e) => setMeus((s) => ({ ...s, [m.id]: { h: e.target.value, a: s[m.id]?.a ?? "" } }))}
                    onBlur={() => salvarPalpite(m.id)} aria-label={`gols ${m.home_team}`} />
                  <span className="x">×</span>
                  <input className="placar-in" type="number" min="0" inputMode="numeric" value={v.a} disabled={locked}
                    onChange={(e) => setMeus((s) => ({ ...s, [m.id]: { h: s[m.id]?.h ?? "", a: e.target.value } }))}
                    onBlur={() => salvarPalpite(m.id)} aria-label={`gols ${m.away_team}`} />
                  <div className="time"><Flag team={m.away_team} h={18} /> {m.away_team}</div>
                </div>
                {hasResult && (
                  <div className="resultado-real">Resultado: {m.result_home} × {m.result_away} {pts !== null && <span className={`pts-tag pts-${pts}`}>+{pts} pts</span>}</div>
                )}
              </div>
            </div>
          );
        })}
        {jogos.length === 0 && <p className="vazio">Nenhum jogo com esse filtro.</p>}
      </div>
    </>
  );
}

function RankingTab({ ranking, meId }: { ranking: RankRow[]; meId: string }) {
  const medal = ["🥇", "🥈", "🥉"];
  return (
    <div>
      {ranking.map((r, i) => (
        <div key={r.userId} className={"rank-row" + (r.userId === meId ? " eu" : "")}>
          <div className="rank-pos">{medal[i] || `${i + 1}º`}</div>
          <div className="rank-nome">@{r.username} {r.userId === meId && <small style={{ color: "var(--aco)" }}>(você)</small>}
            <div className="rank-det">{r.exactScores} cravadas · {r.outcomeHits} resultados{r.specialPoints > 0 ? ` · ${r.specialPoints} especiais` : ""}</div>
          </div>
          <div className="rank-pts">{r.total}<small> pts</small></div>
        </div>
      ))}
      <p className="muted" style={{ textAlign: "center", fontSize: 12, marginTop: 14 }}>Desempate: nº de cravadas → nº de resultados certos.</p>
    </div>
  );
}

function ReveladosTab(props: { matches: MatchRow[]; allPredictions: PredictionRow[]; users: UserRow[]; grupos: string[]; }) {
  const { matches, allPredictions, users } = props;
  const [fGrupo, setFGrupo] = useState<string>("todos");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  const nome = useMemo(() => { const m: Record<string, string> = {}; users.forEach((u) => { m[u.id] = u.username; }); return m; }, [users]);
  const outcome = (h: number, a: number) => (h > a ? "H" : h < a ? "A" : "D");
  const ptsFor = (m: MatchRow, p: PredictionRow) => {
    if (m.result_home === null || m.result_away === null) return null;
    if (p.pred_home === m.result_home && p.pred_away === m.result_away) return 3;
    if (outcome(p.pred_home, p.pred_away) === outcome(m.result_home, m.result_away)) return 1;
    return 0;
  };

  const fechados = matches.filter((m) => isLocked(m.kickoff_at))
    .filter((m) => fGrupo === "todos" || m.group_name === fGrupo)
    .sort((a, b) => new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime());
  const toggle = (k: string) => setAbertos((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div>
      <div className="filtros">
        <span className="lbl">Grupo:</span>
        <button className={"chip " + (fGrupo === "todos" ? "on" : "")} onClick={() => setFGrupo("todos")}>todos</button>
        {props.grupos.map((g) => <button key={g} className={"chip " + (fGrupo === g ? "on" : "")} onClick={() => setFGrupo(g)}>{g}</button>)}
      </div>
      {fechados.length === 0 && <p className="vazio">Nenhum jogo fechado com esse filtro.<br />Os palpites aparecem depois do horário de fechamento.</p>}
      {fechados.map((m) => {
        const ps = allPredictions.filter((p) => p.match_id === m.id);
        const hasResult = m.result_home !== null && m.result_away !== null;
        const open = !!abertos[m.id];
        const ordenados = hasResult ? [...ps].sort((a, b) => (ptsFor(m, b) ?? 0) - (ptsFor(m, a) ?? 0)) : ps;
        return (
          <div key={m.id} className={"acc" + (open ? " aberto" : "")}>
            <div className="acc-cab" onClick={() => toggle(String(m.id))}>
              <span className="acc-titulo">
                <Flag team={m.home_team} h={16} /> {m.home_team}
                {hasResult ? <span className="acc-resultado">{m.result_home} × {m.result_away}</span> : <span className="acc-pend">(aguardando)</span>}
                <Flag team={m.away_team} h={16} /> {m.away_team}
              </span>
              <span className="seta">▶</span>
            </div>
            <div className="acc-corpo">
              <p className="acc-pend" style={{ margin: "2px 0 8px" }}>{m.group_name ? `Grupo ${m.group_name}` : m.stage} · {fmtData(m.kickoff_at)} · {ps.length} palpite{ps.length === 1 ? "" : "s"}</p>
              {ps.length === 0 && <p className="oculto">Ninguém palpitou neste jogo.</p>}
              {ordenados.map((p) => {
                const pt = ptsFor(m, p);
                return (
                  <div key={p.user_id} className="rev-linha">
                    <span>@{nome[p.user_id] || "?"}</span>
                    <span>{p.pred_home} × {p.pred_away} {pt !== null && <span className={`pts-tag pts-${pt}`}>+{pt}</span>}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
