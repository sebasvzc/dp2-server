module.exports = (sequelize, DataTypes) => {
    const Locatario = sequelize.define( "locatario", {
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
    return Locatario
}