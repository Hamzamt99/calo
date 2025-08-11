import { database } from "../../../config/database";
import { QueryTypes } from "sequelize";
import {
  FilterListingsParams,
  AddListingDto,
  BuyListingDto,
  ListingResponse,
} from "../types";
import {
  GET_LISTINGS_QUERY,
  INSERT_LISTING_QUERY,
  GET_LISTING_FOR_UPDATE,
  GET_LISTING_BY_ID_QUERY,
} from "../queries";
import { formatListingResponse } from "../response";
import { computeFinalPrice } from "../helpers";

export class MarketService {
  /**
   * Fetch transfer listings with optional filters.
   */
static async getListings(params: FilterListingsParams): Promise<ListingResponse[]> {
  const { teamName, playerName, maxPrice } = params;

  const toLike = (s?: string | null) => {
    if (!s) return null;
    const trimmed = String(s).trim().toLowerCase();
    return trimmed ? `%${trimmed}%` : null; // <-- add wildcards
  };

  const rows = await database.query(GET_LISTINGS_QUERY, {
    type: QueryTypes.SELECT,
    replacements: {
      teamName: toLike(teamName),
      playerName: toLike(playerName),
      maxPrice: typeof maxPrice === "number" ? maxPrice : maxPrice ?? null,
    },
  });

  return rows.map(formatListingResponse);
}

  /**
   * List a player for sale. Ensures:
   *   - Player belongs to the authenticated USER (not team id)
   *   - Player is not already listed
   *   - Seller roster stays > 15
   */
  static async addListing(sellerUserId: number, dto: AddListingDto) {
    const { playerId, askingPrice } = dto;
    const transaction = await database.transaction();

    try {

      const [teamInfo] = await database.query<any>(
      `
      SELECT t.id AS team_id, COUNT(tp.player_id) AS cnt
      FROM teams t
      LEFT JOIN team_players tp ON tp.team_id = t.id
      WHERE t.user_id = :uid
      GROUP BY t.id
      FOR UPDATE
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { uid: sellerUserId },
        transaction,
      }
    );

    if (!teamInfo?.team_id) {
      throw new Error("You do not have a team");
    }
    const rosterCount = Number(teamInfo.cnt ?? 0);
    if (rosterCount <= 15) {
      throw new Error("Cannot list player; team has 15 or fewer players");
    }

      // 1) Resolve who owns this player (team + user) and lock that row
      const ownerRows = await database.query<{ team_id: number; user_id: number }>(
        `
        SELECT tp.team_id, t.user_id
        FROM team_players tp
        JOIN teams t ON t.id = tp.team_id
        WHERE tp.player_id = :player_id
        FOR UPDATE
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { player_id: playerId },
          transaction,
        }
      );
      const owner = ownerRows[0];

      if (!owner) {
        throw new Error("Player is not assigned to any team");
      }
      if (owner.user_id !== sellerUserId) {
        throw new Error("You do not own this player");
      }

      // 3) Not already listed
      const [existing] = await database.query<any>(
        `SELECT id FROM transfer_listings WHERE player_id = :player_id`,
        {
          type: QueryTypes.SELECT,
          replacements: { player_id: playerId },
          transaction,
        }
      );
      if (existing) {
        throw new Error("Player is already listed");
      }

      // 4) Insert listing (use team_id resolved from owner)
      await database.query(INSERT_LISTING_QUERY, {
        // TS sometimes complains on INSERT; cast to any to avoid signature mismatch
        type: QueryTypes.INSERT as any,
        replacements: {
          player_id: playerId,
          seller_team_id: owner.team_id,
          asking_price: askingPrice,
        },
        transaction,
      });

      // 5) Read back the new listing id and return full row via existing query
      const [idRow] = await database.query<any>(
        `SELECT id FROM transfer_listings WHERE player_id = :player_id`,
        {
          type: QueryTypes.SELECT,
          replacements: { player_id: playerId },
          transaction,
        }
      );
      const [listing] = await database.query<any>(GET_LISTING_BY_ID_QUERY, {
        type: QueryTypes.SELECT,
        replacements: { id: idRow.id },
        transaction,
      });

      await database.query(
        `DELETE FROM team_players WHERE team_id = :teamId AND player_id = :playerId`,
        {
          type: QueryTypes.DELETE,
          replacements: {
            teamId: listing.seller_team_id,
            playerId: playerId,
          },
          transaction,
        }
      );


      await transaction.commit();
      return formatListingResponse(listing);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Remove a player from transfer listings.
   * Verifies the listing belongs to the authenticated USER.
   */
  static async removeListing(sellerUserId: number, listingId: number) {
    const transaction = await database.transaction();
    try {
      // Ensure this listing belongs to a team owned by this user
      const [existing] = await database.query<any>(
        `
        SELECT tl.id
        FROM transfer_listings tl
        JOIN teams t ON t.id = tl.seller_team_id
        WHERE tl.id = :id AND t.user_id = :user_id
        FOR UPDATE
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { id: listingId, user_id: sellerUserId },
          transaction,
        }
      );

      if (!existing) {
        throw new Error("Listing not found or not owned by you");
      }

      await database.query(`DELETE FROM transfer_listings WHERE id = :id`, {
        type: QueryTypes.DELETE,
        replacements: { id: listingId },
        transaction,
      });

      await transaction.commit();
      return { message: "Listing removed successfully" };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Buy a listed player:
   *   - Buyer != Seller
   *   - Buyer has enough budget
   *   - Buyer roster < 25; Seller roster > 15
   *   - Move player and adjust budgets atomically
   * Uses buyerUserId (not team id) and derives buyer's team.
   */
  static async buyListing(buyerUserId: number, listingId: number) {
    const transaction = await database.transaction();

    try {
      // 1) Lock the listing
      const [listing] = await database.query<any>(GET_LISTING_FOR_UPDATE, {
        type: QueryTypes.SELECT,
        replacements: { id: listingId },
        transaction,
      });
      if (!listing) {
        throw new Error("Listing not found");
      }

      // 2) Resolve buyer team by user (and lock)
      const [buyerTeam] = await database.query<any>(
        `SELECT id AS team_id, budget FROM teams WHERE user_id = :uid FOR UPDATE`,
        {
          type: QueryTypes.SELECT,
          replacements: { uid: buyerUserId },
          transaction,
        }
      );
      if (!buyerTeam) {
        throw new Error("Buyer has no team");
      }
      const buyerTeamId = buyerTeam.team_id;

      if (listing.seller_team_id === buyerTeamId) {
        throw new Error("Cannot buy your own player");
      }

      // 3) Calculate final price (e.g., 95% of asking)
      const price = computeFinalPrice(Number(listing.asking_price));

      // 4) Lock seller team too
      const [sellerTeam] = await database.query<any>(
        `SELECT id AS team_id, budget FROM teams WHERE id = :id FOR UPDATE`,
        {
          type: QueryTypes.SELECT,
          replacements: { id: listing.seller_team_id },
          transaction,
        }
      );
      if (!sellerTeam) {
        throw new Error("Invalid seller team");
      }

      // 5) Budget checks
      if (Number(buyerTeam.budget) < price) {
        throw new Error("Insufficient funds");
      }

      // 6) Roster checks
      const [buyerCount] = await database.query<any>(
        `SELECT COUNT(*) AS count FROM team_players WHERE team_id = :id`,
        {
          type: QueryTypes.SELECT,
          replacements: { id: buyerTeamId },
          transaction,
        }
      );
      const [sellerCount] = await database.query<any>(
        `SELECT COUNT(*) AS count FROM team_players WHERE team_id = :id`,
        {
          type: QueryTypes.SELECT,
          replacements: { id: listing.seller_team_id },
          transaction,
        }
      );

      if (parseInt(buyerCount.count, 10) >= 25) {
        throw new Error("Buyer already has 25 players");
      }
      if (parseInt(sellerCount.count, 10) <= 15) {
        throw new Error("Seller cannot go below 15 players");
      }

      // 7) Transfer money
      await database.query(
        `UPDATE teams SET budget = budget - :price WHERE id = :id`,
        {
          type: QueryTypes.UPDATE,
          replacements: { price, id: buyerTeamId },
          transaction,
        }
      );
      await database.query(
        `UPDATE teams SET budget = budget + :price WHERE id = :id`,
        {
          type: QueryTypes.UPDATE,
          replacements: { price, id: listing.seller_team_id },
          transaction,
        }
      );

      // 8) Move player team assignment
      await database.query(
        `DELETE FROM team_players WHERE team_id = :sellerId AND player_id = :playerId`,
        {
          type: QueryTypes.DELETE,
          replacements: {
            sellerId: listing.seller_team_id,
            playerId: listing.player_id,
          },
          transaction,
        }
      );
      await database.query(
        `INSERT INTO team_players (team_id, player_id, createdAt) VALUES (:buyerId, :playerId, NOW())`,
        {
          type: QueryTypes.INSERT as any,
          replacements: { buyerId: buyerTeamId, playerId: listing.player_id },
          transaction,
        }
      );

      // 9) Record transaction
      await database.query(
        `INSERT INTO transactions (buyer_team_id, seller_team_id, player_id, price, created_at)
         VALUES (:buyer_team_id, :seller_team_id, :player_id, :price, NOW())`,
        {
          type: QueryTypes.INSERT as any,
          replacements: {
            buyer_team_id: buyerTeamId,
            seller_team_id: listing.seller_team_id,
            player_id: listing.player_id,
            price,
          },
          transaction,
        }
      );

      // 10) Remove listing
      await database.query(`DELETE FROM transfer_listings WHERE id = :id`, {
        type: QueryTypes.DELETE,
        replacements: { id: listingId },
        transaction,
      });

      await transaction.commit();
      return { price };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
