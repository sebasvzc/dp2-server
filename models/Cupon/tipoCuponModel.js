module.exports = (sequelize, DataTypes) => {
    const TipoCupon = sequelize.define( "tipoCupon", {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        descripcion: {
            type: DataTypes.STRING,
            allowNull: false
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    }, {timestamps: true} )
    return TipoCupon
}