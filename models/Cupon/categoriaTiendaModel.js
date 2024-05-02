//tabla de categorias
module.exports = (sequelize, DataTypes) => {
    const CategoriaTienda = sequelize.define( "categoriaTienda", {
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
    return CategoriaTienda
}