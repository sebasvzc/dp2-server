//client model
module.exports = (sequelize, DataTypes) => {
    const Client = sequelize.define( "client", {
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
        telefono: {
            type: DataTypes.STRING,
            allowNull: false
        },
        apellidoPaterno: {
            type: DataTypes.STRING,
            allowNull: false
        },
        apellidoMaterno: {
            type: DataTypes.STRING,
            allowNull: false
        },
        contrasenia: {
            type: DataTypes.STRING,
            allowNull: false
        },
        genero: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fechaNacimiento: {
            type: DataTypes.DATE,
            allowNull: false
        },
        puntos: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        permisoCamara: {
            type: DataTypes.BOOLEAN,
            allowNull: true
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

    Client.associate = models => {
        Client.hasMany(models.eventoXCliente,{
            foreignKey: 'fidCliente'
        });
    };

    return Client
}