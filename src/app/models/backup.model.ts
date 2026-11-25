import type { Game } from './game.model';

export interface BackupFile {
  app: 'SkullFlix';
  version: 1;
  exportedAt: string;
  games: Game[];
}
