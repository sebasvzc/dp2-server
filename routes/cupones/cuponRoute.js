const express = require('express');
var cuponController = require('../../controllers/cuponController');
const { getCupones } = cuponController
const authenticateToken = require("../../middlewares/authenticateToken");
const userController = require("../../controllers/userController");
var cuponRouter = express.Router();

cuponRouter.post('/detalleCupon', cuponController.detalleCupon);
cuponRouter.get('/listarcupones', authenticateToken,getCupones);

module.exports = cuponRouter;