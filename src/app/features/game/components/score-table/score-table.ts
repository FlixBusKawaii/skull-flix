import { Component, input, output } from '@angular/core';
import type { Player } from '../../../../models/player.model';
import type { Round } from '../../../../models/round.model';

@Component({
  selector: 'app-score-table',
  imports: [],
  templateUrl: './score-table.html',
  styleUrl: './score-table.css',
})
export class ScoreTable {
  readonly players = input.required<Player[]>();
  readonly rounds = input.required<Round[]>();
  readonly totals = input.required<Map<string, number>>();

  readonly scoreChange = output<{
    roundNumber: number;
    playerId: string;
    points: number | null;
  }>();

  readonly readOnly = input(false);

  onScoreInput(roundNumber: number, playerId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    let points: number | null = null;

    if (value !== '') {
      const parsedValue = Number(value);

      if (!Number.isFinite(parsedValue)) {
        return;
      }

      points = parsedValue;
    }

    this.scoreChange.emit({
      roundNumber,
      playerId,
      points,
    });
  }

  getScore(round: Round, playerId: string): number | null {
    return round.scores.find((score) => score.playerId === playerId)?.points ?? null;
  }
}
