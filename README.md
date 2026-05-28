# Bolão da Copa Privado

Site privado de bolão para Copa do Mundo, feito em Next.js + Supabase/Postgres.

## O que já vem pronto
- Cadastro com nome de usuário único e senha.
- Login sem e-mail.
- Usuário só edita os próprios palpites.
- Palpite bloqueado automaticamente no horário de início do jogo.
- Placar exato: 3 pontos no total.
- Acerto de resultado/vencedor/empate: 1 ponto.
- Campeão e artilheiro: 10 pontos cada, bloqueados no início do primeiro jogo.
- Admin edita resultados reais, cria jogos de mata-mata e reseta senha de usuários.
- Ranking público recalculado automaticamente.

## Segurança das senhas
As senhas são armazenadas como hash com bcrypt. O admin não vê senhas reais. Para usuário que esqueceu a senha, o admin define uma nova senha no painel.

## Setup
1. Crie um projeto no Supabase.
2. No SQL Editor, rode `supabase/schema.sql`.
3. Depois rode `supabase/seed_group_stage.sql`.
4. Copie `.env.example` para `.env.local` e preencha as variáveis.
5. Instale e rode:

```bash
npm install
npm run dev
```

6. Acesse `/admin/setup` não existe: o admin é criado automaticamente no primeiro acesso ao `/login` quando as variáveis `ADMIN_USERNAME` e `ADMIN_INITIAL_PASSWORD` estão definidas.

## Observação sobre jogos
O seed inclui a fase de grupos em estrutura editável. Antes de colocar no ar, confira horários no site oficial da FIFA e ajuste o `kickoff_at` no painel admin/SQL.
