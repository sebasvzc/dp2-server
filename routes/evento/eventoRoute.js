const express = require('express');

const multer = require('multer');
const upload = multer();

var eventoController = require('../../controllers/eventoController');
const { getEventosConAsistentesYCategoria } = eventoController

const authenticateToken = require("../../middlewares/authenticateToken");
const userController = require("../../controllers/userController");
var eventoRouter = express.Router();

eventoRouter.get('/getEventosAsisCateg', authenticateToken,getEventosConAsistentesYCategoria);
eventoRouter.post('/getEventosProximos', eventoController.getEventosProximos);
module.exports = eventoRouter;