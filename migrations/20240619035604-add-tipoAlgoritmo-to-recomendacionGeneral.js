'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('recomendacionGenerals', 'tipoAlgoritmo', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('recomendacionGenerals', 'tipoAlgoritmo');
  }
};

