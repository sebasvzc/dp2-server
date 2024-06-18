'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('interaccionesCupons', 'tipo', {
      type: Sequelize.ENUM('detalle', 'canje', 'uso'),
      allowNull: false
    });
    await queryInterface.addColumn('interaccionesCupons', 'dia', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('interaccionesCupons', 'tipo');
    await queryInterface.removeColumn('interaccionesCupons', 'dia');
  }
};
