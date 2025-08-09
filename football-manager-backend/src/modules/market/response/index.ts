import { ListingResponse } from '../types';
// i created this file as a response formatter for the auth module
import { Response } from 'express';

export function sendResponse(res: Response, statusCode: number, message: string, data: any = null) {
  res.status(statusCode).json({ statusCode, message, data });
}

export function formatListingResponse(row: any): ListingResponse {
  return {
    id: row.id,
    playerId: row.player_id,
    playerName: row.player_name,
    sellerTeamId: row.seller_team_id,
    sellerTeamName: row.seller_team_name,
    askingPrice: Number(row.asking_price),
    postedAt: row.posted_at,
  };
}
