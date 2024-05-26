'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
      await queryInterface.addColumn('marcoQRs', 'tipo', {
          type: Sequelize.ENUM,
          values: ['evento', 'tienda', 'otros'],
          allowNull: false,
          defaultValue: 'otros' // O el valor que prefieras como predeterminado
      });
  },

  down: async (queryInterface, Sequelize) => {
      await queryInterface.removeColumn('marcoQRs', 'tipo');
      await queryInterface.sequelize.query('DROP TYPE "enum_marcoQRs_tipo";');
  }
};
