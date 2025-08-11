import { database } from "../../../config/database";
import { QueryTypes } from "sequelize";
import {
  TeamCreateParams,
  PositionDistribution,
  TeamRow,
  PlayerRow,
} from "../types";
import { shuffle, filterPlayersByPosition } from "../helpers";
import { formatTeamResponse } from "../response";
import {
  GET_PLAYERS_QUERY,
  GET_TEAM_QUERY,
  INSERT_PLAYERS_TEAM,
  INSERT_TEAM_QUERY,
} from "../queries";
import { DISTRIBUTION } from "../enums";

export class TeamService {
  static async getTeamWithPlayers(
    userId: number
  ): Promise<{ team: TeamRow; players: PlayerRow[] }> {
    const [team] = await database.query<TeamRow>(
      `SELECT * FROM teams WHERE user_id = :user_id`,
      {
        type: QueryTypes.SELECT,
        replacements: { user_id: userId },
      }
    );

    if (!team) throw new Error("Team not found");

    const players = await database.query<PlayerRow>(
       `SELECT p.*
        FROM players p
        JOIN team_players tp ON tp.player_id = p.id
        WHERE tp.team_id = :team_id
        AND NOT EXISTS (
          SELECT 1 FROM transfer_listings tl
          WHERE tl.player_id = p.id
      )`,
      {
        type: QueryTypes.SELECT,
        replacements: { team_id: team.id },
      }
    );

    return { team, players };
  }

  static async createTeamAndAssignPlayers(params: TeamCreateParams) {
    const { userId } = params;

    const transaction = await database.transaction();

    try {
      const rostered = await database.query(
        `SELECT player_id FROM team_players`,
        { type: QueryTypes.SELECT, transaction }
      );
      const rosteredIds = new Set(rostered.map((r: any) => r.player_id));

      const allPlayers: PlayerRow[] = await database.query(GET_PLAYERS_QUERY, {
        type: QueryTypes.SELECT,
        transaction,
      });
      const availablePlayers = allPlayers.filter((p) => !rosteredIds.has(p.id));

      const selectedPlayers: PlayerRow[] = [];

      for (const pos of Object.keys(DISTRIBUTION)) {
        const needed = DISTRIBUTION[pos as keyof PositionDistribution];
        const candidates = filterPlayersByPosition(
          availablePlayers,
          pos as keyof PositionDistribution
        );
        if (candidates.length < needed) {
          throw new Error(`Not enough available players for ${pos}`);
        }
        candidates.sort(
          (a, b) => Number(a.market_value) - Number(b.market_value)
        );
        const chosen = candidates.slice(0, needed);
        selectedPlayers.push(...chosen);

        chosen.forEach((c) => {
          const idx = availablePlayers.findIndex((p) => p.id === c.id);
          if (idx !== -1) availablePlayers.splice(idx, 1);
        });
      }

      const totalCost = selectedPlayers.reduce(
        (sum, p) => sum + Number(p.market_value),
        0
      );
      if (totalCost > 5_000_000) {
        throw new Error(`Selected team exceeds max budget: ${totalCost}`);
      }
      const remainingBudget = 5_000_000 - totalCost;

      const [insertResult] = await database.query(INSERT_TEAM_QUERY, {
        type: QueryTypes.INSERT,
        replacements: {
          user_id: userId,
          name: `Team of ${userId}`,
          budget: remainingBudget,
        },
        transaction,
      });

      const [team] = await database.query<TeamRow>(GET_TEAM_QUERY, {
        type: QueryTypes.SELECT,
        replacements: { id: insertResult },
        transaction,
      });

      for (const player of selectedPlayers) {
        await database.query(INSERT_PLAYERS_TEAM, {
          type: QueryTypes.INSERT,
          replacements: {
            team_id: team.id,
            player_id: player.id,
          },
          transaction,
        });
      }

      await transaction.commit();

      return formatTeamResponse(team, selectedPlayers);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
