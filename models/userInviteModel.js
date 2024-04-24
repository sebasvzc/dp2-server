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
        }
    }, {timestamps: true} )
    return UserInvite
}