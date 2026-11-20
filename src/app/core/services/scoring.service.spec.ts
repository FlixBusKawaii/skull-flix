import { describe, expect, it } from 'vitest';
import { ScoringService } from './scoring.service';
import type { PlayerRoundScore } from '../../models/round.model';

describe('ScoringService', () => {
  const service = new ScoringService();

  it('attribue 10 points pour une annonce de zéro réussie à la manche 1', () => {
    const score: PlayerRoundScore = {
      playerId: 'player-1',
      bid: 0,
      tricks: 0,
      bonus: 0,
      points: null,
    };

    expect(service.calculateRoundScore(1, score)).toBe(10);
  });

  it('retire les points prévus pour une annonce de zéro ratée', () => {
    const score: PlayerRoundScore = {
      playerId: 'player-1',
      bid: 0,
      tricks: 2,
      bonus: 0,
      points: null,
    };

    expect(service.calculateRoundScore(3, score)).toBe(-30);
  });

  it('ajoute le bonus lorsque l’annonce non nulle est réussie', () => {
    const score: PlayerRoundScore = {
      playerId: 'player-1',
      bid: 2,
      tricks: 2,
      bonus: 10,
      points: null,
    };

    expect(service.calculateRoundScore(5, score)).toBe(50);
  });

  it('calcule une annonce non nulle ratée', () => {
    const score: PlayerRoundScore = {
      playerId: 'player-1',
      bid: 3,
      tricks: 1,
      bonus: 0,
      points: null,
    };

    expect(service.calculateRoundScore(4, score)).toBe(-20);
  });

  it('ne calcule pas de score si une valeur manque', () => {
    const score: PlayerRoundScore = {
      playerId: 'player-1',
      bid: 2,
      tricks: null,
      bonus: 0,
      points: null,
    };

    expect(service.calculateRoundScore(1, score)).toBeNull();
  });

  it('additionne les scores des manches renseignées', () => {
    const total = service.calculatePlayerTotal('player-1', [
      {
        number: 1,
        scores: [
          {
            playerId: 'player-1',
            bid: 0,
            tricks: 0,
            bonus: 0,
            points: null,
          },
        ],
      },
      {
        number: 2,
        scores: [
          {
            playerId: 'player-1',
            bid: 2,
            tricks: 1,
            bonus: 0,
            points: null,
          },
        ],
      },
    ]);

    expect(total).toBe(0);
  });
});
