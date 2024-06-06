const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');

router.post('/register-token', notificationsController.registerToken);
router.post('/send-notification', notificationsController.sendNotification);

module.exports = router;