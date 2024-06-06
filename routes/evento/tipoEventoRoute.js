const express = require('express');
var tipoEventoController = require('../../controllers/tipoEventoController');
const { getTipoEventos } = tipoEventoController

var tipoEventoRouter = express.Router();

const authenticateToken = require("../../middlewares/authenticateToken");


tipoEventoRouter.get('/listarTipoEvento', authenticateToken,getTipoEventos);
module.exports = tipoEventoRouter;