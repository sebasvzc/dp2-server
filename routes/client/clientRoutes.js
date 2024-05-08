//importing modules
const express = require('express')
const clienController = require('../../controllers/clientController')
const { signup, login,getClientData, getUser, updateUser, deleteUser } = clienController
const clientAuth = require('../../middlewares/clientAuth')
const authenticateToken  = require('../../middlewares/authenticateToken')
const {sign} = require("jsonwebtoken");
const clientRouter = express.Router()

//signup endpoint
//passing the middleware function to the signup

clientRouter.post('/signup', clientAuth.saveClient, signup);
clientRouter.post('/login', login);
clientRouter.post('/misCupones', clienController.getMisCupones)
clientRouter.post('/extraerData', getClientData);
    //router.get('/listusers', authenticateToken, getUser);

    //router.put('/users/:email', updateUser);
    //router.delete('/users/:email', deleteUser);
clientRouter.post('/deshabilitarCliente',clienController.disableClient);
clientRouter.post('/habilitarCliente',clienController.ableClient);

module.exports = clientRouter;
