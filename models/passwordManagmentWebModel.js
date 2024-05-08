//recuperar contraseña (tabla intermedia)
module.exports = (sequelize, DataTypes) => {
    const PasswordManagmentWEB = sequelize.define( "passwordManagmentWEB", {
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
    // Definir la relación con el modelo Client
    //RELACIÓN CON LA LLAVE FORANEA
    PasswordManagmentWEB.associate = models => {
        PasswordManagmentWEB.belongsTo(models.user, {
            foreignKey: 'fidUser',
            as: 'user'
        });
    };
    return PasswordManagmentWEB
}