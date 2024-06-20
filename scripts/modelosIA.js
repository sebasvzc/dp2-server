const db = require("../models");
require('dotenv').config();
const Sequelize = require('sequelize');
const jwt = require("jsonwebtoken");
const Op = Sequelize.Op;
const moment = require("moment");
const axios = require('axios');

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL;
const getAllInteracciones = async () => {
    try {
        const tablaInteracciones = db.interaccionesCupon;

        const todos = await tablaInteracciones.findAll({
            attributes: ['fidCliente', 'fidCupon', 'numInteracciones', 'tipo', 'dia'],
            where: { activo: true },
            order: [
                ['numInteracciones', 'DESC'],
                ['dia', 'DESC']
            ],
        });

        return todos;
    } catch (error) {
        console.error('Error al obtener las interacciones:', error);
        throw error;
    }
};

const obtenerCuponesParaIA = async () => {
    var options = {
        attributes: ['id', 'codigo', 'sumilla', 'descripcionCompleta', 'fechaExpiracion', 'terminosCondiciones',
            'costoPuntos', 'esLimitado', 'cantidadDisponible'],
        required: true,
        include: [
            {
                model: db.locatarios,
                association: 'locatario',
                attributes: ['id', 'nombre', 'descripcion', 'locacion'],
                required: true,
                include: [
                    {
                        model: db.categoriaTiendas,
                        association: 'categoriaTienda',
                        required: true,
                        attributes: ['id', 'nombre'],
                    }
                ]
            }
        ],
        where: {
            activo: 1,
            fechaExpiracion: {
                [Op.gt]: new Date() // Validar que la fecha de expiración sea mayor a la fecha actual
            },
            cantidadDisponible: {
                [Op.gt]: 0 // Validar que la cantidad disponible sea mayor a 0
            }
        }
    }

    const cupones = await db.cupones.findAll(options);

    const formattedCupones = cupones.map(cupon => {
        return {
            idCupon: cupon.id,
            sumilla: cupon.sumilla,
            descripcionCompleta: cupon.descripcionCompleta,
            costoPuntos: cupon.costoPuntos,
            esLimitado: cupon.esLimitado,
            cantidadDisponible: cupon.cantidadDisponible,
            idLocatario: cupon.locatario.id,
            locatarioNombre: cupon.locatario.nombre,
            categoriaTiendaID: cupon.locatario.categoriaTienda.id,
            categoriaTiendaNombre: cupon.locatario.categoriaTienda.nombre
        };
    });

    return formattedCupones;
};

// Función para llamar a la API de Collaborative Filtering
const callCollaborativeFilteringAPI = async (todos) => {
    try {
        const payload = { todos };
        await vaciarRecomendaciones(1);
        const url = `http://${FASTAPI_BASE_URL}/ia/collaborative_filtering`;
        console.log("LLAMANDO A: "+url)
        const response = await axios.post(url, payload);
        console.log('Collaborative Filtering Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error calling collaborative_filtering API:');
        throw error;
    }
};

// Función para llamar a la API de Content-Based Filtering
const callContentBasedFilteringAPI = async (cupones) => {
    try {
        const payload = { cupones }; // Ajusta esto según el formato esperado por la API
        await vaciarRecomendaciones(2);
        const url = `http://${FASTAPI_BASE_URL}/ia/content_based_filtering`
        console.log("LLAMANDO A: "+ url)
        const response = await axios.post(url, payload);
        console.log('Content-Based Filtering Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error calling content_based_filtering API:');
        throw error;
    }
};

const collaborativeFilteringTask  = async () => {
    try {
        const todos = await getAllInteracciones();
        const response = await callCollaborativeFilteringAPI(todos);
        console.log('Collaborative Filtering Task executed successfully:', response);
    } catch (error) {
        console.error('Error executing Collaborative Filtering Task:', error);
    }
};

const contentBasedFilteringTask = async () => {
    try {
        const todos = await obtenerCuponesParaIA();
        const response = await callContentBasedFilteringAPI(todos);
        console.log('Content-Based Filtering Task executed successfully:', response);
    } catch (error) {
        console.error('Error executing Content-Based Filtering Task:', error);
    }
};

const vaciarRecomendaciones = async (tipoAlgoritmo) => {
    try {
        const query = `DELETE FROM recomendacionGenerals WHERE id >= 1 AND tipoAlgoritmo = ${tipoAlgoritmo}`;
        await db.sequelize.query(query);
        console.log('La consulta '+query+' ha sido ejecutada.');
    } catch (error) {
        console.error('Error al eliminar los registros:', error);
    }
};

module.exports = {
    collaborativeFilteringTask,
    contentBasedFilteringTask
};