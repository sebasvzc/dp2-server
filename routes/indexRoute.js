var express = require('express');
var router = express.Router();
//Usuarios
var userRouter = require('./user/userRoutes');
var clientRouter = require('./client/clientRoutes');
const userRoutes = require("./user/userRoutes");
const passManagerRoutes = require("./passwordManagment/passwordManagmentRoute");
const crypto = require("crypto");
const nodemailer = require('nodemailer');
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

module.exports = router;