import { Injectable } from '@angular/core';
import type { Game } from '../../models/game.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly storageKey = 'skullflix_games_v1';

  getGames(): Game[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const storedData = localStorage.getItem(this.storageKey);

      if (storedData === null) {
        return [];
      }

      const games: unknown = JSON.parse(storedData);

      if (!Array.isArray(games)) {
        return [];
      }

      return games as Game[];
    } catch {
      // Les données absentes ou illisibles ne doivent pas
      // empêcher l'application de démarrer.
      return [];
    }
  }

  saveGame(game: Game): boolean {
    const games = this.getGames();
    const existingIndex = games.findIndex((savedGame) => savedGame.id === game.id);

    if (existingIndex === -1) {
      games.push(game);
    } else {
      games[existingIndex] = game;
    }

    return this.saveGames(games);
  }

  deleteGame(gameId: string): boolean {
    const games = this.getGames().filter((game) => game.id !== gameId);

    return this.saveGames(games);
  }

  private saveGames(games: Game[]): boolean {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(games));

      return true;
    } catch {
      // Par exemple, stockage indisponible ou quota dépassé.
      return false;
    }
  }

  replaceGames(games: Game[]): boolean {
    return this.saveGames(games);
  }
}
