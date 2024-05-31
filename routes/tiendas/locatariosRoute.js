const express = require('express');

const multer = require('multer');
const upload = multer();
var tiendaController = require('../../controllers/tiendaController');
const authenticateToken = require("../../middlewares/authenticateToken");

const { getTiendas,deshabilitar, habilitar,crear, modificar,detalleTiendaCompleto,listarCuponesMesxTienda,getCuponesXTienda} = tiendaController
var tiendaRouter = express.Router();

tiendaRouter.get('/listartiendas', authenticateToken ,getTiendas);
tiendaRouter.post('/deshabilitar', authenticateToken ,deshabilitar);
tiendaRouter.post('/crear', authenticateToken,upload.any(),crear);
tiendaRouter.post('/modificar', authenticateToken,upload.any(),modificar);
tiendaRouter.post('/habilitar', authenticateToken ,habilitar);
tiendaRouter.post('/detalleTiendaCompleto', authenticateToken ,detalleTiendaCompleto);
tiendaRouter.get('/listarCuponesMesxTienda', authenticateToken ,listarCuponesMesxTienda);
tiendaRouter.get('/listarcuponesxtienda', authenticateToken,getCuponesXTienda);

module.exports = tiendaRouter;