const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_DAILECT, DB_PORT } = process.env;

const sequelize = new Sequelize({
    host: DB_HOST,
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    dialect: DB_DAILECT,
    port: DB_PORT
});

async function addColumn() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Agregar la columna fidLocatario a la tabla users
        await sequelize.getQueryInterface().addColumn('users', 'fidLocatario', {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'locatarios',  // nombre de la tabla en la base de datos
                key: 'id'
            }
        });

        console.log('Column fidLocatario added successfully.');

        // Cerrar la conexión
        await sequelize.close();
    } catch (error) {
        console.error('Unable to connect to the database or add column:', error);
    }
}

addColumn();