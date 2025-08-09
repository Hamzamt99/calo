export interface TransferListingRow {
  id: number;
  player_id: number;
  seller_team_id: number;
  asking_price: number;
  posted_at: Date;
}

export interface TransactionRow {
  id: number;
  buyer_team_id: number | null;
  seller_team_id: number | null;
  player_id: number | null;
  price: number;
  created_at: Date;
}

export interface FilterListingsParams {
  teamName?: string;
  playerName?: string;
  maxPrice?: number;
}

export interface AddListingDto {
  playerId: number;
  askingPrice: number;
}

export interface BuyListingDto {
  listingId: number;
}

export interface ListingResponse {
  id: number;
  playerId: number;
  playerName: string;
  sellerTeamId: number;
  sellerTeamName: string;
  askingPrice: number;
  postedAt: Date;
}
