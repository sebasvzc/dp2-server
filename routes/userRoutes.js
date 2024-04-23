//importing modules
const express = require('express')
const userController = require('../controllers/userController')
const { signup, login, getUser, updateUser, deleteUser } = userController
const userAuth = require('../middlewares/userAuth')
const authenticateToken  = require('../middlewares/authenticateToken')
const router = express.Router()

//signup endpoint
//passing the middleware function to the signup
module.exports = (transporter,crypto) => {
    router.post('/users/invite', (req, res) => {
        const { email } = req.body;
        const tokenData = {
            email,
            expiresIn: Date.now() + 24 * 60 * 60 * 1000, // 24 horas en milisegundos
        };
        const token = jwt.sign(tokenData, 'secretKey');
        const link = `http://localhost:3030/register?token=${token}`;

        transporter.sendMail({
            to: email,
            subject: 'Invitación a registrarse',
            html: `¡Hola! Has sido invitado a registrarte. Haz clic <a href="${link}">aquí</a> para registrarte. Este enlace es válido por 24 horas.`
        });

        res.json({ message: 'Invitación enviada correctamente.' });
    });

    router.post('/users/signup', userAuth.saveUser, signup);
    router.post('/login', login);
    router.get('/users', authenticateToken, getUser);
    router.put('/users/:email', updateUser);
    router.delete('/users/:email', deleteUser);

    return router;
};