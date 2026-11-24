import type { Player } from './player.model';
import type { Round } from './round.model';

export type GameStatus = 'in-progress' | 'completed';

export interface Game {
  id: string;
  createdAt: string;
  completedAt: string | null;
  status: GameStatus;
  roundCount: 10;
  players: Player[];
  rounds: Round[];
  winnerId: string | null;
}
