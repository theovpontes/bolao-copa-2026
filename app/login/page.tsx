"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/app/components/ThemeToggle";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}><ThemeToggle /></div>
        <div className="crest">⚽</div>
        <h1>Bolão da Copa</h1>
        <p className="sub">Entre com seu usuário e senha</p>
        <form action={action} className="grid">
          <div><label>Usuário</label><input name="username" autoComplete="username" required /></div>
          <div><label>Senha</label><input name="password" type="password" autoComplete="current-password" required /></div>
          {state?.error && <p className="erro-msg">{state.error}</p>}
          <button disabled={pending}>{pending ? "Entrando..." : "Entrar"}</button>
        </form>
        <p className="muted" style={{ textAlign: "center", marginTop: 16, fontSize: 14 }}>
          Ainda não tem conta? <Link href="/register" style={{ color: "var(--aco)", fontWeight: 600 }}>Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
