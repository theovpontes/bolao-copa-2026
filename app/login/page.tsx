"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <div className="card">
        <h1>Entrar no bolão</h1>
        <p className="muted">Use seu nome de usuário e senha.</p>
        <form action={action} className="grid">
          <label>Usuário<input name="username" autoComplete="username" required /></label>
          <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
          {state?.error && <p style={{ color: "#fb7185" }}>{state.error}</p>}
          <button disabled={pending}>{pending ? "Entrando..." : "Entrar"}</button>
        </form>
        <p className="muted">Ainda não tem conta? <Link href="/register">Cadastre-se</Link></p>
      </div>
    </div>
  );
}
