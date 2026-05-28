import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bolão da Copa",
  description: "Bolão privado da Copa do Mundo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <main className="min-h-screen bg-slate-950 text-slate-100">{children}</main>
      </body>
    </html>
  );
}
