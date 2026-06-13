"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("bolao-theme") as "dark" | "light") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("bolao-theme", next); } catch {}
  }

  return (
    <button className="theme-btn" onClick={toggle} title="Alternar tema" aria-label="Alternar tema claro/escuro">
      {theme === "dark" ? "Claro ☀️" : "Escuro 🌙"}
    </button>
  );
}
