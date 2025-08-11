// Select listings with optional filters
export const GET_LISTINGS_QUERY = `
  SELECT
    tl.id,
    tl.player_id,
    p.name AS player_name,
    tl.seller_team_id,
    t.name AS seller_team_name,
    tl.asking_price,
    tl.posted_at
  FROM transfer_listings tl
  JOIN players p ON p.id = tl.player_id
  JOIN teams t ON t.id = tl.seller_team_id
  WHERE
    (:teamName IS NULL  OR LOWER(t.name) LIKE :teamName)
    AND (:playerName IS NULL OR LOWER(p.name) LIKE :playerName)
    AND (:maxPrice IS NULL OR tl.asking_price <= :maxPrice)
  ORDER BY tl.posted_at DESC
`;

// Insert new listing
export const INSERT_LISTING_QUERY = `
  INSERT INTO transfer_listings (player_id, seller_team_id, asking_price)
  VALUES (:player_id, :seller_team_id, :asking_price)
`;

// Remove listing
export const DELETE_LISTING_QUERY = `
  DELETE FROM transfer_listings
  WHERE id = :id AND seller_team_id = :seller_team_id
`;

// Select a single listing for buying (with row lock)
export const GET_LISTING_FOR_UPDATE = `
  SELECT *
  FROM transfer_listings
  WHERE id = :id
  FOR UPDATE
`;

export const GET_LISTING_BY_ID_QUERY = `SELECT 
      tl.*, 
      p.name AS player_name, 
      t.name AS seller_team_name
   FROM transfer_listings tl
   JOIN players p ON p.id = tl.player_id
   JOIN teams t ON t.id = tl.seller_team_id
   WHERE tl.id = :id`;

export const CHECK_IF_OWNER_QUERY = `SELECT id FROM transfer_listings WHERE id = :id AND seller_team_id = :seller_team_id`;
