/*const express = require('express');
const router = express.Router();
const admin = require('../firebaseAdmin');
const cron = require('node-cron');

// Simulación de una base de datos en memoria para almacenar tokens
const users = {
  'user1': 'token1',
  'user2': 'token2'
};

// Función para enviar notificación
const sendNotification = (token, title, message) => {
  const messagePayload = {
    notification: {
      title: title,
      body: message
    },
    token: token
  };
 
  admin.messaging().send(messagePayload)
    .then(response => {
      console.log('Notification sent successfully:', response);
    })
    .catch(error => {
      console.error('Error sending notification:', error);
    });
};

// Ruta para enviar notificación a un usuario específico
router.post('/send', (req, res) => {
  const { userId, title, message } = req.body;
  const token = users[userId];

  if (!token) {
    return res.status(400).send({ success: false, message: 'User not found' });
  }

  sendNotification(token, title, message);
  res.status(200).send({ success: true, message: 'Notification sent' });
});

// Tarea programada para enviar notificación todos los días a una hora específica
cron.schedule('0 9 * * *', () => { // Esto programará la tarea para las 9 AM todos los días
  console.log('Sending daily notifications...');
  Object.keys(users).forEach(userId => {
    const token = users[userId];
    sendNotification(token, 'Daily Notification', 'This is your daily notification.');
  });
});

module.exports = router;*/
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationsController');

router.post('/register-token', notificationController.registerToken);
router.post('/unregister-token', notificationController.unregisterToken);
//router.post('/send-notification', notificationController.sendNotification);
router.post('/configurarNotificacion', notificationController.updateTaskConfig);
router.post('/listarNotificacion', notificationController.listNotifications);

module.exports = router;
