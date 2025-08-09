import { Response } from 'express';
import { TeamRow, PlayerRow } from '../types';

export interface TeamResponse {
  id: number;
  name: string;
  budget: number;
  players: {
    id: number;
    name: string;
    position: string;
    market_value: number;
  }[];
}

export function formatTeamResponse(team: TeamRow, players: PlayerRow[]): TeamResponse {
  return {
    id: team.id,
    name: team.name,
    budget: team.budget,
    players: players.map(player => ({
      id: player.id,
      name: player.name,
      position: player.position,
      market_value: player.market_value,
    })),
  };
}

export function sendResponse(res: Response, statusCode: number, message: string, data: any = null) {
  res.status(statusCode).json({ statusCode, message, data });
}