'use strict';

const { faker } = require('@faker-js/faker');

const POSITIONS = ['GK', 'DF', 'MF', 'FW'];
const POSITION_DISTRIBUTION = {
  GK: 3000,
  DF: 3000,
  MF: 3000,
  FW: 3000,
};

const generatePlayers = () => {
  const players = [];

  for (const position of POSITIONS) {
    const count = POSITION_DISTRIBUTION[position];

    for (let i = 0; i < count; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();

      players.push({
        name: `${firstName} ${lastName}`,
        position,
        market_value: parseFloat((Math.random() * 5000 + 1000).toFixed(2)), 
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return players;
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('players', generatePlayers(), {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('players', null, {});
  },
};
