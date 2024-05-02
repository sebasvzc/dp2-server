// Importing modules
const db = require("../models");
require('dotenv').config();

// Function to get active "categoriaTiendas"
const getCategoriaTiendas = async (req, res) => {
    try {
        const categoriaTiendas = await db.categoriaTiendas.findAll({
            attributes: ['id', 'nombre', 'descripcion'],
            where: { activo: 1 }
        });
        res.json(categoriaTiendas);  // Respond with the retrieved records
    } catch (error) {
        console.error('Error fetching categoriaTiendas:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    getCategoriaTiendas
};