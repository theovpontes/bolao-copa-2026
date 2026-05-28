"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, null);
  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <div className="card">
        <h1>Criar conta</h1>
        <p className="muted">O nome de usuário deve ser único. Não precisa de e-mail.</p>
        <form action={action} className="grid">
          <label>Usuário<input name="username" autoComplete="username" required /></label>
          <label>Senha<input name="password" type="password" autoComplete="new-password" required /></label>
          {state?.error && <p style={{ color: "#fb7185" }}>{state.error}</p>}
          <button disabled={pending}>{pending ? "Criando..." : "Criar conta"}</button>
        </form>
        <p className="muted">Já tem conta? <Link href="/login">Entrar</Link></p>
      </div>
    </div>
  );
}
