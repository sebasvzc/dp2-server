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
    //RELACIÓN CON LA LLAVE FORÁNEA
    TipoCupon.associate = models => {
        TipoCupon.hasMany(models.cupon, {
            foreignKey: 'fidTipoCupon'
        });
    };
    return TipoCupon
}