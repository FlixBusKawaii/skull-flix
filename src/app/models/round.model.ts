export interface PlayerRoundScore {
  playerId: string;
  bid: number | null;
  tricks: number | null;
  bonus: number;
  points: number | null;
}

export interface Round {
  number: number;
  scores: PlayerRoundScore[];
}
