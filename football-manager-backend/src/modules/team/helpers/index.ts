import { Position } from '../types';
import { PlayerRow } from '../types'

export function shuffle<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}

export function filterPlayersByPosition(players: PlayerRow[], position: Position): PlayerRow[] {
  return players.filter(player => player.position === position);
}
