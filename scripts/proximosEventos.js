// /scripts/proximoEvento.js
const db = require("../models");
const Eventos = db.eventos;
const { Op } = require("sequelize");
const moment = require("moment");

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

        console.log("Eventos de mañana:", eventos);
    } catch (error) {
        console.error("Error al obtener los eventos de mañana:", error);
    }
};

module.exports = proximoEvento;
