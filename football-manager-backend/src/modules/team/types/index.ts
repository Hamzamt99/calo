export type Position = 'GK' | 'DF' | 'MF' | 'FW';

export interface PositionDistribution {
  GK: number;
  DF: number;
  MF: number;
  FW: number;
}

export interface TeamCreateParams {
  userId: number;
  teamName?: string; // optional, can be "Team of [User]"
}

export interface TeamRow {
  id: number;
  user_id: number;
  name: string;
  budget: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface PlayerRow {
  id: number;
  name: string;
  position: Position;
  market_value: number;
  team_id?: number;
}