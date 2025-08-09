'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('team_players', {
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'teams', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true,
      },
      player_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'players', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('team_players', {
      fields: ['player_id'],
      type: 'unique',
      name: 'uniq_player_per_team',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('team_players');
  },
};
