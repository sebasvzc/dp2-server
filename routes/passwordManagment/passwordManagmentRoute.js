//importing modules
const express = require('express');
var passManagerController = require('../../controllers/passwordManagmentController');
var passManagerRouter = express.Router();

passManagerRouter.post('/olvidoPassword', passManagerController.forgotPassword);

module.exports = passManagerRouter;