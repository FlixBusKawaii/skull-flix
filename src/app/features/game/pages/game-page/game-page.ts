import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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

  private readonly router = inject(Router);

  readonly playerNames = signal<string[]>(['', '']);

  readonly showFinishConfirmation = signal(false);
  readonly showResultsModal = signal(false);

  readonly showCancelConfirmation = signal(false);

  readonly finalScores = computed(() => {
    const currentGame = this.game();

    if (!currentGame || currentGame.status !== 'completed') {
      return [];
    }

    const scores = this.gameService.getManualScores(currentGame.id);

    if (!scores) return [];

    return currentGame.players
      .map((player) => ({
        ...player,
        total: scores.get(player.id) ?? 0,
      }))
      .sort((a, b) => b.total - a.total);
  });

  readonly winnerName = computed(() => {
    const currentGame = this.game();

    if (!currentGame) return null;

    const winnerId = currentGame.winnerId;

    if (winnerId === null) return null;

    return currentGame.players.find((player) => player.id === winnerId)?.name ?? null;
  });

  readonly game = computed(() => {
    const games = this.gameService.games();

    if (this.gameId) {
      return games.find((game) => game.id === this.gameId) ?? null;
    }

    return games.find((game) => game.status === 'in-progress') ?? null;
  });

  readonly totals = computed(() => {
    const currentGame = this.game();

    if (!currentGame) return new Map<string, number>();

    return this.gameService.getManualScores(currentGame.id) ?? new Map();
  });

  readonly canFinishGame = computed(() => {
    const currentGame = this.game();

    return currentGame ? this.gameService.canFinishGame(currentGame.id) : false;
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

  addPlayer(): void {
    if (this.playerNames().length >= 8) return;

    this.playerNames.update((players) => [...players, '']);
  }

  removePlayer(index: number): void {
    if (this.playerNames().length <= 2) return;

    this.playerNames.update((players) => players.filter((_, playerIndex) => playerIndex !== index));
  }

  updatePlayerName(index: number, name: string): void {
    this.playerNames.update((players) =>
      players.map((player, playerIndex) => (playerIndex === index ? name : player)),
    );
  }

  createGame(): void {
    const game = this.gameService.createGame(this.playerNames());

    if (!game) return;

    void this.router.navigate(['/game', game.id]);
  }

  requestFinishGame(): void {
    if (!this.canFinishGame()) return;

    this.showFinishConfirmation.set(true);
  }

  confirmFinishGame(): void {
    const currentGame = this.game();

    if (!currentGame || !this.canFinishGame()) return;

    const success = this.gameService.finishGame(currentGame.id);

    if (success) {
      this.showFinishConfirmation.set(false);
      this.showResultsModal.set(true);
    }
  }

  cancelFinishGame(): void {
    this.showFinishConfirmation.set(false);
  }

  goToHome(): void {
    this.showResultsModal.set(false);
    void this.router.navigate(['/']);
  }

  requestCancelGame(): void {
    const currentGame = this.game();

    if (!currentGame || currentGame.status !== 'in-progress') return;

    this.showCancelConfirmation.set(true);
  }

  confirmCancelGame(): void {
    const currentGame = this.game();

    if (!currentGame || currentGame.status !== 'in-progress') return;

    const success = this.gameService.deleteGame(currentGame.id);

    if (success) {
      this.showCancelConfirmation.set(false);
      void this.router.navigate(['/']);
    }
  }

  cancelCancelGame(): void {
    this.showCancelConfirmation.set(false);
  }
}
