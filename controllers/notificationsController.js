// controllers/notificationController.js
const db = require("../models");
const { scheduledTasks, scheduleTask } = require('../scripts/index.scripts');
const proximoEvento = require("../scripts/proximosEventos");
const cuponesXVencer = require("../scripts/cuponesPorVencer")

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

        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error updating task configuration', error });
    }
};