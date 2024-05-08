'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('categoria', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.addColumn('categoria', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('categoriaEventos', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.addColumn('categoriaEventos', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('categoriaTiendas', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.addColumn('categoriaTiendas', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('clients', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.addColumn('clients', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('cupons', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.addColumn('cupons', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('cuponXClientes', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.addColumn('cuponXClientes', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('eventos', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.addColumn('eventos', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('eventoXClientes', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.addColumn('eventoXClientes', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('locatarios', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.addColumn('locatarios', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('lugares', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.addColumn('lugares', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('passwordManagments', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.addColumn('passwordManagments', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('passwordManagmentWEBs', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.addColumn('passwordManagmentWEBs', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('tipoCupons', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.addColumn('tipoCupons', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('userInvs', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.addColumn('userInvs', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.addColumn('users', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('categoria', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.removeColumn('categoria', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.removeColumn('categoriaEventos', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.removeColumn('categoriaEventos', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.removeColumn('categoriaTiendas', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.removeColumn('categoriaTiendas', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.removeColumn('clients', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.removeColumn('clients', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.removeColumn('cupons', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.removeColumn('cupons', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.removeColumn('cuponXClientes', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.removeColumn('cuponXClientes', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.removeColumn('eventos', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.removeColumn('eventos', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.removeColumn('eventoXClientes', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.removeColumn('eventoXClientes', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.removeColumn('locatarios', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.removeColumn('locatarios', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.removeColumn('lugares', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.removeColumn('lugares', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.removeColumn('passwordManagments', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.removeColumn('passwordManagments', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.removeColumn('passwordManagmentWEBs', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.removeColumn('passwordManagmentWEBs', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.removeColumn('tipoCupons', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.removeColumn('tipoCupons', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.removeColumn('userInvs', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.removeColumn('userInvs', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.removeColumn('users', 'usuarioCreacion', {
      type: Sequelize.STRING,
      allowNull: true // o false, dependiendo de tu diseño
    });
    await queryInterface.removeColumn('users', 'usuarioActualizacion', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
