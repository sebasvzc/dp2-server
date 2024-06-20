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

// Función para llamar a la API de Collaborative Filtering
const callCollaborativeFilteringAPI = async (todos) => {
    try {
        const payload = { todos };
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
const callContentBasedFilteringAPI = async (todos) => {
    try {
        const payload = { cupones: todos }; // Ajusta esto según el formato esperado por la API
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
        const todos = await getAllInteracciones();
        const response = await callContentBasedFilteringAPI(todos);
        console.log('Content-Based Filtering Task executed successfully:', response);
    } catch (error) {
        console.error('Error executing Content-Based Filtering Task:', error);
    }
};

module.exports = {
    collaborativeFilteringTask,
    contentBasedFilteringTask
};