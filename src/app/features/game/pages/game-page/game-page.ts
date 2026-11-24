import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameService } from '../../../../core/services/game.service';
import { ScoreTable } from '../../components/score-table/score-table';

@Component({
  selector: 'app-game-page',
  imports: [ScoreTable],
  templateUrl: './game-page.html',
  styleUrl: './game-page.css',
})
export class GamePage {
  private readonly route = inject(ActivatedRoute);
  private readonly gameService = inject(GameService);

  private readonly gameId = this.route.snapshot.paramMap.get('id');

  readonly game = computed(() => {
    if (!this.gameId) return null;

    return this.gameService.getGame(this.gameId) ?? null;
  });

  readonly totals = computed(() => {
    const currentGame = this.game();

    if (!currentGame) return new Map<string, number>();

    return this.gameService.getManualScores(currentGame.id) ?? new Map();
  });

  onScoreChange(event: { roundNumber: number; playerId: string; points: number | null }): void {
    const currentGame = this.game();

    if (!currentGame) return;

    const round = currentGame.rounds.find((item) => item.number === event.roundNumber);

    if (!round) return;

    const updatedRound = {
      ...round,
      scores: round.scores.map((score) =>
        score.playerId === event.playerId ? { ...score, points: event.points } : score,
      ),
    };

    this.gameService.updateRound(currentGame.id, updatedRound);
  }
}
