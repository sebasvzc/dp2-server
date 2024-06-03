module.exports = (sequelize,DataTypes) => {
    const RolePermission = sequelize.define("role_permission", {

        activo: {
            type: DataTypes.BOOLEAN,
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
        fidPermission: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'permissions',  // nombre de la tabla en la base de datos
                key: 'id'        // nombre de la columna en la tabla User
            }
        },
    }, { timestamps: false });
    RolePermission.associate = models => {
        RolePermission.belongsTo(models.role, {
            foreignKey: 'fidRol'
        });
        RolePermission.belongsTo(models.permission, {
            foreignKey: 'fidPermission'
        });
    };

    return RolePermission;
};