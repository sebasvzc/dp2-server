module.exports = (sequelize, DataTypes) => {

    const Recordatorio = sequelize.define('Recordatorio', {
        frecuencia: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        hora: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        minuto: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        plazo: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        activo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        usuarioCreacion:{
            type: DataTypes.STRING,
            allowNull: true
        },
        usuarioActualizacion:{
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'recordatorios',
        timestamps: true
    });
    return Recordatorio;
}