import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export interface LoginDto {
  email: string;
  password: string;
}
export interface RegisterDto extends LoginDto {
  name: string;
  username: string;
  lastName: string;
}

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

export async function getListings(token: string, filters: any) {
  const params = new URLSearchParams();
  if (filters.teamName) params.append('teamName', filters.teamName);
  if (filters.playerName) params.append('playerName', filters.playerName);
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
  const res = await axios.get(`${API_URL}/market?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
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
