import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GameService } from './game.service';
import { ScoringService } from './scoring.service';
import { StorageService } from './storage.service';
import type { Game } from '../../models/game.model';
import type { Round } from '../../models/round.model';

describe('GameService', () => {
  let service: GameService;
  let savedGames: Game[];

  beforeEach(() => {
    savedGames = [];

    const storageMock = {
      getGames: vi.fn(() => savedGames),
      saveGame: vi.fn((game: Game) => {
        const index = savedGames.findIndex((item) => item.id === game.id);

        if (index === -1) {
          savedGames.push(game);
        } else {
          savedGames[index] = game;
        }

        return true;
      }),
      deleteGame: vi.fn((id: string) => {
        savedGames = savedGames.filter((game) => game.id !== id);
        return true;
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        GameService,
        { provide: StorageService, useValue: storageMock },
        {
          provide: ScoringService,
          useValue: {
            calculateGameScores: vi.fn(() => new Map<string, number>()),
          },
        },
      ],
    });

    service = TestBed.inject(GameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create and save a valid game', () => {
    const game = service.createGame(['Alice', 'Bob']);

    expect(game).not.toBeNull();
    expect(game?.players.map((player) => player.name)).toEqual(['Alice', 'Bob']);
    expect(game?.status).toBe('in-progress');
    expect(
      game?.rounds.every((round) => round.scores.every((score) => score.points === null)),
    ).toBe(true);
    expect(savedGames).toHaveLength(1);
    expect(service.games()).toHaveLength(1);
  });

  it('should trim player names', () => {
    const game = service.createGame([' Alice ', ' Bob ']);

    expect(game?.players.map((player) => player.name)).toEqual(['Alice', 'Bob']);
  });

  it('should reject fewer than two players', () => {
    expect(service.createGame(['Alice'])).toBeNull();
    expect(savedGames).toHaveLength(0);
  });

  it('should reject more than eight players', () => {
    const names = Array.from({ length: 9 }, (_, index) => `Player ${index + 1}`);

    expect(service.createGame(names)).toBeNull();
    expect(savedGames).toHaveLength(0);
  });

  it('should reject empty player names', () => {
    expect(service.createGame(['Alice', '   '])).toBeNull();
    expect(savedGames).toHaveLength(0);
  });

  it('should reject duplicate player names regardless of case', () => {
    expect(service.createGame(['Alice', 'alice'])).toBeNull();
    expect(savedGames).toHaveLength(0);
  });

  it('should reject a game if saving fails', () => {
    const storage = TestBed.inject(StorageService);
    vi.mocked(storage.saveGame).mockReturnValue(false);

    expect(service.createGame(['Alice', 'Bob'])).toBeNull();
    expect(service.games()).toHaveLength(0);
  });

  describe('updateRound', () => {
    function createTestGame() {
      return service.createGame(['Alice', 'Bob'])!;
    }

    function createTestRound(game: Game, number = 1): Round {
      return {
        number,
        scores: game.players.map((player, index) => ({
          playerId: player.id,
          bid: index,
          tricks: index,
          bonus: 0,
          points: null,
        })),
      };
    }

    it('should save a new round', () => {
      const game = createTestGame();
      const firstRound = createTestRound(game, 1);

      const updatedRound: Round = {
        ...firstRound,
        scores: firstRound.scores.map((score) => ({
          ...score,
          bid: score.playerId === game.players[0].id ? 0 : 1,
          tricks: score.playerId === game.players[0].id ? 0 : 1,
        })),
      };

      expect(service.updateRound(game.id, updatedRound)).toBe(true);

      const savedRounds = service.getGame(game.id)!.rounds;
      expect(savedRounds).toHaveLength(game.roundCount);
      expect(savedRounds[0]).toEqual(updatedRound);
    });

    it('should replace an existing round instead of duplicating it', () => {
      const game = createTestGame();
      const firstRound = createTestRound(game, 1);
      const updatedRound: Round = {
        ...firstRound,
        scores: firstRound.scores.map((score) => ({
          ...score,
          bonus: 20,
        })),
      };

      service.updateRound(game.id, firstRound);
      expect(service.updateRound(game.id, updatedRound)).toBe(true);

      const savedRounds = service.getGame(game.id)!.rounds;
      expect(savedRounds).toHaveLength(game.roundCount);
      expect(savedRounds[0]).toEqual(updatedRound);
    });

    it('should keep rounds sorted by round number', () => {
      const game = createTestGame();

      service.updateRound(game.id, createTestRound(game, 3));
      service.updateRound(game.id, createTestRound(game, 1));
      service.updateRound(game.id, createTestRound(game, 2));
    });

    it('should reject an unknown game', () => {
      const game = createTestGame();
      const round = createTestRound(game);

      expect(service.updateRound('unknown-id', round)).toBe(false);
    });

    it('should create a game with 10 rounds', () => {
      const game = service.createGame(['Alice', 'Bob']);

      expect(game?.roundCount).toBe(10);
      expect(game?.rounds).toHaveLength(10);
    });

    it('should reject a round number outside the game limits', () => {
      const game = createTestGame();

      expect(service.updateRound(game.id, createTestRound(game, 0))).toBe(false);
      expect(service.updateRound(game.id, createTestRound(game, 11))).toBe(false);
    });

    it('should reject a round with a missing player score', () => {
      const game = createTestGame();
      const round = createTestRound(game);

      const incompleteRound: Round = {
        ...round,
        scores: round.scores.slice(0, 1),
      };

      expect(service.updateRound(game.id, incompleteRound)).toBe(false);
      expect(service.getGame(game.id)?.rounds).toHaveLength(game.roundCount);
      expect(service.getGame(game.id)?.rounds[0]).not.toEqual(incompleteRound);
    });

    it('should reject duplicate player scores', () => {
      const game = createTestGame();
      const round = createTestRound(game);

      const invalidRound: Round = {
        ...round,
        scores: [round.scores[0], round.scores[0]],
      };

      expect(service.updateRound(game.id, invalidRound)).toBe(false);
    });

    it('should reject a score belonging to an unknown player', () => {
      const game = createTestGame();
      const round = createTestRound(game);

      const invalidRound: Round = {
        ...round,
        scores: round.scores.map((score, index) =>
          index === 0 ? { ...score, playerId: 'unknown-player' } : score,
        ),
      };

      expect(service.updateRound(game.id, invalidRound)).toBe(false);
    });
  });

  describe('canFinishGame', () => {
    function createTestGame() {
      return service.createGame(['Alice', 'Bob'])!;
    }

    function createCompleteGame() {
      const game = service.createGame(['Alice', 'Bob'])!;

      for (let number = 1; number <= game.roundCount; number++) {
        const round: Round = {
          number,
          scores: game.players.map((player) => ({
            playerId: player.id,
            bid: 1,
            tricks: 1,
            bonus: 0,
            points: 20,
          })),
        };

        service.updateRound(game.id, round);
      }

      return service.getGame(game.id)!;
    }

    it('should return false for an incomplete game', () => {
      const game = createTestGame();

      expect(service.canFinishGame(game.id)).toBe(false);
    });

    it('should return true for a fully scored game', () => {
      const game = createCompleteGame();

      expect(service.canFinishGame(game.id)).toBe(true);
    });

    it('should accept zero as a valid score', () => {
      const game = createCompleteGame();

      game.rounds[0].scores[0].points = 0;
      service.updateRound(game.id, game.rounds[0]);

      expect(service.canFinishGame(game.id)).toBe(true);
    });

    it('should return false for an already completed game', () => {
      const game = createCompleteGame();

      service.finishGame(game.id);

      expect(service.canFinishGame(game.id)).toBe(false);
    });

    it('should return false for an unknown game', () => {
      expect(service.canFinishGame('unknown-id')).toBe(false);
    });
  });

  describe('finishGame', () => {
    function createCompleteGame() {
      const game = service.createGame(['Alice', 'Bob'])!;

      for (let number = 1; number <= game.roundCount; number++) {
        const round: Round = {
          number,
          scores: game.players.map((player) => ({
            playerId: player.id,
            bid: 1,
            tricks: 1,
            bonus: 0,
            points: 20,
          })),
        };

        service.updateRound(game.id, round);
      }

      return service.getGame(game.id)!;
    }

    it('should reject an unknown game', () => {
      expect(service.finishGame('unknown-id')).toBe(false);
    });

    it('should reject a game with missing rounds', () => {
      const game = service.createGame(['Alice', 'Bob'])!;

      expect(service.finishGame(game.id)).toBe(false);
      expect(service.getGame(game.id)?.status).toBe('in-progress');
    });

    it('should reject a game with incomplete scores', () => {
      const game = service.createGame(['Alice', 'Bob'])!;

      for (let number = 1; number <= game.roundCount; number++) {
        const round: Round = {
          number,
          scores: game.players.map((player, index) => ({
            playerId: player.id,
            bid: index === 0 ? null : 1,
            tricks: index === 0 ? null : 1,
            bonus: 0,
            points: null,
          })),
        };

        service.updateRound(game.id, round);
      }

      expect(service.finishGame(game.id)).toBe(false);
      expect(service.getGame(game.id)?.status).toBe('in-progress');
    });

    it('should complete a fully scored game', () => {
      const game = createCompleteGame();

      expect(service.finishGame(game.id)).toBe(true);

      const completedGame = service.getGame(game.id)!;
      expect(completedGame.status).toBe('completed');
      expect(completedGame.completedAt).not.toBeNull();
    });

    it('should select the player with the highest score as winner', () => {
      const game = createCompleteGame();

      game.rounds.forEach((round) => {
        round.scores[0].points = 30;
        round.scores[1].points = 10;
      });

      game.rounds.forEach((round) => {
        service.updateRound(game.id, round);
      });

      expect(service.finishGame(game.id)).toBe(true);
      expect(service.getGame(game.id)?.winnerId).toBe(game.players[0].id);
    });

    it('should not select a unique winner in case of a tie', () => {
      const game = createCompleteGame();
      const scoring = TestBed.inject(ScoringService);

      vi.mocked(scoring.calculateGameScores).mockReturnValue(
        new Map([
          [game.players[0].id, 100],
          [game.players[1].id, 100],
        ]),
      );

      expect(service.finishGame(game.id)).toBe(true);
      expect(service.getGame(game.id)?.winnerId).toBeNull();
    });

    it('should reject finishing an already completed game', () => {
      const game = createCompleteGame();

      expect(service.finishGame(game.id)).toBe(true);
      expect(service.finishGame(game.id)).toBe(false);
    });
  });

  describe('deleteGame', () => {
    it('should delete an existing game', () => {
      const game = service.createGame(['Alice', 'Bob'])!;

      expect(service.deleteGame(game.id)).toBe(true);
      expect(service.getGame(game.id)).toBeUndefined();
      expect(service.games()).toHaveLength(0);
    });

    it('should return true when deleting an unknown game', () => {
      expect(service.deleteGame('unknown-id')).toBe(true);
    });

    it('should keep other games when deleting one game', () => {
      const game1 = service.createGame(['Alice', 'Bob'])!;
      const game2 = service.createGame(['Charlie', 'David'])!;

      expect(service.deleteGame(game1.id)).toBe(true);

      expect(service.games()).toHaveLength(1);
      expect(service.games()[0].id).toBe(game2.id);
    });

    it('should return false if storage deletion fails', () => {
      const game = service.createGame(['Alice', 'Bob'])!;
      const storage = TestBed.inject(StorageService);

      vi.mocked(storage.deleteGame).mockReturnValue(false);

      expect(service.deleteGame(game.id)).toBe(false);
      expect(service.getGame(game.id)).toBeDefined();
    });
  });
});
