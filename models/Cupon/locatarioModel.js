module.exports = (sequelize, DataTypes) => {
    const Locatario = sequelize.define( "locatario", {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fidCategoriaTienda: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'categoriaTiendas',  // nombre de la tabla en la base de datos
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        descripcion: {
            type: DataTypes.STRING,
            allowNull: false
        },
        locacion: {
            type: DataTypes.STRING,
            allowNull: false
        },
        horaApertura: {
            type: DataTypes.TIME,
            allowNull: false
        },
        horaCierre: {
            type: DataTypes.TIME,
            allowNull: false
        },
        aforo: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        rutaFoto: {
            type: DataTypes.STRING,
            allowNull: false
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    }, {timestamps: true} )
    //RELACIÓN CON LA LLAVE FORANEA
    Locatario.associate = models => {
        Locatario.belongsTo(models.CategoriaTienda, {
            foreignKey: 'fidCategoriaTienda',
            as: 'categoriaTienda'
        });
    };
    return Locatario
}