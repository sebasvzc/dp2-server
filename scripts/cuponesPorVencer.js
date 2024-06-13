const db = require("../models");
const cuponXCliente = db.cuponXClientes;
const { Op } = require("sequelize");
const moment = require("moment");
const { sendNotificationTodos } = require("../controllers/notificationsController");

const { Expo } = require('expo-server-sdk');
const expo = new Expo();

const cuponesPorVencer = async () => {
    plazoDias = 5;
    //obteniendo los datos
    try {
        const users = await db.notificationToken.findAll({ where: { activo: true } });
        const today = moment().startOf('day').toDate();
        const daysLater = moment().add(plazoDias, 'days').endOf('day').toDate();

        // Obtener todos los fidCliente únicos
        const fidClientes = [...new Set(users.map(user => user.fidCliente))];

        for (let idCliente of fidClientes) {
            // Configurar las opciones para la consulta de cuponXClientes
            const options = {
                limit: +size,
                offset: (+page) * (+size),
                attributes: ['id', 'fidCupon'],
                required: true,
                include: [
                    {
                        model: db.cupones,
                        association: 'cupon',
                        attributes: ['codigo', 'sumilla', 'fechaExpiracion'],
                        required: true,
                        include: [
                            {
                                model: db.locatarios,
                                association: 'locatario',
                                attributes: ['id', 'nombre'],
                                required: true,
                            }
                        ]
                    }
                ],
                where: {
                    fidCliente: idCliente,
                    usado: 0,
                    activo: 1,
                    fechaExpiracion: {
                        [Op.between]: [today, daysLater]
                    }
                }
            };

            // Obtener los cupones del cliente
            const cuponesUsuarios = await db.cuponXClientes.findAll(options);

            if (cuponesUsuarios.length > 0) {
                // Obtener todos los tokens para el cliente actual
                const userTokens = users.filter(user => user.fidCliente === idCliente).map(user => user.token);

                // Preparar las notificaciones
                for (let cuponUsuario of cuponesUsuarios) {
                    const cupon = cuponUsuario.cupon;
                    const locatario = cupon.locatario;
                    const title = "Cupones por vencer";
                    const body = `Cupón: ${cupon.codigo}, ${cupon.sumilla}. Vence: ${moment(cupon.fechaExpiracion).format('LLL')}. Locatario: ${locatario.nombre}`;

                    let messages = [];
                    for (let token of userTokens) {
                        if (!Expo.isExpoPushToken(token)) {
                            console.error(`Push token ${token} is not a valid Expo push token`);
                            continue;
                        }

                        messages.push({
                            to: token,
                            sound: 'default',
                            title,
                            body,
                            data: { cuponId: cupon.id },
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
                }
                console.log(`Notifications sent successfully for cliente ${idCliente}`);
            } else {
                console.log(`No cupones por vencer for cliente ${idCliente}`);
            }
        }
    } catch (error) {
        console.error("Error al obtener los cupones por vencer:", error);
    }

}