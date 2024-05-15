const express = require('express');
var tipoCuponController = require('../../controllers/tipoCuponController');
const { getTipoCupones } = tipoCuponController

var tipoCuponRouter = express.Router();

const authenticateToken = require("../../middlewares/authenticateToken");


tipoCuponRouter.get('/listartipocupones', authenticateToken,getTipoCupones);
module.exports = tipoCuponRouter;