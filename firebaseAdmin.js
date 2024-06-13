const admin = require('firebase-admin');
const serviceAccount = require('./appplazasanmiguel-9ec6e-firebase-adminsdk-rdylq-3e317b4222.json'); // Reemplaza con la ruta a tu archivo JSON

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
