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

module.exports = qrRouter;
