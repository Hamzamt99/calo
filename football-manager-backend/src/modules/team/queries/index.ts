export const INSERT_TEAM_QUERY = `INSERT INTO teams (user_id, name, budget) VALUES (:user_id, :name, :budget)`;
export const GET_TEAM_QUERY = `SELECT * FROM teams WHERE id = :id`;
export const INSERT_PLAYERS_TEAM = `INSERT INTO team_players (team_id, player_id, createdAt) VALUES (:team_id, :player_id, NOW())`
export const GET_PLAYERS_QUERY = `SELECT * FROM players`;