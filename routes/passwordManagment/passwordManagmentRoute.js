//importing modules
const express = require('express');
const passManagerController = require('../../controllers/passwordManagmentController');
const passManagerRouter = express.Router();

passManagerRouter.post('/olvidoPassword', passManagerController.forgotPassword);

module.exports = passManagerRouter;
