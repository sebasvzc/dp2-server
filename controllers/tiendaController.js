//importing modules
const jwt = require("jsonwebtoken");
const db = require("../models");
require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const WebSocket = require("ws");
const crypto = require("crypto");
const {getSignUrlForFile} = require("../config/s3");

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
                const updatedTiendas = await Promise.all(tiendas.map(async (tienda) => {
                    const objectKey = `tienda${tienda.id}.jpg`;
                    const url = await getSignUrlForFile(objectKey);
                    // Agregar la URL firmada al objeto del cupón
                    return { ...tienda.dataValues, rutaFoto: url };
                }));
                return res.status(200).json({ tiendas:updatedTiendas, newToken: req.newToken,totalTiendas:totalCount });
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
                const updatedTiendas = await Promise.all(tiendas.map(async (tienda) => {
                    const objectKey = `tienda${tienda.id}.jpg`;
                    const url = await getSignUrlForFile(objectKey);
                    // Agregar la URL firmada al objeto del cupón
                    return { ...tienda.dataValues, rutaFoto: url };
                }));
                // console.log(users)
                // console.log(users)
                return res.status(200).json({ tiendas:updatedTiendas, newToken: req.newToken,totalTiendas:totalCount });
            } else {
                return res.status(200).send("Tienda no encontrado");
            }
        }
    } catch (error) {
        console.log('getTiendas - queryType:', queryType, ' - [Error]: ', error);
    }
}
const habilitar = async (req, res) => {
    console.log(req.body)
    try {
        console.log('updateTienda - updateItem: ', req.body);
        for (let i = 0; i < req.body.selected.length; i++) {
            const selectedItem = req.body.selected[i];
            console.log('Item seleccionado:', selectedItem);
            const tienda = await Tienda.findOne({
                where: {
                    id: selectedItem
                }
            });
            if (!tienda) {
                return res.status(409).send("El id de la tienda  "+selectedItem+" no se encontro en la bd");
            }
            await Tienda.update(
                {
                    activo: 1
                },
                {
                    where: { id: selectedItem }
                }
            );
        }
        return res.status(200).send({message:"Tiendas habilitadas correctamente", code:0});
    } catch (error) {
        console.log('updateTienda - updateItem:', updateItem, ' - [Error]: ', error)
    }
}
const deshabilitar = async (req, res) => {
    try {
        console.log('updateTienda - updateItem: ', req.body.selected);
        console.log(req.body.selected.length);
        for (let i = 0; i < req.body.selected.length; i++) {
            const selectedItem = req.body.selected[i];
            console.log('Item seleccionado:', selectedItem);
            const cupon = await Tienda.findOne({
                where: {
                    id: selectedItem
                }
            });
            if (!cupon) {
                return res.status(409).send("El id de la tienda "+selectedItem+" no se encontro en la bd");
            }
            await Tienda.update(
                {
                    activo: 0
                },
                {
                    where: { id: selectedItem }
                }
            );
        }
        return res.status(200).send({message:"Tiendas deshabilitadas correctamente", code:0});
    } catch (error) {
        console.log('updateTienda- updateItem:', updateItem, ' - [Error]: ', error)
    }
}
module.exports = {
    habilitar,
    deshabilitar,
    getTiendas
};