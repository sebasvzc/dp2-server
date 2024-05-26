//recuperar contraseña (tabla intermedia)
module.exports = (sequelize, DataTypes) => {
    const MarcoQR = sequelize.define("marcoQR", {
        codigo: {
            type: DataTypes.STRING,
            allowNull: false
        },
        tipo: {
            type: DataTypes.ENUM,
            values: ['evento', 'tienda', 'otros'],
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
        }
    }, { timestamps: true });

    return MarcoQR;
}
