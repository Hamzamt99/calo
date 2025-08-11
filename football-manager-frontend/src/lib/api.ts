import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface LoginDto {
  email: string;
  password: string;
}
export interface RegisterDto extends LoginDto {
  name: string;
  username: string;
  lastName: string;
}

type ListingFilters = {
  teamName?: string;
  playerName?: string;
  maxPrice?: string | number;
};

export async function registerOrLogin(dto: LoginDto | RegisterDto) {
  const res = await axios.post(`${API_URL}/auth`, dto);
  return res.data; // { token: string }
}

export async function getTeam(token: string) {
  const res = await axios.get(`${API_URL}/team`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data; // { id, name, budget, players: [] }
}

export async function getListings(token: string, filters: ListingFilters = {}) {
  const params: Record<string, string> = {};

  if (filters.teamName && filters.teamName.trim()) {
    params.teamName = filters.teamName.trim();
  }
  if (filters.playerName && filters.playerName.trim()) {
    params.playerName = filters.playerName.trim();
  }
  const maxNum = Number(filters.maxPrice);
  if (!Number.isNaN(maxNum) && maxNum > 0) {
    params.maxPrice = String(maxNum);
  }

  const res = await axios.get(`${API_URL}/market`, {
    headers: { Authorization: `Bearer ${token}` },
    params, // ← let axios build & encode the query string
  });

  // Adjust depending on your API shape
  return res.data?.data ?? res.data;
}

export async function listPlayer(token: string, playerId: number, price: number) {
  const res = await axios.post(
    `${API_URL}/market/listings`,
    { playerId, askingPrice: price },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.data;
}

export async function unlistPlayer(token: string, listingId: number) {
  const res = await axios.delete(`${API_URL}/market/listings/${listingId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function buyPlayer(token: string, listingId: number) {
  const res = await axios.post(
    `${API_URL}/market/listings/${listingId}/buy`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.data;
}
