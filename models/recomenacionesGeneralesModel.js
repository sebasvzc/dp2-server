module.exports = (sequelize, DataTypes) => {
    const RecomendacionGeneral = sequelize.define("recomendacionGeneral", {
        cuponFavorito: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'cupons', // nombre de la tabla referenciada
                key: 'id'        // llave referenciada
            }
        },
        cuponRecomendado: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'cupons', // nombre de la tabla referenciada
                key: 'id'        // llave referenciada
            }
        },
        prioridad: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        tipoAlgoritmo: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, { timestamps: true });

    return RecomendacionGeneral;
}