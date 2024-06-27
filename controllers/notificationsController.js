// controllers/notificationController.js
const db = require("../models");
const { scheduledTasks, scheduleTask } = require('../scripts/index.scripts');
const proximoEvento = require("../scripts/proximosEventos");
const cuponesXVencer = require("../scripts/cuponesPorVencer")


const cuponXCliente = db.cuponXClientes;
const { Op } = require("sequelize");
const moment = require("moment");
const admin = require('../firebaseAdmin');

exports.registerToken = async (req, res) => {
    console.log("BOOOOOOOOOOOODDDDDDDDDDDDYYYYYYYYYYY: "+JSON.stringify(req.body))
    const { token,fidcliente } = req.body;

    // Validar que fidCliente y token están presentes
    if (!fidcliente || !token) {
        return res.status(400).json({ error: 'fidcliente y token son requeridos' });
    }
    console.log("AQUIE ESTA TOKEN: ")
    console.log(token)
    console.log("AQUIE ESTA el cleinte: ")
    console.log(fidcliente)

    // Validar que fidCliente es un número
    // Validar que fidCliente es un número
    if (isNaN(fidcliente) || fidcliente < 1) {
        console.log("fidcliente debe ser un numero mayor o igual a 1")
        return res.status(400).json({ error: 'fidcliente debe ser un numero mayor o igual a 1' });
    }

    try {
        const [userToken, created] = await db.notificationToken.findOrCreate({
            where: { token },
            defaults: { fidCliente: fidcliente, token, activo: true },
        });

        if (!created) {
            userToken.fidCliente = fidcliente;
            userToken.activo = true;
            await userToken.save();
        }

        await cuponesPorVencerPorToken(token);

        console.log("status: Token registered successfully")
        res.status(201).json({ message: 'Token registered successfully' });
    } catch (error) {
        console.error(error);
        console.log("status: Error registering token")
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

exports.updateTaskConfig = async (req, res) => {
    const { id } = req.body;
    const { minute = '*', hour = '*', dayOfMonth = '*', month = '*', dayOfWeek = '*' } = req.body;

    // Construir la expresión cron
    const cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;

    try {
        const config = await db.tareas.findByPk(id);
        if (!config) {
            return res.status(404).json({ message: 'Task configuration not found' });
        }

        config.cronExpression = cronExpression;
        await config.save();

        // Reprogramar la tarea
        if (parseInt(id) === 1) {
            scheduleTask(id, cronExpression, cuponesXVencer);
        } else if (parseInt(id) === 2) {
            scheduleTask(id, cronExpression, proximoEvento);
        }

        res.json({ message: 'Success' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating task configuration', error });
    }
};

exports.listNotifications = async (req, res) => {
    try {
        const { page = 1, pageSize = 6, searchName = '' } = req.query;

        const offset = (page - 1) * pageSize;
        const limit = parseInt(pageSize, 10);

        const whereCondition = searchName
            ? {
                taskName: {
                    [db.Sequelize.Op.like]: `%${searchName}%`
                }
            }
            : {};

        const { count, rows: tasks } = await db.tareas.findAndCountAll({
            attributes: ['id', 'taskName', 'cronExpression'],
            where: whereCondition,
            offset,
            limit
        });

        const formattedTasks = tasks.map(task => {
            const [minute, hour, dayOfMonth, month, dayOfWeek] = task.cronExpression.split(' ');

            return {
                id: task.id,
                name: task.taskName,
                cron: {
                    minute,
                    hour,
                    dayOfMonth,
                    month,
                    dayOfWeek
                }
            };
        });

        res.json({
            notificaciones: formattedTasks,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page, 10),
            totalItems: count
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks', error });
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

const cuponesPorVencerPorToken = async (token) => {
    const plazoDias = 5;
    try {
        // Obtener el usuario correspondiente al token
        const user = await db.notificationToken.findOne({ where: { token, activo: true } });
        
        if (!user) {
            console.log(`No se encontró un usuario activo con el token: ${token}`);
            return;
        }

        const idCliente = user.fidCliente;
        console.log("CLIENTE: " + idCliente + "*******************************************\n");

        const today = moment().startOf('day').toDate();
        const daysLater = moment().add(plazoDias, 'days').endOf('day').toDate();

        // Configurar las opciones para la consulta de cuponXClientes
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
            // Contar el número de cupones por vencer
            const cuponesCount = cuponesUsuarios.length;
            const title = "¡Que no se te pase!";
            const body = `Tienes ${cuponesCount} cupones que vencerán pronto`;

            // Enviar una única notificación al token proporcionado
            console.log("\n\n=================================================================");
            console.log("INTENTANDO ENVIAR A... " + token);
            await sendNotification(token, title, body);
            console.log("### " + title + "\n" + body + "\n" + token);
            console.log(`Notificación enviada exitosamente para el cliente ${idCliente}`);
        } else {
            console.log(`No hay cupones por vencer para el cliente ${idCliente}`);
        }
    } catch (error) {
        console.error("Error al obtener los cupones por vencer:", error);
    }
};