import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../../../core/services/game.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-history-page',
  imports: [DatePipe],
  templateUrl: './history-page.html',
  styleUrl: './history-page.css',
})
export class HistoryPage {
  private readonly gameService = inject(GameService);
  private readonly router = inject(Router);

  readonly completedGames = computed(() =>
    this.gameService
      .games()
      .filter((game) => game.status === 'completed')
      .sort((a, b) => {
        const dateA = a.completedAt ?? a.createdAt;
        const dateB = b.completedAt ?? b.createdAt;

        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }),
  );

  openGame(gameId: string): void {
    void this.router.navigate(['/game', gameId]);
  }

  getRanking(gameId: string) {
    const game = this.gameService.games().find((item) => item.id === gameId);

    if (!game) return [];

    const scores = this.gameService.getManualScores(gameId);

    if (!scores) return [];

    return game.players
      .map((player) => ({
        ...player,
        total: scores.get(player.id) ?? 0,
      }))
      .sort((a, b) => b.total - a.total);
  }
}
