module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define("roles", {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, { timestamps: false });
    Role.associate = models => {
        Role.belongsTo(models.rolePermission, {
            foreignKey: 'fidRol'
        });
    };
    return Role;
};