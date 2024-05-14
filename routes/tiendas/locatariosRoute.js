const express = require('express');
var tiendaController = require('../../controllers/tiendaController');
const authenticateToken = require("../../middlewares/authenticateToken");

const { getTiendas } = tiendaController
var tiendaRouter = express.Router();

tiendaRouter.get('/listartiendas', authenticateToken ,getTiendas);

module.exports = tiendaRouter;