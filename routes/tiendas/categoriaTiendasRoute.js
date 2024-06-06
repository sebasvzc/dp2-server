const express = require('express');
var categoriaTiendaController = require('../../controllers/categoriaTiendaController');
var categoriaTiendaRouter = express.Router();
const authenticateToken = require("../../middlewares/authenticateToken");

categoriaTiendaRouter.post('/listarCategoriaTiendas', categoriaTiendaController.getCategoriaTiendas);
categoriaTiendaRouter.get('/listarCategoriaTiendasWeb', authenticateToken,categoriaTiendaController.getCategoriaTiendas);
categoriaTiendaRouter.post('/crearCategoriaTiendaWeb', categoriaTiendaController.crearCategoriaTiendaWeb);
categoriaTiendaRouter.post('/editarCategoriaTiendaWeb', categoriaTiendaController.editarCategoriaTiendaWeb);
module.exports = categoriaTiendaRouter;