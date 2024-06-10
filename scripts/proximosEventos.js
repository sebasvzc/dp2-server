// /scripts/proximoEvento.js
const db = require("../models");
const Eventos = db.eventos;
const { Op } = require("sequelize");
const moment = require("moment");
const { sendNotificationTodos } = require("../controllers/notificationsController");


const { Expo } = require('expo-server-sdk');
const expo = new Expo();


const proximoEvento = async () => {
    try {
        const tomorrow = moment().add(1, 'days').startOf('day').toDate();
        const endOfTomorrow = moment().add(1, 'days').endOf('day').toDate();
        const eventos = await Eventos.findAll({
            where: {
                fechaInicio: {
                    [Op.between]: [tomorrow, endOfTomorrow]
                }
            },
            attributes: ['nombre', 'fechaInicio'] 
        });

        for (let evento of eventos) {
            const title = "Eventos de mañana";
            const body = `Evento: ${evento.nombre}, Fecha: ${moment(evento.fechaInicio).format('LLL')}`;
            

            try {
                const userTokens = await db.notificationToken.findAll({ where: {activo: true } });
                console.log(userTokens)
        
                if (!userTokens.length) {
                    console.log('No tokens found for user');
                    return 
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
        
                console.log('Notification sent successfully');
            } catch (error) {
                console.error(error);
                console.log('Error sending notification');
            }


        }
    } catch (error) {
        console.error("Error al obtener los eventos de mañana:", error);
    }
};

module.exports = proximoEvento;
