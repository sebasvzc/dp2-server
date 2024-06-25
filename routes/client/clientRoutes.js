//importing modules
const express = require('express')
const clienController = require('../../controllers/clientController')
const { signup, login,getClientData, getUser, updateUser, deleteUser } = clienController
const clientAuth = require('../../middlewares/clientAuth')
const authenticateToken  = require('../../middlewares/authenticateToken')
const {sign} = require("jsonwebtoken");
const verifyPermission = require("../../middlewares/verifiyPermision");
const clientRouter = express.Router()

//signup endpoint
//passing the middleware function to the signup

clientRouter.post('/signup', clientAuth.saveClient, signup);
clientRouter.post('/login', login);
clientRouter.post('/misCupones', clienController.getMisCupones)

clientRouter.post('/extraerData', getClientData);

clientRouter.get('/cuponesObtenidos/:id_cliente', clienController.getCuponesEstado);

    //router.get('/listusers', authenticateToken, getUser);

    //router.put('/users/:email', updateUser);
    //router.delete('/users/:email', deleteUser);
clientRouter.post('/deshabilitarCliente',clienController.disableClient);
clientRouter.post('/habilitarCliente',clienController.ableClient);
clientRouter.post('/modificarCliente',clienController.modificarClient);
clientRouter.post('/listarClientesActivos',clienController.listarClientesActivos);
clientRouter.get('/listarCuponesXClientes',authenticateToken,clienController.listarCuponesXClientes);
clientRouter.get('/listarcuponesxcliente', authenticateToken,clienController.getCuponesXCliente);
clientRouter.get('/listarCuponesCategoriaRadar',authenticateToken,clienController.listarCuponesCategoriaRadar);
clientRouter.get('/listarEventosCategoria', authenticateToken,clienController.listarEventosCategoria);
clientRouter.get('/listarCuponesCanjeadosUsados',authenticateToken,clienController.listarCuponesCanjeadosUsados);
clientRouter.post('/eventosHoy',clienController.getEventosHoy);
clientRouter.post('/eventoDetalle/:id_evento',clienController.getEventoDetalle);
clientRouter.post('/verPermisoUsuario/:id_cliente',clienController.verPermisoUsuario);
clientRouter.post('/cambiarPermisoUsuario',clienController.cambiarPermisoUsuario);
clientRouter.post('/IAKNNCompartido',clienController.IAKNNCompartido);
clientRouter.post('/IARecomendadorPersonalizado',clienController.IARecomendadorPersonalizado);


clientRouter.post('/jugarRA',clienController.jugar);
module.exports = clientRouter;
