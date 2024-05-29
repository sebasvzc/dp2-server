const express = require('express');

const multer = require('multer');
const upload = multer();

var cuponController = require('../../controllers/cuponController');
const { getCuponesClientes,getCupones, deshabilitar, habilitar,crear,modificar,detalleCuponCompleto,getClientesXCupon,getCuponesXDiaCanjeado} = cuponController
const authenticateToken = require("../../middlewares/authenticateToken");
const userController = require("../../controllers/userController");
var cuponRouter = express.Router();

cuponRouter.post('/detalleCupon', cuponController.detalleCupon);
cuponRouter.post('/detalleCuponCompleto',authenticateToken, detalleCuponCompleto);
cuponRouter.get('/listarcupones', authenticateToken,getCupones);
cuponRouter.get('/listarclientesxcupon', authenticateToken,getClientesXCupon);
cuponRouter.post('/deshabilitar', authenticateToken,deshabilitar);
cuponRouter.post('/habilitar', authenticateToken,habilitar);
cuponRouter.post('/crear', authenticateToken,upload.any(),crear);
cuponRouter.post('/modificar', authenticateToken,upload.any(),modificar);
cuponRouter.get('/listarcuponescliente', getCuponesClientes);
cuponRouter.get('/listarcuponesxdiacanjeado', getCuponesXDiaCanjeado);

cuponRouter.post('/listarCuponesFiltradosGeneral', cuponController.cuponesFiltradosGeneral);
cuponRouter.post('/comprarCuponCliente', cuponController.comprarCuponCliente);
module.exports = cuponRouter;