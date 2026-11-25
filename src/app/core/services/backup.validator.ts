import type { BackupFile } from '../../models/backup.model';
import type { Game } from '../../models/game.model';
import type { Player } from '../../models/player.model';
import type { Round, PlayerRoundScore } from '../../models/round.model';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function isPlayer(value: unknown): value is Player {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    value['id'].length > 0 &&
    typeof value['name'] === 'string' &&
    value['name'].trim().length > 0 &&
    value['name'].length <= 20
  );
}

function isPlayerRoundScore(value: unknown): value is PlayerRoundScore {
  return (
    isRecord(value) &&
    typeof value['playerId'] === 'string' &&
    isNullableNumber(value['bid']) &&
    isNullableNumber(value['tricks']) &&
    typeof value['bonus'] === 'number' &&
    Number.isFinite(value['bonus']) &&
    isNullableNumber(value['points'])
  );
}

function isRound(value: unknown): value is Round {
  return (
    isRecord(value) &&
    typeof value['number'] === 'number' &&
    Number.isInteger(value['number']) &&
    Array.isArray(value['scores']) &&
    value['scores'].every(isPlayerRoundScore)
  );
}

function isGame(value: unknown): value is Game {
  if (
    !isRecord(value) ||
    typeof value['id'] !== 'string' ||
    value['id'].length === 0 ||
    !isValidDate(value['createdAt']) ||
    (value['completedAt'] !== null && !isValidDate(value['completedAt'])) ||
    (value['status'] !== 'in-progress' && value['status'] !== 'completed') ||
    value['roundCount'] !== 10 ||
    !Array.isArray(value['players']) ||
    value['players'].length < 2 ||
    value['players'].length > 8 ||
    !value['players'].every(isPlayer) ||
    !Array.isArray(value['rounds']) ||
    value['rounds'].length !== 10
  ) {
    return false;
  }

  const players = value['players'];
  const playerIds = players.map((player) => player.id);

  if (new Set(playerIds).size !== playerIds.length) return false;

  const rounds = value['rounds'];

  if (!rounds.every(isRound)) return false;

  const roundNumbers = rounds.map((round) => round.number);

  if (
    new Set(roundNumbers).size !== 10 ||
    Array.from({ length: 10 }, (_, index) => index + 1).some(
      (number) => !roundNumbers.includes(number),
    )
  ) {
    return false;
  }

  for (const round of rounds) {
    if (
      round.scores.length !== players.length ||
      new Set(round.scores.map((score) => score.playerId)).size !== players.length ||
      round.scores.some((score) => !playerIds.includes(score.playerId))
    ) {
      return false;
    }
  }

  const winnerId = value['winnerId'];

  if (winnerId !== null && (typeof winnerId !== 'string' || !playerIds.includes(winnerId))) {
    return false;
  }

  if (value['status'] === 'in-progress') {
    return value['completedAt'] === null && winnerId === null;
  }

  return value['completedAt'] !== null;
}

export function isBackupFile(value: unknown): value is BackupFile {
  return (
    isRecord(value) &&
    value['app'] === 'SkullFlix' &&
    value['version'] === 1 &&
    isValidDate(value['exportedAt']) &&
    Array.isArray(value['games']) &&
    value['games'].every(isGame) &&
    new Set(value['games'].map((game) => game.id)).size === value['games'].length
  );
}
