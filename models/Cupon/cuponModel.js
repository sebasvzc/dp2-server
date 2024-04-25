//tabla cupon
module.exports = (sequelize, DataTypes) => {
    const Cupon = sequelize.define( "cupon", {
        fidLocatario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'locatarios',  // nombre de la tabla en la base de datos (en plural)
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        fidCategoria: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'categoria',  // nombre de la tabla en la base de datos
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        sumilla: {
            type: DataTypes.STRING,
            allowNull: false
        },
        descripcionCompleta: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fechaExpiracion: {
            type: DataTypes.DATE,
            allowNull: false
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    }, {timestamps: true} )
    // Definir la relación con el modelo Locatario
    //RELACIÓN CON LA LLAVE FORANEA
    Cupon.associate = models => {
        Cupon.belongsTo(models.Locatario, {
            foreignKey: 'fidLocatario',
            as: 'locatario'
        });
        Cupon.belongsTo(models.Categoria, {
            foreignKey: 'fidCategoria',
            as: 'categoria'
        });
    };
    return Cupon
}