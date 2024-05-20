const db = require("../models");
require('dotenv').config();
const Sequelize = require('sequelize');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Op = Sequelize.Op;
const { AWS_ACCESS_KEY, AWS_ACCESS_SECRET, AWS_S3_BUCKET_NAME, AWS_SESSION_TOKEN } = process.env;

const Evento = db.eventos;
const Locatario = db.locatarios;
const CategoriaTienda=db.categoriaTiendas;
const EventoXCliente=db.eventoXClientes;

const getEventosConAsistentesYCategoria = async (req, res) => {
    const { fechaInicial, fechaFinal } = req.query;
    console.log(fechaInicial);
    console.log(fechaFinal);
    if (!fechaInicial || !fechaFinal) {
        return res.status(400).send("Parámetros 'fechaInicial' y 'fechaFinal' son requeridos.");
    }

    try {
        const eventos = await Evento.findAll({
            where: {
                fechaInicio: {
                    [db.Sequelize.Op.gte]: new Date(fechaInicial)
                },
                fechaFin: {
                    [db.Sequelize.Op.lte]: new Date(fechaFinal)
                }
            },
            include: [
                {
                    model: Locatario,
                    as: 'locatario',
                    include: [{
                        model: CategoriaTienda,
                        as: 'categoriaTienda',
                        attributes: []  // No necesitamos más atributos aquí porque lo agregaremos en el nivel superior
                    }],
                    attributes: []  // No necesitamos otros atributos del locatario para esta consulta
                },
                {
                    model: EventoXCliente,
                    as: 'eventoxcliente',
                    attributes: [],
                    where: { asistio: true },
                    required: false
                }
            ],
            attributes: [
                [db.Sequelize.fn('COUNT', db.Sequelize.col('eventoxcliente.id')), 'numeroAsistentes'],
                // Formatea la fecha al estilo "MMM YYYY" en español usando DATE_FORMAT
                [db.Sequelize.literal(`DATE_FORMAT(evento.fechaInicio, '%b %Y')`), 'mes'],
                [db.Sequelize.col('locatario->categoriaTienda.nombre'), 'categoria'],
                [db.Sequelize.col('eventoxcliente.codigoQR'), 'codigoQR']
            ],
            group: [
                db.Sequelize.literal(`DATE_FORMAT(evento.fechaInicio, '%b %Y')`),
                'locatario->categoriaTienda.id',
            ]
        });

        /* const resultadoFinal = eventos.map(evento => {
            const mesEnEspanol = {
                'Jan': 'Ene',
                'Apr': 'Abr',
                'Aug': 'Ago',
                'Dec': 'Dic'
            };
            let mes = evento.dataValues.mes.split(' ');
            mes[0] = mesEnEspanol[mes[0]] || mes[0];
            mes = mes.join(' ');

            return {
                numeroAsistentes: evento.dataValues.numeroAsistentes,
                mes: mes,
                categoria: evento.dataValues.categoria
            };
        }); */

        if (eventos && eventos.length > 0) {
            return res.status(200).json(eventos);
        } else {
            return res.status(404).send('No se encontraron eventos.');
        }
    } catch (error) {
        console.error('Error al obtener los eventos con categorías de tienda y asistentes:', error);
        res.status(500).send('Error interno del servidor');
    }
};

module.exports = {
    getEventosConAsistentesYCategoria
}