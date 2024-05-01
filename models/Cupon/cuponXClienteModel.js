module.exports = (sequelize, DataTypes) => {
    const CuponXCliente = sequelize.define( "cuponXCliente", {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fidCupon: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'cupons',  // nombre de la tabla en la base de datos
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        fidCliente: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'clients',  // nombre de la tabla en la base de datos
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        codigoQR: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fechaCompra: {
            type: DataTypes.DATE,
            allowNull: false
        },
        usado: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    }, {timestamps: true} )
    //RELACIÓN CON LA LLAVE FORANEA
    CuponXCliente.associate = models => {
        CuponXCliente.belongsTo(models.Cupon, {
            foreignKey: 'fidCupon',
            as: 'cupon'
        });
        CuponXCliente.belongsTo(models.Client, {
            foreignKey: 'fidCliente',
            as: 'cliente'
        });
    };
    return CuponXCliente
}