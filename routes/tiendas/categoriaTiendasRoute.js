const express = require('express');
var categoriaTiendaController = require('../../controllers/categoriaTiendaCrontroller');
var categoriaTiendaRouter = express.Router();

categoriaTiendaRouter.post('/listarCategoriaTiendas', categoriaTiendaController.getCategoriaTiendas);

module.exports = categoriaTiendaRouter;