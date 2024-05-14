//importing modules
const jwt = require("jsonwebtoken");
const db = require("../models");
require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const WebSocket = require("ws");
const crypto = require("crypto");

const { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY } = process.env;
const Tienda = db.locatarios;
const UserInv = db.usersInv;
const getTiendas = async (req, res) => {
    var queryType = req.query.query;
    // console.log(req.query.query)
    const page = parseInt(req.query.page) || 1; // Página actual, default 1
    const pageSize = parseInt(req.query.pageSize) || 6; // Tamaño de página, default 10
    const offset = (page - 1) * pageSize;
    console.log('getTienda - query: ', req.query.query);
    if (!queryType) {
        console.log("Requested item wasn't found!, ?query=xxxx is required!");
        return res.status(409).send("?query=xxxx is required! NB: xxxx is all / email");
    }
    try {
        if (queryType === 'all') {
            const tiendasAndCount = await Promise.all([
                Tienda.findAll({
                    where: {
                        activo: 1
                    },
                    offset: offset,
                    limit: pageSize
                }),
                Tienda.count({
                    where: {
                        activo: 1
                    }
                })
            ]);
            const [tiendas, totalCount] = tiendasAndCount;
            if (tiendas) {
                return res.status(200).json({ tiendas, newToken: req.newToken,totalTiendas:totalCount });
            } else {
                return res.status(400).send("Invalid request body");
            }
        } else {
            console.log("Estoy viendo algo que no es all")

            const tiendasAndCount = await Promise.all([
                Tienda.findAll({

                    where: {
                        activo: 1,
                        nombre: { [Op.like]: `%${queryType}%` }
                    },
                    offset: offset,
                    limit: pageSize
                }),
                Tienda.count({
                    where: {
                        activo: 1,
                        nombre: { [Op.like]: `%${queryType}%` }
                    }
                })
            ]);
            const [tiendas, totalCount] = tiendasAndCount;
            if (tiendas) {
                // console.log(users)
                // console.log(users)
                return res.status(200).json({ tiendas, newToken: req.newToken,totalTiendas:totalCount });
            } else {
                return res.status(200).send("Tienda no encontrado");
            }
        }
    } catch (error) {
        console.log('getTiendas - queryType:', queryType, ' - [Error]: ', error);
    }
}

module.exports = {

    getTiendas
};