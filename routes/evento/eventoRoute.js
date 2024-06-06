const express = require('express');

const multer = require('multer');
const upload = multer();

var eventoController = require('../../controllers/eventoController');
const { getEventosConAsistentesYCategoria,getEventos,crear,modificar,deshabilitar,habilitar} = eventoController

const authenticateToken = require("../../middlewares/authenticateToken");
const userController = require("../../controllers/userController");
var eventoRouter = express.Router();

eventoRouter.get('/getEventosAsisCateg', authenticateToken,getEventosConAsistentesYCategoria);
eventoRouter.post('/getEventosProximos', eventoController.getEventosProximos);
eventoRouter.post('/getEventosProximosTotales', eventoController.getEventosProxTotales);
eventoRouter.get('/listarEventos', authenticateToken,getEventos);
eventoRouter.post('/crear',upload.any(), authenticateToken,crear);
eventoRouter.post('/modificar',upload.any(), authenticateToken,modificar);
eventoRouter.post('/deshabilitar', authenticateToken,deshabilitar);
eventoRouter.post('/habilitar', authenticateToken,habilitar);

module.exports = eventoRouter;