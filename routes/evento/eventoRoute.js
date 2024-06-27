const express = require('express');

const multer = require('multer');
const upload = multer();

var eventoController = require('../../controllers/eventoController');
const { getGeneroPorcEventos,getEdadPorcEventos,getEventosConAsistentesYCategoria,getEventos,crear,modificar,deshabilitar,habilitar,getPersonasAsistente,detalleEventoCompleto,getAsistencia,getAsitenciaXGeneroAgrupEdad,getPuntosEventosAsitencia} = eventoController

const authenticateToken = require("../../middlewares/authenticateToken");
const userController = require("../../controllers/userController");
const verifyPermission = require("../../middlewares/verifiyPermision");
var eventoRouter = express.Router();

eventoRouter.get('/getEventosAsisCateg', authenticateToken,getEventosConAsistentesYCategoria);
eventoRouter.get('/getPersonasAsistente', authenticateToken,getPersonasAsistente);
eventoRouter.get('/getGeneroPorcEventos', authenticateToken,getGeneroPorcEventos);
eventoRouter.get('/getEdadPorcEventos', authenticateToken,getEdadPorcEventos);
eventoRouter.get('/getPuntosEventosAsitencia', authenticateToken,getPuntosEventosAsitencia);
eventoRouter.post('/getEventosProximos', eventoController.getEventosProximos);
eventoRouter.post('/detalleEventoCompleto',authenticateToken, detalleEventoCompleto);
eventoRouter.get('/listarAsistencia',authenticateToken, getAsistencia);
eventoRouter.get('/asitenciaXGeneroAgrupEdad',authenticateToken, getAsitenciaXGeneroAgrupEdad);
eventoRouter.post('/getEventosProximosTotales', eventoController.getEventosProxTotales);
eventoRouter.get('/listarEventos', authenticateToken,getEventos);
eventoRouter.post('/crear',upload.any(), authenticateToken,crear);
eventoRouter.post('/modificar',upload.any(), authenticateToken,modificar);
eventoRouter.post('/deshabilitar', authenticateToken,deshabilitar);
eventoRouter.post('/habilitar', authenticateToken,habilitar);
eventoRouter.post('/getEventoIA', eventoController.getEventosIA);

module.exports = eventoRouter;