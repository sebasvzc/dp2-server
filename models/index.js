//importing modules
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_DAILECT, DB_PORT } = process.env;
const { Sequelize, DataTypes } = require('sequelize')

//Database connection with dialect of postgres specifying the database we are using
//port for my database is 5433
//database name is discover
const sequelize = new Sequelize({
    host: DB_HOST,
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    dialect: DB_DAILECT,
    port: DB_PORT
})

//checking if connection is done
sequelize.authenticate().then(() => {
    console.log(`Connection has been established successssssfully.`)
}).catch((err) => {
    console.log('Unable to connect to the database:', err)
})

const db = {}


// Function to recursively load models
/*fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });

    Object.keys(db).forEach(modelName => {
        if (db[modelName].associate) {
            db[modelName].associate(db);
        }
    });*/
db.Sequelize = Sequelize
db.sequelize = sequelize


//connecting to model
db.permission = require('./permissionModel') (sequelize, DataTypes)
db.rol = require('./roleModel') (sequelize, DataTypes)
db.rolePermission = require('./rolePermission') (sequelize, DataTypes)
db.usersInv = require('./userInviteModel') (sequelize, DataTypes)
db.users = require('./userModel') (sequelize, DataTypes)
db.clients = require('./clientModel') (sequelize, DataTypes)
db.passwordManagments = require('./passwordManagmentModel') (sequelize, DataTypes)
db.categoriaTiendas = require('./Cupon/categoriaTiendaModel') (sequelize, DataTypes)
//db.categorias = require('./Cupon/categoriaCuponModel') (sequelize, DataTypes)
db.locatarios = require('./Cupon/locatarioModel') (sequelize, DataTypes)
db.tipoCupons = require('./Cupon/tipoCuponModel') (sequelize, DataTypes)
db.cupones = require('./Cupon/cuponModel') (sequelize, DataTypes)
db.cuponXClientes = require('./Cupon/cuponXClienteModel') (sequelize, DataTypes)
db.passwordManagmentWEBs = require('./passwordManagmentWebModel') (sequelize, DataTypes)
db.tipoEventos = require('./Evento/tipoEventoModel') (sequelize, DataTypes)
db.lugares = require('./Evento/lugarModel') (sequelize, DataTypes)

db.eventos = require('./Evento/eventoModel') (sequelize, DataTypes) 
db.eventoXClientes = require('./Evento/eventoXClienteModel') (sequelize, DataTypes) 
db.escaneos = require('./escaneoQRModel') (sequelize, DataTypes) 
db.recordatorios = require('./recordatorioModel') (sequelize, DataTypes) 
db.marcoQRs = require('./marcosQRModel') (sequelize, DataTypes) 
db.notificationToken = require('./notificationTokenModel') (sequelize, DataTypes) 
db.interaccionesCupon = require('./interaccionesCuponModel') (sequelize, DataTypes) 

db.recomendacionGeneral = require('./recomenacionesGeneralesModel') (sequelize, DataTypes) 
db.tareas = require('./notificacionesModel') (sequelize, DataTypes) 

db.eventoIARecomendador = require('./eventoIArecomendador') (sequelize, DataTypes) 

//relaciones
//VOLVER A PONER TODAS LAS ASOCIACIONES AQUÍ
db.eventoIARecomendador.belongsTo(db.clients,{foreignKey: "fidIDCliente", as: 'clienteEVEIA'});
db.eventoIARecomendador.belongsTo(db.eventos,{foreignKey: "fidEvento", as: 'eventoIA'});


db.rolePermission.belongsTo(db.rol,{foreignKey: "fidRol", as: 'rol'});
db.rol.hasMany(db.rolePermission,{foreignKey: "fidRol", as: 'rol'});

db.rolePermission.belongsTo(db.permission,{foreignKey: "fidPermission", as: 'permission'});
db.permission.hasMany(db.rolePermission,{foreignKey: "fidPermission", as: 'permission'});



db.users.belongsTo(db.rol, {foreignKey: 'fidRol', as: 'role'});
db.rol.hasMany(db.users, { foreignKey: 'fidRol', as: 'role'});

///////////////////////////////////////////////////

db.recomendacionGeneral.belongsTo(db.cupones, { foreignKey: 'cuponFavorito', as: 'favorito' });
db.cupones.hasMany(db.recomendacionGeneral, { foreignKey: 'cuponFavorito', as: 'favorito' });

db.recomendacionGeneral.belongsTo(db.cupones, { foreignKey: 'cuponRecomendado', as: 'recomendado' });
db.cupones.hasMany(db.recomendacionGeneral, { foreignKey: 'cuponRecomendado', as: 'recomendado' });

///////////////////////////////////////////////////

db.interaccionesCupon.belongsTo(db.clients, {foreignKey: 'fidCliente', as: 'interaccionXcliente'});
db.interaccionesCupon.belongsTo(db.cupones, {foreignKey: 'fidCupon', as: 'interaccionXcupon'});
db.clients.hasMany(db.interaccionesCupon, {foreignKey: 'fidCliente', as: 'interaccionXcliente'});
db.cupones.hasMany(db.interaccionesCupon, {foreignKey: 'fidCupon', as: 'interaccionXcupon'});

///////////////////////////////////////////////////

db.locatarios.belongsTo(db.categoriaTiendas, {foreignKey: 'fidCategoriaTienda', as: 'categoriaTienda'});
db.categoriaTiendas.hasMany(db.locatarios, {foreignKey: 'fidCategoriaTienda', as: 'categoriaTienda'});

db.eventos.belongsTo(db.lugares,{foreignKey: "fidLugar", as: 'lugar'});
db.eventos.belongsTo(db.tipoEventos,{foreignKey: "fidTipoEvento", as: 'tipoEvento'});
db.eventos.belongsTo(db.locatarios,{foreignKey: "fidTienda", as: 'locatario'});
db.eventos.hasMany(db.eventoIARecomendador,{foreignKey: "fidEvento", as: 'eventoIA'});

db.eventoXClientes.belongsTo(db.eventos,{foreignKey: "fidEvento", as: 'eventocli'});
db.eventoXClientes.belongsTo(db.clients,{foreignKey: "fidCliente", as: 'clienteeve'});

db.eventos.hasMany(db.eventoXClientes,{foreignKey: "fidEvento", as:'eventocli'});
db.clients.hasMany(db.eventoXClientes,{foreignKey: "fidCliente", as:'clienteeve'});

db.clients.hasMany(db.eventoIARecomendador,{foreignKey: "fidIDCliente", as: 'clienteEVEIA'});

db.cupones.belongsTo(db.locatarios,{foreignKey: "fidLocatario", as: 'locatario'});
db.cupones.belongsTo(db.tipoCupons,{foreignKey: "fidTipoCupon", as: 'tipoCupon'});

db.users.belongsTo(db.locatarios,{foreignKey: "fidLocatario", as: 'locatarioUser'});
db.locatarios.hasMany(db.users,{foreignKey: "fidLocatario", as: 'locatarioUser'});

db.locatarios.hasMany(db.cupones,{foreignKey: "fidLocatario", as: 'locatario'});
db.tipoCupons.hasMany(db.cupones,{foreignKey: "fidTipoCupon", as: 'tipoCupon'});

db.cuponXClientes.belongsTo(db.cupones,{foreignKey: "fidCupon", as: 'cupon'});
db.cupones.hasMany(db.cuponXClientes,{foreignKey: "fidCupon", as: 'cupon'});


db.cuponXClientes.belongsTo(db.clients,{foreignKey: "fidCliente", as:'cliente'});
db.clients.hasMany(db.cuponXClientes,{foreignKey: "fidCliente", as:'cliente'});

/* COSAS DE LOS QRS */
db.escaneos.belongsTo(db.clients, { foreignKey: 'fidClient', as: 'cliente' });

db.escaneos.belongsTo(db.eventos, {
    foreignKey: 'fidReferencia',
    constraints: false,
    as: 'evento',
    scope: {
        tipo: 'evento'
    }
});

db.escaneos.belongsTo(db.locatarios, {
    foreignKey: 'fidReferencia',
    constraints: false,
    as: 'locatario',
    scope: {
        tipo: 'tienda'
    }
});

db.escaneos.belongsTo(db.cuponXClientes, {
    foreignKey: 'fidReferencia',
    constraints: false,
    as: 'cupon',
    scope: {
        tipo: 'cupon'
    }
});


//exporting the module
module.exports = db