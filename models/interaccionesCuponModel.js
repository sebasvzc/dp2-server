module.exports = (sequelize, DataTypes) => {
    const InteraccionesCupon = sequelize.define("interaccionesCupon", {
        fidCliente: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'clients', // Nombre de la tabla a la que se hace referencia
                key: 'id' // Clave a la que se hace referencia en la tabla clients
            }
        },
        fidCupon: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'cupons', // Nombre de la tabla a la que se hace referencia
                key: 'id' // Clave a la que se hace referencia en la tabla cupons
            }
        },
        numInteracciones: {
            type: DataTypes.INTEGER,
            default: 0,
            allowNull: false
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        usuarioCreacion: {
            type: DataTypes.STRING,
            allowNull: true
        },
        usuarioActualizacion: {
            type: DataTypes.STRING,
            allowNull: true
        },
        tipo: {
            type: DataTypes.ENUM('detalle', 'canje', 'uso'),
            allowNull: false
        },
        dia: {
            type: DataTypes.DATEONLY,
            allowNull: false
        }
    }, {timestamps: true})

    return InteraccionesCupon
}
