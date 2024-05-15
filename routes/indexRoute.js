var express = require('express');
var router = express.Router();
//Usuarios
var userRouter = require('./user/userRoutes');
var clientRouter = require('./client/clientRoutes');
const userRoutes = require("./user/userRoutes");
var passManagerRoutes = require('./passwordManagment/passwordManagmentRoute');
var catTiendaRoutes = require('./tiendas/categoriaTiendasRoute')
var tiendasRoutes = require('./tiendas/locatariosRoute')
var tipoCuponRoutes = require('./cupones/tipoCuponRoute')
const crypto = require("crypto");
const nodemailer = require('nodemailer');
const cuponRouter = require('./cupones/cuponRoute');
// Configurar el transporte de correo
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port:465,
    secure: true,
    auth:{
        user:"testerjohhnydp2@gmail.com",
        pass:"xjgypqgxtgakdxos"
    }
});
router.use('/user', userRoutes(transporter,crypto));
router.use('/client', clientRouter);
router.use('/password', passManagerRoutes);
router.use('/categoriaTienda', catTiendaRoutes);
router.use('/tiendas', tiendasRoutes);
router.use('/cupones', cuponRouter);
router.use('/tipocupones', tipoCuponRoutes);

module.exports = router;