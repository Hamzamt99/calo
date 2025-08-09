'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;
    const sql = qi.sequelize;

    // 1) Get all rostered players with their team
    const players = await sql.query(
      `
      SELECT tp.player_id, tp.team_id
      FROM team_players tp
      JOIN players p ON p.id = tp.player_id
      `,
      { type: sql.QueryTypes.SELECT }
    );

    if (!players?.length) {
      console.warn('⚠ No players found in team_players. Seed teams/rosters first.');
      return;
    }

    // 2) Get already listed player_ids to avoid UNIQUE(player_id) violation
    const existing = await sql.query(
      `SELECT player_id FROM transfer_listings`,
      { type: sql.QueryTypes.SELECT }
    );
    const alreadyListed = new Set(existing.map(r => r.player_id));

    // 3) Filter candidates (not listed yet), shuffle
    const candidates = players.filter(p => !alreadyListed.has(p.player_id));
    if (!candidates.length) {
      console.warn('⚠ No available players to list (all already listed).');
      return;
    }

    const shuffled = candidates.sort(() => Math.random() - 0.5);

    // 4) Build up to N listings with strict de-dup
    const N = 20;
    const seen = new Set(); // player_id in this batch
    const listings = [];

    for (const p of shuffled) {
      if (listings.length >= N) break;
      if (seen.has(p.player_id)) continue;
      seen.add(p.player_id);

      // asking_price: number, 100k–2M, 2 decimals
      const raw = Math.random() * (2_000_000 - 100_000) + 100_000;
      const price = Math.round(raw * 100) / 100;

      listings.push({
        player_id: p.player_id,
        seller_team_id: p.team_id,
        asking_price: price,     // number (DECIMAL will accept)
        // posted_at omitted -> DB default CURRENT_TIMESTAMP
      });
    }

    if (!listings.length) {
      console.warn('⚠ Nothing to insert.');
      return;
    }

    await qi.bulkInsert('transfer_listings', listings, {});
    console.log(`✅ Inserted ${listings.length} transfer listings.`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('transfer_listings', null, {});
  }
};
