const express = require('express');
const qrController = require('../../controllers/qrController');
const qrRouter = express.Router();
const multer = require('multer');
const upload = multer();
const authenticateToken = require("../../middlewares/authenticateToken");

qrRouter.post('/generar', qrController.generateQr);
qrRouter.post('/scan', qrController.scanQr);
qrRouter.post('/insertarMarco', upload.any(), qrController.insertarMarcoQR);
qrRouter.post('/generarQRMarco', qrController.generateQrInFrame);
qrRouter.post('/listarQRMarco', qrController.listarMarcos);
qrRouter.post('/habilitarMarco', qrController.habilitarMarcos);
qrRouter.post('/deshabilitarMarco', qrController.deshabilitarMarcos);
qrRouter.post('/modificarMarco', upload.any(), qrController.modificarMarco);
qrRouter.post('/usarCupon', qrController.usarCuponQR);
module.exports = qrRouter;
