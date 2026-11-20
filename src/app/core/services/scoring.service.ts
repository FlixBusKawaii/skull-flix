import { Injectable } from '@angular/core';
import type { Game } from '../../models/game.model';
import type { PlayerRoundScore, Round } from '../../models/round.model';

@Injectable({
  providedIn: 'root',
})
export class ScoringService {
  calculateRoundScore(roundNumber: number, score: PlayerRoundScore): number | null {
    if (score.bid === null || score.tricks === null) {
      return null;
    }

    if (score.bid === 0) {
      return score.tricks === 0 ? roundNumber * 10 : roundNumber * -10;
    }

    if (score.bid === score.tricks) {
      return score.bid * 20 + score.bonus;
    }

    return Math.abs(score.tricks - score.bid) * -10;
  }

  calculatePlayerTotal(playerId: string, rounds: Round[]): number {
    return rounds.reduce((total, round) => {
      const playerScore = round.scores.find((score) => score.playerId === playerId);

      if (!playerScore) {
        return total;
      }

      const roundScore = this.calculateRoundScore(round.number, playerScore);

      return roundScore === null ? total : total + roundScore;
    }, 0);
  }

  calculateGameScores(game: Game): Map<string, number> {
    const scores = new Map<string, number>();

    for (const player of game.players) {
      scores.set(player.id, this.calculatePlayerTotal(player.id, game.rounds));
    }

    return scores;
  }
}
