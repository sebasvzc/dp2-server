// /scripts/index.scripts.js
const cron = require("node-cron");
const proximoEvento = require("./proximosEventos");
//const otraTarea = require("./otraTarea");

// Programar la tarea de proximoEvento para las 9 pm todos los días
cron.schedule('26 19 * * *', () => {
    console.log("Ejecutando tarea programada para eventos de mañana");
    proximoEvento();
}, {
    scheduled: true,
    timezone: "America/Lima"
});