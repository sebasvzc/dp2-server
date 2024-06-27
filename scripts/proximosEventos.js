// /scripts/proximoEvento.js
const db = require("../models");
const Eventos = db.eventos;
const { Op } = require("sequelize");
const moment = require("moment");
require('moment/locale/es');  // Cargar el idioma español
moment.locale('es');  // Configurar el idioma español
const admin = require('../firebaseAdmin');

const validateToken = async (token) => {
    try {
        console.log("verificando a: "+ token)
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken ? true : false;
    } catch (error) {
        console.error('Invalid token:', error);
        return false;
    }
};


const sendNotification = async (token, title, message) => {
    //if (await validateToken(token)) {
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
    /*} else {
        console.error('Invalid token, notification not sent.');
    }*/
};


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
            const title = "¡Disfruta en Plaza San Miguel!";
            const body = `${evento.nombre}\nFecha: ${moment(evento.fechaInicio).format('DD/MM [a las] hA')}`;
            

            try {
                const userTokens = await db.notificationToken.findAll({ where: {activo: true } });
                //console.log(userTokens)
        
                if (!userTokens.length) {
                    console.log('No tokens found for user');
                    return 
                }
        
                let messages = [];
                for (let userToken of userTokens) {
                    /*if (!Expo.isExpoPushToken(userToken.token)) {
                        console.error(`Push token ${userToken.token} is not a valid Expo push token`);
                        continue;
                    }
        
                    messages.push({
                        to: userToken.token,
                        sound: 'default',
                        title,
                        body,
                        data: { withSome: 'data' },
                    });*/
                    await sendNotification(userToken.token, title,body)
                    console.log("### "+title+"\n"+body+"\n"+ userToken.token)
                }
        
                /*let chunks = expo.chunkPushNotifications(messages);
                let tickets = [];
                for (let chunk of chunks) {
                    try {
                        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                        tickets.push(...ticketChunk);
                    } catch (error) {
                        console.error(error);
                    }
                }*/
        
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
