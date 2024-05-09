module.exports = (sequelize, DataTypes) => {
    const Evento = sequelize.define( "evento", {
        codigo: {
            type: DataTypes.STRING,
            allowNull: false
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fechaInicio: {
            type: DataTypes.DATE,
            allowNull: false
        },
        fechaFin: {
            type: DataTypes.DATE,
            allowNull: false
        },
        descripcion: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fidLugar: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'lugars',  // nombre de la tabla en la base de datos (en plural)
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        fidTipoEvento: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tipoEventos',  // nombre de la tabla en la base de datos (en plural)
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        fidTienda: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'locatarios',  // nombre de la tabla en la base de datos (en plural)
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        rutaFoto: {
            type: DataTypes.STRING,
            allowNull: false
        },
        puntosOtorgados: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        edadPromedio: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        generoPromedio: {
            type: DataTypes.STRING,
            allowNull: true
        },
        ordenPriorizacion: {
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
    // Definir la relación con el modelo Locatario
    //RELACIÓN CON LA LLAVE FORANEA
    Evento.associate = models => {
        Evento.belongsTo(models.lugar, {
            foreignKey: 'fidLugar'
        });
        Evento.belongsTo(models.tipoEvento, {
            foreignKey: 'fidTipoEvento'
        });
        Evento.belongsTo(models.locatario, {
            foreignKey: 'fidTienda'
        });
        Evento.hasMany(models.eventoXCliente,{
            foreignKey: 'fidEvento'
        });

    };
    return Evento
}