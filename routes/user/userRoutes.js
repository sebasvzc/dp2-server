//importing modules
const express = require('express')
const userController = require('../../controllers/userController')
const userInvController = require('../../controllers/userInviteController')
const { signup, login, getUser,comprobarTokenRegistroUsuario,deshabilitar,habilitar,getUserPerms, getUserData,modificar,updateUser, deleteUser,getUsersPlayRA,getJuegosRAPorc} = userController
const { createUserInv} = userInvController
const userAuth = require('../../middlewares/userAuth')
const authenticateToken  = require('../../middlewares/authenticateToken')
const {sign} = require("jsonwebtoken");
const router = express.Router()
const db = require("../../models");
const envioCorreo = require('../../config/mailConfig');
const UserInv = db.usersInv;
const User = db.users;
//signup endpoint
//passing the middleware function to the signup
module.exports = (transporter,crypto) => {
    router.post('/invite', async (req, res) => { // Agregar 'async' aquí
        const { email } = req.body;
        const tokenData = {
            email,
            expiresIn: Date.now() + (60 * 60 * 1000), // 5 minutos en milisegundos
        };
        const token = sign(tokenData, 'secretKey');
        const link = `http://localhost:3030/register?token=${token}`;



        try {

            console.log("entre a registrar nuevo usuario para invitado")
            const emailcheckInv = await UserInv.findOne({
                where: {
                    email: email,
                },
            });
            //if email exist in the database respond with a status of 409
            if (emailcheckInv) {
                return res.status(403).send("Email es duplicado. Estas enviando de nuevo una invitacion a alguien que ya has invitado previamente y no se ha registrado!");
            }
            const emailcheck = await User.findOne({
                where: {
                    email: email,
                },
            });
            //if email exist in the database respond with a status of 409
            if (emailcheck) {
                return res.status(403).send("Email es duplicado. Estas enviando de nuevo una invitacion a alguien que ya creo su cuenta!");
            }

            const data = {
                email: email,
                active: 1
            };
            //saving the user
            const user = await UserInv.create(data); // Agregar 'await' aquí
            //if user details is captured
            //generate token with the user's id and the secretKey in the env file
            // set cookie with the token generated
            if (user) {
                console.log("userInv", JSON.stringify(user, null, 2));
                var asunto = 'Invitación de registro de usuario - Plaza San Miguel Web';
                var texto = `¡Hola! Has sido invitado a registrarte. Haz clic <a href="${link}">aquí</a> para registrarte. Este enlace es válido por 24 horas.`
                envioCorreo.enviarCorreo(email, asunto, texto);
                //send users details
                //broadcast(req.app.locals.clients, 'signup', user);
                return res.status(200).send({success:"true", message: 'Invitación enviada correctamente.'});
            } else {
                return res.status(400).send("Invalid request body");
            }
        } catch (error) {
            console.log('createUserInv - [Error]: ', error);
            return res.status(500).send("Internal Server Error");
        }

        res.json({ message: 'Invitación enviada correctamente.' });
    });

    router.post('/signup', userAuth.saveUser, signup);
    router.post('/login', login);
    router.post('/extraerData', authenticateToken,getUserData);
    router.get('/listarpermisos', authenticateToken,getUserPerms);
    router.post('/deshabilitar', deshabilitar);
    router.post('/habilitar', habilitar);
    router.post('/modificar', modificar);
    router.get('/listusers', authenticateToken ,getUser);
    router.get('/getUsersPlayRA', authenticateToken ,getUsersPlayRA);
    router.get('/getJuegosRAPorc', authenticateToken ,getJuegosRAPorc);
    router.post('/comprobarTokenRegistro', comprobarTokenRegistroUsuario);
    //router.put('/users/:email', updateUser);
    //router.delete('/users/:email', deleteUser);

    return router;
};




