'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const bcrypt = require('bcrypt');
    const t = await queryInterface.sequelize.transaction();
    try {
      const now = new Date();
      const TEAM_COUNT = 20;
      const PASSWORD = await bcrypt.hash('test123', 10);

      const pad2 = (n) => String(n).padStart(2, '0');

      // 1) USERS
      const userRows = [];
      for (let i = 1; i <= TEAM_COUNT; i++) {
        userRows.push({
          email: `demo_user_${pad2(i)}@example.com`,
          password: PASSWORD,
          name: `DemoName${pad2(i)}`,
          lastName: `DemoLast${pad2(i)}`,
          username: `demo${pad2(i)}`,
          createdAt: now,
          updatedAt: now,
        });
      }
      await queryInterface.bulkInsert('users', userRows, { transaction: t });

      const [users] = await queryInterface.sequelize.query(
        `SELECT id, email FROM users WHERE email LIKE 'demo_user_%@example.com' ORDER BY email`,
        { transaction: t }
      );
      const userIds = users.map((u) => u.id);

      // 2) TEAMS (one per user)
      const teamRows = userIds.map((uid, idx) => ({
        user_id: uid,
        name: `DEMO Team ${pad2(idx + 1)}`,
        createdAt: now,
        updatedAt: now,
      }));
      await queryInterface.bulkInsert('teams', teamRows, { transaction: t });

      const [teams] = await queryInterface.sequelize.query(
        `SELECT id, name FROM teams WHERE name LIKE 'DEMO Team %' ORDER BY name`,
        { transaction: t }
      );
      const teamMap = new Map();
      teams.forEach((r) => teamMap.set(r.name, r.id));

      // 3) PLAYERS (20 per team: 1 GK, 7 DF, 7 MF, 5 FW)
      const POS_COMPOSITION = { GK: 1, DF: 7, MF: 7, FW: 5 };
      const POS_BASE_VALUE = { GK: 400, DF: 500, MF: 700, FW: 900 };

      const playerNamesPerTeam = new Map(); 
      const playerRows = [];

      for (let i = 1; i <= TEAM_COUNT; i++) {
        const teamName = `DEMO Team ${pad2(i)}`;
        const names = [];
        for (const pos of ['GK', 'DF', 'MF', 'FW']) {
          const count = POS_COMPOSITION[pos];
          for (let j = 1; j <= count; j++) {
            const name = `DEMO_${pos}_T${pad2(i)}_${pad2(j)}`;
            const value =
              POS_BASE_VALUE[pos] +
              i * 100 +
              j * 20;  

            playerRows.push({
              name,
              position: pos,
              market_value: value,
              createdAt: now,
              updatedAt: now,
            });
            names.push(name);
          }
        }
        playerNamesPerTeam.set(teamName, names);
      }

      await queryInterface.bulkInsert('players', playerRows, { transaction: t });

      // map back players by name -> id
      const [players] = await queryInterface.sequelize.query(
        `SELECT id, name FROM players WHERE name LIKE 'DEMO_%'`,
        { transaction: t }
      );
      const playerIdByName = new Map(players.map((p) => [p.name, p.id]));

      // 4) TEAM ASSIGNMENTS (team_players)
      const teamPlayers = [];
      for (let i = 1; i <= TEAM_COUNT; i++) {
        const teamName = `DEMO Team ${pad2(i)}`;
        const teamId = teamMap.get(teamName);
        const names = playerNamesPerTeam.get(teamName) || [];
        for (const n of names) {
          const pid = playerIdByName.get(n);
          if (!pid) throw new Error(`Missing player id for ${n}`);
          teamPlayers.push({
            team_id: teamId,
            player_id: pid,
            createdAt: now,
          });
        }
      }
      await queryInterface.bulkInsert('team_players', teamPlayers, { transaction: t });

      // 5) TRANSFER LISTINGS — list the first FW of the first 8 teams (unique per player)
      const listings = [];
      const listingTeams = Math.min(8, TEAM_COUNT);
      for (let i = 1; i <= listingTeams; i++) {
        const teamName = `DEMO Team ${pad2(i)}`;
        const teamId = teamMap.get(teamName);
        const playerName = `DEMO_FW_T${pad2(i)}_01`;
        const pid = playerIdByName.get(playerName);
        const [mvRow] = await queryInterface.sequelize.query(
          `SELECT market_value FROM players WHERE id = :pid`,
          { replacements: { pid }, transaction: t, type: Sequelize.QueryTypes.SELECT }
        );
        const ask = Number(mvRow.market_value) * 1.15;

        listings.push({
          player_id: pid,
          seller_team_id: teamId,
          asking_price: Math.round(ask),
          posted_at: now,
        });
      }
      
      if (listings.length) {
        await queryInterface.bulkInsert('transfer_listings', listings, { transaction: t });
      }

      const FREE_PER_POS = 30;
      const freeAgents = [];
      for (const pos of ['GK', 'DF', 'MF', 'FW']) {
        for (let k = 1; k <= FREE_PER_POS; k++) {
          freeAgents.push({
            name: `DEMO_FA_${pos}_${String(k).padStart(2, '0')}`,
            position: pos,
            market_value: POS_BASE_VALUE[pos] + 2500 + k * 150,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
      await queryInterface.bulkInsert('players', freeAgents, { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // Delete in reverse order
      await queryInterface.bulkDelete(
        'transfer_listings',
        {},
        { transaction: t }
      );

      // Delete team_players for our DEMO players
      const [demoPlayers] = await queryInterface.sequelize.query(
        `SELECT id FROM players WHERE name LIKE 'DEMO_%'`,
        { transaction: t }
      );
      const demoPids = demoPlayers.map((p) => p.id);
      if (demoPids.length) {
        await queryInterface.bulkDelete(
          'team_players',
          { player_id: demoPids },
          { transaction: t }
        );
      }

      // Delete DEMO players
      await queryInterface.bulkDelete(
        'players',
       { name: { [Sequelize.Op.like]: 'DEMO_%' } },
        { transaction: t }
      );

      // Delete DEMO teams
      await queryInterface.bulkDelete(
        'teams',
        { name: { [Sequelize.Op.like]: 'DEMO Team %' } },
        { transaction: t }
      );

      // Delete DEMO users
      await queryInterface.bulkDelete(
        'users',
        { email: { [Sequelize.Op.like]: 'demo_user_%@example.com' } },
        { transaction: t }
      );

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
