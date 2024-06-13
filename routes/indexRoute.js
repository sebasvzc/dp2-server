var express = require('express');
var router = express.Router();

// Importar rutas existentes
var userRouter = require('./user/userRoutes');
var clientRouter = require('./client/clientRoutes');
const userRoutes = require("./user/userRoutes");
var passManagerRoutes = require('./passwordManagment/passwordManagmentRoute');
var catTiendaRoutes = require('./tiendas/categoriaTiendasRoute');
var tiendasRoutes = require('./tiendas/locatariosRoute');
var tipoCuponRoutes = require('./cupones/tipoCuponRoute');
var eventoRoutes = require('./evento/eventoRoute');
var tipoEventoRoutes = require('./evento/tipoEventoRoute');
var lugarRoutes = require('./evento/lugarRoute');
const cuponRouter = require('./cupones/cuponRoute');
const qrRouter = require('./qr/qrRoute');
const configRoute = require('./configuraciones/configuracionesRoute');
const notificationRoute = require('./notificationsRoute');
const crypto = require("crypto");
const nodemailer = require('nodemailer');

// Configurar el transporte de correo
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: "testerjohhnydp2@gmail.com",
        pass: "xjgypqgxtgakdxos"
    }
});

router.use('/user', userRoutes(transporter, crypto));
router.use('/client', clientRouter);
router.use('/password', passManagerRoutes);
router.use('/tipoEvento', tipoEventoRoutes);
router.use('/lugares', lugarRoutes);
router.use('/categoriaTienda', catTiendaRoutes);
router.use('/tiendas', tiendasRoutes);
router.use('/eventos', eventoRoutes);
router.use('/cupones', cuponRouter);
router.use('/tipocupones', tipoCuponRoutes);
router.use('/qr', qrRouter);
router.use('/config', configRoute);
router.use('/notifications', notificationRoute);

module.exports = router;
