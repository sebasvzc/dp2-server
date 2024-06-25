'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('escaneos', 'tipo', {
            type: Sequelize.ENUM('evento', 'tienda', 'cupon', 'juego 1', 'juego 2', 'juego 3', 'juego 4', 'compra'),
            allowNull: false
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Si es necesario, aquí puedes definir cómo revertir los cambios realizados en el método up.
        await queryInterface.changeColumn('escaneos', 'tipo', {
            type: Sequelize.ENUM('evento', 'tienda', 'cupon', 'juego', 'compra'),
            allowNull: false
        });
    }
};
