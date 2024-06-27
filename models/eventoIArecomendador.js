module.exports = (sequelize, DataTypes) => {
    const EventoRecomendadorIA = sequelize.define( "eventoRecomendadorIA", {
       
        fidEvento: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'eventos',  // nombre de la tabla en la base de datos (en plural)
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        fidIDCliente: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'clients',  // nombre de la tabla en la base de datos (en plural)
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        tipoRecomendador: {
            type: DataTypes.STRING,
            allowNull: false
        },
        prioridad: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
       
    }, {timestamps: true} )
    // Definir la relación con el modelo Locatario
    //RELACIÓN CON LA LLAVE FORANEA
    EventoRecomendadorIA.associate = models => {
        EventoRecomendadorIA.belongsTo(models.evento, {
            foreignKey: 'fidEvento'
        });
        EventoRecomendadorIA.belongsTo(models.client, {
            foreignKey: 'fidIDCliente'
        });
      

    };
    return EventoRecomendadorIA
}