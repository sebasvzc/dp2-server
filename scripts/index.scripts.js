// controllers/configController.js
const db = require('../models');
const cron = require('node-cron');
const proximoEvento = require("./proximosEventos");
const cuponesXVencer = require("./cuponesPorVencer")

let scheduledTasks = {}; // Para almacenar las tareas programadas

const scheduleTasks = async () => {
    const configs = await db.tareas.findAll({ where: { activo: true } });

    configs.forEach(config => {
        if (config.id === 1) {
            scheduleTask(config.id, config.cronExpression, cuponesXVencer);
        } else if (config.id === 2) {
            scheduleTask(config.id, config.cronExpression, proximoEvento);
        }
    });
};

const scheduleTask = (id, cronExpression, taskFunction) => {
    if (scheduledTasks[id]) {
        scheduledTasks[id].stop();
    }

    scheduledTasks[id] = cron.schedule(cronExpression, taskFunction, {
        scheduled: true,
        timezone: "America/Lima"
    });
};

// Llama a la función para programar las tareas al inicio
scheduleTasks();

module.exports = {
    scheduledTasks,
    scheduleTask
};