const express = require('express');
var categoriaTiendaController = require('../../controllers/categoriaTiendaController');
var categoriaTiendaRouter = express.Router();
const authenticateToken = require("../../middlewares/authenticateToken");

categoriaTiendaRouter.post('/listarCategoriaTiendas', categoriaTiendaController.getCategoriaTiendas);
categoriaTiendaRouter.get('/listarCategoriaTiendasWeb', authenticateToken,categoriaTiendaController.getCategoriaTiendas);
module.exports = categoriaTiendaRouter;