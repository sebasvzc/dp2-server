// routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationsController');

router.post('/register-token', notificationController.registerToken);
router.post('/unregister-token', notificationController.unregisterToken);
router.post('/send-notification', notificationController.sendNotification);

module.exports = router;
