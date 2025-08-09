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
  DELETE_LISTING_QUERY,
  GET_LISTING_FOR_UPDATE,
  GET_LISTING_BY_ID_QUERY,
  CHECK_IF_OWNER_QUERY,
} from "../queries";
import { formatListingResponse } from "../response";
import { computeFinalPrice } from "../helpers";

export class MarketService {
  /**
   * Fetch transfer listings with optional filters.
   */
  static async getListings(
    params: FilterListingsParams
  ): Promise<ListingResponse[]> {
    const { teamName, playerName, maxPrice } = params;

    const rows = await database.query(GET_LISTINGS_QUERY, {
      type: QueryTypes.SELECT,
      replacements: {
        teamName: teamName ?? null,
        playerName: playerName ?? null,
        maxPrice: maxPrice ?? null,
      },
    });

    return rows.map(formatListingResponse);
  }

  /**
   * List a player for sale. Ensures:
   *   - Player belongs to sellerTeamId
   *   - Player is not already listed
   *   - Seller has > 15 players (so selling doesn’t violate 15–25 rule)
   */
  static async addListing(sellerTeamId: number, dto: AddListingDto) {
    const { playerId, askingPrice } = dto;

    const transaction = await database.transaction();

    try {
      // Verify player belongs to seller team and count roster
      const [ownerCheck] = await database.query<any>(
        `
        SELECT team_id
        FROM team_players
        WHERE player_id = :player_id
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { player_id: playerId },
          transaction,
        }
      );

      if (!ownerCheck || ownerCheck.team_id !== sellerTeamId) {
        throw new Error("You do not own this player");
      }

      const [rosterCount] = await database.query<any>(
        `
        SELECT COUNT(*) AS count
        FROM team_players
        WHERE team_id = :team_id
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { team_id: sellerTeamId },
          transaction,
        }
      );

      if (parseInt(rosterCount.count, 10) <= 15) {
        throw new Error("Cannot list player; team would fall below 15 players");
      }

      // Check if already listed
      const [existing] = await database.query<any>(
        `
        SELECT id FROM transfer_listings WHERE player_id = :player_id
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { player_id: playerId },
          transaction,
        }
      );
      if (existing) {
        throw new Error("Player is already listed");
      }

      // Insert listing
      const [insertId] = await database.query<any>(INSERT_LISTING_QUERY, {
        type: QueryTypes.INSERT,
        replacements: {
          player_id: playerId,
          seller_team_id: sellerTeamId,
          asking_price: askingPrice,
        },
        transaction,
      });

      const [listing] = await database.query<any>(GET_LISTING_BY_ID_QUERY, {
        type: QueryTypes.SELECT,
        replacements: { id: insertId },
        transaction,
      });

      await transaction.commit();

      return formatListingResponse(listing);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Remove a player from transfer listings.
   */
  static async removeListing(sellerTeamId: number, listingId: number) {
    const [existing] = await database.query(
    CHECK_IF_OWNER_QUERY,
      {
        type: QueryTypes.SELECT,
        replacements: {
          id: listingId,
          seller_team_id: sellerTeamId,
        },
      }
    );

    if (!existing) {
      throw new Error("Listing not found or not owned by you");
    }

    await database.query(DELETE_LISTING_QUERY, {
      type: QueryTypes.DELETE,
      replacements: {
        id: listingId,
        seller_team_id: sellerTeamId,
      },
    });

    return { message: "Listing removed successfully" };
  }
  /**
   * Buy a listed player:
   *   - Buyer != Seller
   *   - Buyer has enough budget
   *   - Buyer roster < 25; Seller roster > 15
   *   - Move player and adjust budgets atomically
   */
  static async buyListing(buyerTeamId: number, listingId: number) {
    const transaction = await database.transaction();

    try {
      // Lock listing row
      const [listing] = await database.query<any>(GET_LISTING_FOR_UPDATE, {
        type: QueryTypes.SELECT,
        replacements: { id: listingId },
        transaction,
      });
      if (!listing) {
        throw new Error("Listing not found");
      }

      if (listing.seller_team_id === buyerTeamId) {
        throw new Error("Cannot buy your own player");
      }

      // Calculate price (95% of asking)
      const price = computeFinalPrice(Number(listing.asking_price));

      // Fetch budgets and roster counts for buyer and seller
      const [buyer] = await database.query<any>(
        `SELECT budget FROM teams WHERE id = :id FOR UPDATE`,
        {
          type: QueryTypes.SELECT,
          replacements: { id: buyerTeamId },
          transaction,
        }
      );
      const [seller] = await database.query<any>(
        `SELECT budget FROM teams WHERE id = :id FOR UPDATE`,
        {
          type: QueryTypes.SELECT,
          replacements: { id: listing.seller_team_id },
          transaction,
        }
      );
      if (!buyer || !seller) {
        throw new Error("Invalid buyer or seller");
      }
      if (Number(buyer.budget) < price) {
        throw new Error("Insufficient funds");
      }

      // Check roster sizes
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

      // Transfer money
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

      // Move player
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
          type: QueryTypes.INSERT,
          replacements: { buyerId: buyerTeamId, playerId: listing.player_id },
          transaction,
        }
      );

      // Record the transaction
      await database.query(
        `INSERT INTO transactions (buyer_team_id, seller_team_id, player_id, price, created_at)
         VALUES (:buyer_team_id, :seller_team_id, :player_id, :price, NOW())`,
        {
          type: QueryTypes.INSERT,
          replacements: {
            buyer_team_id: buyerTeamId,
            seller_team_id: listing.seller_team_id,
            player_id: listing.player_id,
            price,
          },
          transaction,
        }
      );

      // Remove the listing
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
