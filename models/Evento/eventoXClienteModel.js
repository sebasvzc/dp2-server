module.exports = (sequelize, DataTypes) => {
    const EventoXCliente = sequelize.define( "eventoXCliente", {
        fidEvento: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'eventos',  // nombre de la tabla en la base de datos
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        fidCliente: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'clients',  // nombre de la tabla en la base de datos
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        codigoQR: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fechaInscripcion: {
            type: DataTypes.DATE,
            allowNull: false
        },
        asistio: {
            type: DataTypes.BOOLEAN,
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
    //RELACIÓN CON LA LLAVE FORANEA
    EventoXCliente.associate = models => {
        EventoXCliente.belongsTo(models.evento, {
            foreignKey: 'fidEvento'
        });
        EventoXCliente.belongsTo(models.client, {
            foreignKey: 'fidCliente'
        });
    };
    return EventoXCliente
}