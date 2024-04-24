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
        }
    }, {timestamps: true} )
    return User
}