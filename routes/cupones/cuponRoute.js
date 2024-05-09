const express = require('express');
var cuponController = require('../../controllers/cuponController');
const { getCupones, deshabilitar, habilitar,crear,modificar } = cuponController
const authenticateToken = require("../../middlewares/authenticateToken");
const userController = require("../../controllers/userController");
var cuponRouter = express.Router();

cuponRouter.post('/detalleCupon', cuponController.detalleCupon);
cuponRouter.get('/listarcupones', authenticateToken,getCupones);
cuponRouter.post('/deshabilitar', authenticateToken,deshabilitar);
cuponRouter.post('/habilitar', authenticateToken,habilitar);
cuponRouter.post('/crear', authenticateToken,crear);
cuponRouter.post('/modificar', authenticateToken,modificar);
module.exports = cuponRouter;