//recuperar contraseña (tabla intermedia)
module.exports = (sequelize, DataTypes) => {
    const PasswordManagment = sequelize.define( "passwordManagment", {
        fidClient: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'clients',  // nombre de la tabla en la base de datos (en plural)
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
    PasswordManagment.associate = models => {
        PasswordManagment.belongsTo(models.client, {
            foreignKey: 'fidClient',
            as: 'client'
        });
    };
    return PasswordManagment
}