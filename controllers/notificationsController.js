// controllers/notificationController.js

const { Expo } = require('expo-server-sdk');
const expo = new Expo();
const NotificationToken = require('../models/notificationTokenModel')(sequelize, DataTypes);

exports.registerToken = async (req, res) => {
    const { userId, token } = req.body;

    try {
        const [userToken, created] = await NotificationToken.findOrCreate({
            where: { token },
            defaults: { userId, token, activo: true },
        });

        if (!created) {
            userToken.userId = userId;
            userToken.activo = true;
            await userToken.save();
        }

        res.status(201).send('Token registered successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error registering token');
    }
};

exports.unregisterToken = async (req, res) => {
    const { token } = req.body;

    try {
        const userToken = await NotificationToken.findOne({ where: { token } });

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
    const { userId, title, body } = req.body;

    try {
        const userTokens = await NotificationToken.findAll({ where: { userId, activo: true } });

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
