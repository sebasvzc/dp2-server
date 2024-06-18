// models/TaskConfig.js
module.exports = (sequelize, DataTypes) => {
    const TaskConfig = sequelize.define("TaskConfig", {
        taskName: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        cronExpression: {
            type: DataTypes.STRING,
            allowNull: false
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    }, {timestamps: true});
    return TaskConfig;
};
