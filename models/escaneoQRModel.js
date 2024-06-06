module.exports = (sequelize, DataTypes) => {

    const Escaneo = sequelize.define('Escaneo', {
        fidClient: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'clients',  // nombre de la tabla en la base de datos (en plural)
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        tipo: {
            type: DataTypes.ENUM('evento', 'tienda', 'cupon', 'juego', 'compra'),
            allowNull: false
        },
        fidReferencia: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        ultimoEscaneo: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        puntosOtorgados: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        tableName: 'escaneos',
        timestamps: true
    });

    return Escaneo;
}