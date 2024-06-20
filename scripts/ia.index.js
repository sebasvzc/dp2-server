// controllers/scriptsIA.js
const cron = require('node-cron');
const modelosIA = require("./modelosIA")

// Programar tareas
cron.schedule('11 17 * * *', modelosIA.collaborativeFilteringTask, {
    scheduled: true,
    timezone: "America/Lima"
});

cron.schedule('35 18 * * *', modelosIA.contentBasedFilteringTask, {
    scheduled: true,
    timezone: "America/Lima"
});

console.log('Tasks for Collaborative Filtering and Content-Based Filtering have been scheduled.');
