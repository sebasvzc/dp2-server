const express = require('express');
const qrController = require('../../controllers/qrController');
const qrRouter = express.Router();

qrRouter.post('/generar', qrController.generateQr);
qrRouter.post('/scan', qrController.scanQr);

module.exports = qrRouter;