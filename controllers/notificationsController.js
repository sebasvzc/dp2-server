// controllers/notificationController.js

const { Expo } = require('expo-server-sdk');
const expo = new Expo();
const db = require("../models");

exports.registerToken = async (req, res) => {
    console.log("BOOOOOOOOOOOODDDDDDDDDDDDYYYYYYYYYYY: "+req.body)
    const { fidCliente, token } = req.body;

    // Validar que fidCliente y token están presentes
    if (!fidCliente || !token) {
        return res.status(400).json({ error: 'fidCliente y token son requeridos' });
    }

    // Validar que fidCliente es un número
    if (isNaN(fidCliente) || fidCliente < 1) {
        return res.status(400).json({ error: 'fidCliente debe ser un numero mayor o igual a 1' });
    }

    try {
        const [userToken, created] = await db.notificationToken.findOrCreate({
            where: { token },
            defaults: { fidCliente, token, activo: true },
        });

        if (!created) {
            userToken.fidCliente = fidCliente;
            userToken.activo = true;
            await userToken.save();
        }

        res.status(201).json({ message: 'Token registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error registering token' });
    }
};

exports.unregisterToken = async (req, res) => {
    const { token } = req.body;

    try {
        const userToken = await db.notificationToken.findOne({ where: { token } });

        if (userToken) {
            userToken.activo = false;
            await userToken.save();
            res.status(200).send('Token unregistered successfully');
        } else {
            res.status(404).send('Token not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error unregistering token');
    }
};

exports.sendNotification = async (req, res) => {
    const { fidCliente, title, body } = req.body;

    try {
        const userTokens = await db.notificationToken.findAll({ where: { fidCliente, activo: true } });
        console.log(userTokens)

        if (!userTokens.length) {
            return res.status(404).send('No tokens found for user');
        }

        let messages = [];
        for (let userToken of userTokens) {
            if (!Expo.isExpoPushToken(userToken.token)) {
                console.error(`Push token ${userToken.token} is not a valid Expo push token`);
                continue;
            }

            messages.push({
                to: userToken.token,
                sound: 'default',
                title,
                body,
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

        res.status(200).send('Notification sent successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error sending notification');
    }
};