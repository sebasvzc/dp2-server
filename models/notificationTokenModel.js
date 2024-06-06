// models/notificationTokenModel.js
module.exports = (sequelize, DataTypes) => {
    const NotificationToken = sequelize.define("notificationToken", {
        fidCliente: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    }, { timestamps: true });

    return NotificationToken;
}

