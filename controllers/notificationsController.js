const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
let expo = new Expo();
let savedTokens = []; // Consider storing these tokens in a database for production

exports.registerToken = (req, res) => {
    const { token } = req.body;
    if (!savedTokens.includes(token)) {
        savedTokens.push(token);
    }
    res.status(200).send({ success: true, message: 'Token registrado correctamente.' });
};

exports.sendNotification = async (req, res) => {
    let messages = [];
    for (let pushToken of savedTokens) {
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            continue;
        }

        messages.push({
            to: pushToken,
            sound: 'default',
            body: 'Nueva notificación!',
            data: { withSome: 'data' },
        });
    }

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    for (let chunk of chunks) {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error(error);
        }
    }

    res.status(200).send({ success: true, message: 'Notificaciones enviadas.' });
};
