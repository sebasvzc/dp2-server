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
var eventoRoutes = require('./evento/eventoRoute')
const crypto = require("crypto");
const nodemailer = require('nodemailer');
const cuponRouter = require('./cupones/cuponRoute');
const qrRouter = require('./qr/qrRoute')
const configRoute = require('./configuraciones/configuracionesRoute')
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
router.use('/eventos', eventoRoutes);
router.use('/cupones', cuponRouter);
router.use('/tipocupones', tipoCuponRoutes);
router.use('/qr', qrRouter);
router.use('/config', configRoute);

module.exports = router;