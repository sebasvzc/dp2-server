const express = require('express');
const configuracionesController = require('../../controllers/configuracionesController');
const configuracionesRouter = express.Router();
const multer = require('multer');
const upload = multer();
const authenticateToken = require("../../middlewares/authenticateToken");

configuracionesRouter.post('/imagenDefecto', upload.any(), configuracionesController.subirImagenPorDefecto);

module.exports = configuracionesRouter