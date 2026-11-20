import { Injectable, inject, signal } from '@angular/core';
import type { Game } from '../../models/game.model';
import type { Player } from '../../models/player.model';
import type { Round } from '../../models/round.model';
import { ScoringService } from './scoring.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly storage = inject(StorageService);
  private readonly scoring = inject(ScoringService);

  private readonly gamesState = signal<Game[]>(this.storage.getGames());
  readonly games = this.gamesState.asReadonly();

  createGame(playerNames: string[], roundCount: 6 | 8 | 10): Game | null {
    const names = playerNames.map((name) => name.trim());

    if (names.length < 2 || names.length > 8 || names.some((name) => name.length === 0)) {
      return null;
    }

    const normalizedNames = names.map((name) => name.toLocaleLowerCase());

    if (new Set(normalizedNames).size !== names.length) {
      return null;
    }

    const players: Player[] = names.map((name) => ({
      id: crypto.randomUUID(),
      name,
    }));

    const game: Game = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completedAt: null,
      status: 'in-progress',
      roundCount,
      players,
      rounds: [],
      winnerId: null,
    };

    if (!this.storage.saveGame(game)) {
      return null;
    }

    this.refreshGames();
    return game;
  }

  getGame(gameId: string): Game | undefined {
    return this.gamesState().find((game) => game.id === gameId);
  }

  updateRound(gameId: string, round: Round): boolean {
    const game = this.getGame(gameId);

    if (!game || game.status !== 'in-progress') {
      return false;
    }

    if (round.number < 1 || round.number > game.roundCount) {
      return false;
    }

    const playerIds = new Set(game.players.map((player) => player.id));

    if (
      round.scores.length !== game.players.length ||
      new Set(round.scores.map((score) => score.playerId)).size !== game.players.length ||
      round.scores.some((score) => !playerIds.has(score.playerId))
    ) {
      return false;
    }

    const updatedRounds = [...game.rounds];
    const existingIndex = updatedRounds.findIndex(
      (savedRound) => savedRound.number === round.number,
    );

    if (existingIndex === -1) {
      updatedRounds.push(round);
    } else {
      updatedRounds[existingIndex] = round;
    }

    updatedRounds.sort((a, b) => a.number - b.number);

    return this.saveUpdatedGame({
      ...game,
      rounds: updatedRounds,
    });
  }

  getScores(gameId: string): Map<string, number> | null {
    const game = this.getGame(gameId);

    return game ? this.scoring.calculateGameScores(game) : null;
  }

  getManualScores(gameId: string): Map<string, number> | null {
    const game = this.getGame(gameId);
    return game ? this.calculateManualGameScores(game) : null;
  }

  finishGame(gameId: string): boolean {
    const game = this.getGame(gameId);

    if (!game || game.status !== 'in-progress') {
      return false;
    }

    const completedRoundNumbers = new Set(game.rounds.map((round) => round.number));

    if (
      game.rounds.length !== game.roundCount ||
      Array.from({ length: game.roundCount }, (_, index) => index + 1).some(
        (number) => !completedRoundNumbers.has(number),
      )
    ) {
      return false;
    }

    if (game.rounds.some((round) => round.scores.some((score) => score.points === null)))
      return false;

    const scores = this.calculateManualGameScores(game);
    const highestScore = Math.max(...scores.values());
    const winners = [...scores.entries()].filter(([, score]) => score === highestScore);

    // En cas d'égalité, on ne désigne pas arbitrairement un vainqueur.
    const winnerId = winners.length === 1 ? winners[0][0] : null;

    return this.saveUpdatedGame({
      ...game,
      status: 'completed',
      completedAt: new Date().toISOString(),
      winnerId,
    });
  }

  private calculateManualGameScores(game: Game): Map<string, number> {
    const scores = new Map<string, number>();

    for (const player of game.players) {
      const total = game.rounds.reduce((sum, round) => {
        const playerScore = round.scores.find((score) => score.playerId === player.id);

        return sum + (playerScore?.points ?? 0);
      }, 0);

      scores.set(player.id, total);
    }

    return scores;
  }

  deleteGame(gameId: string): boolean {
    if (!this.storage.deleteGame(gameId)) {
      return false;
    }

    this.refreshGames();
    return true;
  }

  private saveUpdatedGame(game: Game): boolean {
    if (!this.storage.saveGame(game)) {
      return false;
    }

    this.refreshGames();
    return true;
  }

  private refreshGames(): void {
    this.gamesState.set(this.storage.getGames());
  }
}
