module.exports = (sequelize, DataTypes) => {
    const TipoEvento = sequelize.define( "tipoEvento", {
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
    TipoEvento.associate = models => {
        TipoEvento.hasMany(models.evento,{
            foreignKey: 'fidTipoEvento'
        });
    };
    return TipoEvento

    

}