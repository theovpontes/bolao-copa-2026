create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id bigserial primary key,
  match_no integer unique,
  stage text not null default 'Fase de grupos',
  group_name text,
  home_team text not null,
  away_team text not null,
  kickoff_at timestamptz not null,
  venue text,
  result_home integer check (result_home >= 0),
  result_away integer check (result_away >= 0),
  created_at timestamptz not null default now()
);

create table if not exists predictions (
  user_id uuid not null references users(id) on delete cascade,
  match_id bigint not null references matches(id) on delete cascade,
  pred_home integer not null check (pred_home >= 0),
  pred_away integer not null check (pred_away >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

create table if not exists special_predictions (
  user_id uuid primary key references users(id) on delete cascade,
  champion text,
  top_scorer text,
  updated_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value text
);

create index if not exists idx_matches_kickoff on matches(kickoff_at);
create index if not exists idx_predictions_match on predictions(match_id);
