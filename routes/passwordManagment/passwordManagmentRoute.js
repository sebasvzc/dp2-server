//importing modules
const express = require('express');
var passManagerController = require('../../controllers/passwordManagmentController');
var passManagerRouter = express.Router();

passManagerRouter.post('/olvidoPassword', passManagerController.forgotPassword);
passManagerRouter.post('/cambiarPassword', passManagerController.changePassword);
passManagerRouter.post('/olvidoPasswordWeb', passManagerController.forgotPasswordWeb);
passManagerRouter.post('/cambiarPasswordWeb', passManagerController.changePasswordWeb);
passManagerRouter.post('/validarCodigoCliente', passManagerController.validarCodigoCliente);
passManagerRouter.post('/validarCodigoWeb', passManagerController.validarCodigoWeb);

module.exports = passManagerRouter;
