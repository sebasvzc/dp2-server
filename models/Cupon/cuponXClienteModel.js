module.exports = (sequelize, DataTypes) => {
    const CuponXCliente = sequelize.define( "cuponXCliente", {
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
        cantidad:{
            type: DataTypes.INTEGER,
            allowNull: false,
            default: 1
        },
        cantidadHistorica: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        usuarioCreacion:{
            type: DataTypes.STRING,
            allowNull: true
        },
        usuarioActualizacion:{
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {timestamps: true} )
    //RELACIÓN CON LA LLAVE FORANEA
    CuponXCliente.associate = models => {
        CuponXCliente.belongsTo(models.cupon, {
            foreignKey: 'fidCupon'
        });
        CuponXCliente.belongsTo(models.client, {
            foreignKey: 'fidCliente'
        });
    };
    return CuponXCliente
}