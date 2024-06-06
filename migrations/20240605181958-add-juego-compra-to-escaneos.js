'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('escaneos', 'tipo', {
      type: Sequelize.ENUM('evento', 'tienda', 'cupon', 'juego', 'compra'),
      allowNull: false
    });

    await queryInterface.addColumn('escaneos', 'puntosOtorgados', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('escaneos', 'tipo', {
      type: Sequelize.ENUM('evento', 'tienda', 'cupon'),
      allowNull: false
    });

    await queryInterface.removeColumn('escaneos', 'puntosOtorgados');
  }
};
