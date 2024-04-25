//tabla de categorias
module.exports = (sequelize, DataTypes) => {
    const Categoria = sequelize.define( "categoria", {
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
    return Categoria
}