export type Role = "admin" | "user";

export type UserRow = {
  id: string;
  username: string;
  password_hash: string;
  role: Role;
  created_at: string;
};

export type MatchRow = {
  id: number;
  match_no: number | null;
  stage: string;
  group_name: string | null;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  venue: string | null;
  result_home: number | null;
  result_away: number | null;
  created_at: string;
};

export type PredictionRow = {
  user_id: string;
  match_id: number;
  pred_home: number;
  pred_away: number;
  updated_at: string;
};

export type SpecialPredictionRow = {
  user_id: string;
  champion: string | null;
  top_scorer: string | null;
  updated_at: string;
};
