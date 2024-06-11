module.exports = (sequelize, DataTypes) => {
    const InteraccionesCupon = sequelize.define( "interaccionesCupon", {
        fidCliente: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fidCupon: {
            type: DataTypes.STRING,
            allowNull: false
        },
        numInteracciones: {
            type : DataTypes.INTEGER,
            default: 0,
            allowNull: false
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

    return InteraccionesCupon
}