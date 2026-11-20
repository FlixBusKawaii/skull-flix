import { beforeEach, describe, expect, it } from 'vitest';
import { StorageService } from './storage.service';
import type { Game } from '../../models/game.model';

describe('StorageService', () => {
  let service: StorageService;

  const game: Game = {
    id: 'game-1',
    createdAt: '2026-10-11T10:00:00.000Z',
    completedAt: null,
    status: 'in-progress',
    roundCount: 6,
    players: [
      { id: 'player-1', name: 'Alice' },
      { id: 'player-2', name: 'Bob' },
    ],
    rounds: [],
    winnerId: null,
  };

  beforeEach(() => {
    localStorage.clear();
    service = new StorageService();
  });

  it('renvoie une liste vide si aucune partie n’est enregistrée', () => {
    expect(service.getGames()).toEqual([]);
  });

  it('enregistre et relit une partie', () => {
    expect(service.saveGame(game)).toBe(true);
    expect(service.getGames()).toEqual([game]);
  });

  it('met à jour une partie sans créer de doublon', () => {
    service.saveGame(game);

    const updatedGame: Game = {
      ...game,
      status: 'completed',
      completedAt: '2026-10-11T11:00:00.000Z',
      winnerId: 'player-1',
    };

    service.saveGame(updatedGame);

    expect(service.getGames()).toEqual([updatedGame]);
  });

  it('supprime une partie par son identifiant', () => {
    service.saveGame(game);

    expect(service.deleteGame('game-1')).toBe(true);
    expect(service.getGames()).toEqual([]);
  });

  it('ignore un contenu JSON invalide', () => {
    localStorage.setItem('skullflix_games_v1', '{invalid');

    expect(service.getGames()).toEqual([]);
  });

  it('ignore un contenu JSON qui n’est pas un tableau', () => {
    localStorage.setItem('skullflix_games_v1', '{"id":"game-1"}');

    expect(service.getGames()).toEqual([]);
  });
});
