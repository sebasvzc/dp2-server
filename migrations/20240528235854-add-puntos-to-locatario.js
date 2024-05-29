'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('locatarios', 'puntosOtorgados', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 50
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('locatarios', 'puntosOtorgados');
  }
};
