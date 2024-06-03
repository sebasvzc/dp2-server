module.exports = (sequelize, DataTypes) => {
    const Permission = sequelize.define("permission", {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, { timestamps: false });
    Permission.associate = models => {
        Permission.belongsTo(models.rolePermission, {
            foreignKey: 'fidPermission'
        });
    };
    return Permission;
};