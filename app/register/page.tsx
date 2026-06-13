"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/app/components/ThemeToggle";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, null);
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}><ThemeToggle /></div>
        <div className="crest">⚽</div>
        <h1>Criar conta</h1>
        <p className="sub">Escolha um usuário único. Não precisa de e-mail.</p>
        <form action={action} className="grid">
          <div><label>Usuário</label><input name="username" autoComplete="username" required /></div>
          <div><label>Senha</label><input name="password" type="password" autoComplete="new-password" required /></div>
          {state?.error && <p className="erro-msg">{state.error}</p>}
          <button disabled={pending}>{pending ? "Criando..." : "Criar conta"}</button>
        </form>
        <p className="muted" style={{ textAlign: "center", marginTop: 16, fontSize: 14 }}>
          Já tem conta? <Link href="/login" style={{ color: "var(--aco)", fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
