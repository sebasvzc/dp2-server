const db = require("../models");
const cuponXCliente = db.cuponXClientes;
const { Op } = require("sequelize");
const moment = require("moment");
const { sendNotificationTodos } = require("../controllers/notificationsController");
const admin = require('../firebaseAdmin');

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
                attributes: ['id', 'fidCupon'],
                required: true,
                include: [
                    {
                        model: db.cupones,
                        association: 'cupon',
                        attributes: ['codigo', 'sumilla', 'fechaExpiracion'],
                        required: true,
                        where:{
                            fechaExpiracion: {
                                [Op.between]: [today, daysLater]
                            }
                        },
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
                        sendNotification(token,title,body)
                        console.log("### "+title+"\n"+body+"\n"+token)
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
module.exports = cuponesPorVencer;