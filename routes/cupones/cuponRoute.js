const express = require('express');

const multer = require('multer');
const upload = multer();

var cuponController = require('../../controllers/cuponController');
const { getCuponesClientes,getCupones, deshabilitar, habilitar,crear,modificar,detalleCuponCompleto,getClientesXCupon,getCuponesXDiaCanjeado} = cuponController
const authenticateToken = require("../../middlewares/authenticateToken");
const verifyPermission = require("../../middlewares/verifiyPermision");
const userController = require("../../controllers/userController");
var cuponRouter = express.Router();

cuponRouter.post('/detalleCupon', cuponController.detalleCupon);
cuponRouter.post('/detalleCuponCompleto',authenticateToken, verifyPermission,detalleCuponCompleto);
cuponRouter.get('/listarcupones', authenticateToken,verifyPermission,getCupones);
cuponRouter.get('/listarclientesxcupon', authenticateToken,verifyPermission,getClientesXCupon);
cuponRouter.post('/deshabilitar', authenticateToken,verifyPermission,deshabilitar);
cuponRouter.post('/habilitar', authenticateToken,verifyPermission,habilitar);
cuponRouter.post('/crear', authenticateToken,upload.any(),verifyPermission,crear);
cuponRouter.post('/modificar', authenticateToken,upload.any(),verifyPermission,modificar);
cuponRouter.get('/listarcuponescliente', getCuponesClientes);
cuponRouter.get('/listarcuponesxdiacanjeado', getCuponesXDiaCanjeado);

cuponRouter.post('/listarCuponesFiltradosGeneral', cuponController.cuponesFiltradosGeneral);
cuponRouter.post('/comprarCuponCliente', cuponController.comprarCuponCliente);
cuponRouter.post('/cuponesFavoritos', cuponController.cuponesFavoritos);
cuponRouter.post('/interacciones', cuponController.allInteracciones);

cuponRouter.post('/recomendacionGeneral', cuponController.cuponesRecomendadosGeneral);
cuponRouter.post('/nuevaRecomendacionGeneral', cuponController.nuevasRecomendaciones);
cuponRouter.post('/cuponesParaIA', cuponController.cuponesParaIA);
module.exports = cuponRouter;