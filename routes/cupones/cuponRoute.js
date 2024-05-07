const express = require('express');
var cuponController = require('../../controllers/cuponController');
var cuponRouter = express.Router();

cuponRouter.post('/detalleCupon', cuponController.detalleCupon);

module.exports = cuponRouter;