module.exports = (sequelize, DataTypes) => {
    const Locatario = sequelize.define( "locatario", {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
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
    return Locatario
}