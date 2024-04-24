//recuperar contraseña (tabla intermedia)
module.exports = (sequelize, DataTypes) => {
    const PasswordManagment = sequelize.define( "passwordManagment", {
        fidUser: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',  // nombre de la tabla en la base de datos (en plural)
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        codigo: {
            type: DataTypes.STRING,
            allowNull: false
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    }, {timestamps: true} )
    // Definir la relación con el modelo User
    PasswordManagment.associate = models => {
        PasswordManagment.belongsTo(models.User, {
            foreignKey: 'fidUser',
            as: 'user'
        });
    };
    return PasswordManagment
}