const express = require('express');
var categoriaTiendaController = require('../../controllers/categoriaTiendaController');
var categoriaTiendaRouter = express.Router();
const authenticateToken = require("../../middlewares/authenticateToken");

categoriaTiendaRouter.post('/listarCategoriaTiendas', categoriaTiendaController.getCategoriaTiendas);
categoriaTiendaRouter.get('/listarCategoriaTiendasWeb', authenticateToken,categoriaTiendaController.getCategoriaTiendasWeb);
categoriaTiendaRouter.get('/getTopCategoriasAsist', authenticateToken,categoriaTiendaController.getTopCategoriasAsist);
categoriaTiendaRouter.get('/getBottomCategoriasAsist', authenticateToken,categoriaTiendaController.getBottomCategoriasAsist);
categoriaTiendaRouter.post('/crearCategoriaTiendaWeb', categoriaTiendaController.crearCategoriaTiendaWeb);
categoriaTiendaRouter.post('/editarCategoriaTiendaWeb', categoriaTiendaController.editarCategoriaTiendaWeb);
categoriaTiendaRouter.post('/habilitarCategoriaTiendaWeb',categoriaTiendaController.habilitarCategoria);
categoriaTiendaRouter.post('/deshabilitarCategoriaTiendaWeb',categoriaTiendaController.deshabilitarCategoria);
module.exports = categoriaTiendaRouter;