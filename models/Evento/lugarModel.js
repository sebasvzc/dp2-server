module.exports = (sequelize, DataTypes) => {
    const Lugar = sequelize.define( "lugar", {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ubicacion: {
            type: DataTypes.STRING,
            allowNull: false
        },
        aforo: {
            type: DataTypes.INTEGER,
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

    Lugar.associate = models => {
        Lugar.hasMany(models.evento,{
            foreignKey: 'fidLugar'
        });
    };




    return Lugar
}