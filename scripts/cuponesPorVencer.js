const db = require("../models");
const cuponXCliente = db.cuponXClientes;
const { Op } = require("sequelize");
const moment = require("moment");
const { sendNotificationTodos } = require("../controllers/notificationsController");
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
/*
const cuponesPorVencer = async () => {
    plazoDias = 5;
    //obteniendo los datos
    console.log("voy a ejecutar")
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
                    console.log("enviado al CUPON... "+ cupon.sumilla)
                    for (let token of userTokens) {
                        console.log("INTENTANDO ENVIAR A... "+token )
                        await sendNotification(token,title,body)
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
*/
const cuponesPorVencer = async () => {
    plazoDias = 5;
    // obteniendo los datos
    console.log("voy a ejecutar");
    try {
        const users = await db.notificationToken.findAll({ where: { activo: true } });
        const today = moment().startOf('day').toDate();
        const daysLater = moment().add(plazoDias, 'days').endOf('day').toDate();

        // Obtener todos los fidCliente únicos
        const fidClientes = [...new Set(users.map(user => user.fidCliente))];

        for (let idCliente of fidClientes) {
            // Configurar las opciones para la consulta de cuponXClientes
            console.log("CLIENTE: "+idCliente+"*******************************************\n")
            const options = {
                attributes: ['id', 'fidCupon'],
                required: true,
                include: [
                    {
                        model: db.cupones,
                        association: 'cupon',
                        attributes: ['id'],
                        required: true,
                        where: {
                            fechaExpiracion: {
                                [Op.between]: [today, daysLater]
                            }
                        }
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

                // Contar el número de cupones por vencer
                const cuponesCount = cuponesUsuarios.length;
                const title = "Cupones por vencer";
                const body = `Tienes ${cuponesCount} cupones que vencerán pronto!`;

                // Enviar una única notificación a cada token del cliente
                for (let token of userTokens) {
                    console.log("\n\n=================================================================")
                    console.log("INTENTANDO ENVIAR A... " + token);
                    await sendNotification(token, title, body);
                    console.log("### " + title + "\n" + body + "\n" + token);
                    console.log(`Notifications sent successfully for cliente ${idCliente}`);
                }

                
            } else {
                console.log(`No cupones por vencer for cliente ${idCliente}`);
            }
        }
    } catch (error) {
        console.error("Error al obtener los cupones por vencer:", error);
    }
}



module.exports = 
    cuponesPorVencer;
