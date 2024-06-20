//user model
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define( "user", {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            isEmail: true, //checks for email format
            allowNull: false
        },
        apellido: {
            type: DataTypes.STRING,
            allowNull: false
        },
        contrasenia: {
            type: DataTypes.STRING,
            allowNull: false
        },
        rol: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fidRol: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'roles',  // nombre de la tabla en la base de datos
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
        activo: {
        type: DataTypes.TINYINT(1),
            allowNull: false
        },
        usuarioCreacion:{
            type: DataTypes.STRING,
            allowNull: true
        },
        usuarioActualizacion:{
            type: DataTypes.STRING,
            allowNull: true
        },
        fidLocatario: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'locatarios',  // nombre de la tabla en la base de datos (en plural)
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
    }, {timestamps: true} )

    User.associate = (models) => {
        User.belongsTo(models.role, {
            foreignKey: 'fidRol'
        });
        User.belongsTo(models.locatario, {
            foreignKey: 'fidLocatario'
        });
    };
    return User
}