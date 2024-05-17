const express = require('express');

const multer = require('multer');
const upload = multer();

var cuponController = require('../../controllers/cuponController');
const { getCuponesClientes,getCupones, deshabilitar, habilitar,crear,modificar,detalleCuponCompleto } = cuponController
const authenticateToken = require("../../middlewares/authenticateToken");
const userController = require("../../controllers/userController");
var cuponRouter = express.Router();

cuponRouter.post('/detalleCupon', cuponController.detalleCupon);
cuponRouter.post('/detalleCuponCompleto',authenticateToken, detalleCuponCompleto);
cuponRouter.get('/listarcupones', authenticateToken,getCupones);
cuponRouter.post('/deshabilitar', authenticateToken,deshabilitar);
cuponRouter.post('/habilitar', authenticateToken,habilitar);
cuponRouter.post('/crear', authenticateToken,upload.any(),crear);
cuponRouter.post('/modificar', authenticateToken,modificar);
cuponRouter.get('/listarcuponescliente', getCuponesClientes);
module.exports = cuponRouter;