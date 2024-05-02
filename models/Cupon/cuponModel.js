//tabla cupon
module.exports = (sequelize, DataTypes) => {
    const Cupon = sequelize.define( "cupon", {
        codigo: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fidLocatario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'locatarios',  // nombre de la tabla en la base de datos (en plural)
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        fidTipoCupon: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tipoCupons',  // nombre de la tabla en la base de datos (en plural)
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
        terminosCondiciones: {
            type: DataTypes.STRING,
            allowNull: false
        },
        esLimitado: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        costoPuntos: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        cantidadInicial: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        cantidadDisponible: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        ordenPriorizacion: {
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
    // Definir la relación con el modelo Locatario
    //RELACIÓN CON LA LLAVE FORANEA
    Cupon.associate = models => {
        Cupon.belongsTo(models.locatario, {
            foreignKey: 'fidLocatario'
        });
        Cupon.belongsTo(models.tipoCupon, {
            foreignKey: 'fidTipoCupon'
        });
        Cupon.hasMany(models.cuponXCliente, {
            foreignKey: 'fidCupon'
        })
    };
    return Cupon
}