//user invite model
module.exports = (sequelize, DataTypes) => {
    const UserInvite = sequelize.define( "userInv", {
        email: {
            type: DataTypes.STRING,
            unique: true,
            isEmail: true, //checks for email format
            allowNull: false
        },
        active: {
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
        }
    }, {timestamps: true} )
    return UserInvite
}