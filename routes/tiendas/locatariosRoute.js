const express = require('express');
var tiendaController = require('../../controllers/tiendaController');
const authenticateToken = require("../../middlewares/authenticateToken");

const { getTiendas,deshabilitar, habilitar } = tiendaController
var tiendaRouter = express.Router();

tiendaRouter.get('/listartiendas', authenticateToken ,getTiendas);
tiendaRouter.post('/deshabilitar', authenticateToken ,deshabilitar);
tiendaRouter.post('/habilitar', authenticateToken ,habilitar);

module.exports = tiendaRouter;