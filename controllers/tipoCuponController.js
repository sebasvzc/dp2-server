const db = require("../models");
require('dotenv').config();
const Sequelize = require('sequelize');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Op = Sequelize.Op;

const User = db.users;
const TipoCupon = db.tipoCupons;
const Locatario = db.locatarios;

const getTipoCupones = async (req, res) => {
    var queryType = req.query.query;
    // console.log(req.query.query)
    const page = parseInt(req.query.page) || 1; // Página actual, default 1
    const pageSize = parseInt(req.query.pageSize) || 6; // Tamaño de página, default 10
    const offset = (page - 1) * pageSize;
    console.log('getTipoCupones - query: ', req.query.query);
    if (!queryType) {
        console.log("Requested item wasn't found!, ?query=xxxx is required!");
        return res.status(409).send("?query=xxxx is required! NB: xxxx is all / email");
    }
    try {
        if (queryType === 'all') {
            const tipoCuponesAndCount = await Promise.all([
                TipoCupon.findAll({
                    offset: offset,
                    limit: pageSize
                }),
                TipoCupon.count({})
            ]);
            const [tipoCupones, totalCount] = tipoCuponesAndCount;
            if (tipoCupones) {
                return res.status(200).json({ tipoCupones, newToken: req.newToken,totalTipoCupones:totalCount });
            } else {
                return res.status(400).send("Invalid request body");
            }
        } else {
            console.log("Estoy viendo algo que no es all")

            const tipoCuponesAndCount = await Promise.all([
                TipoCupon.findAll({
                    where: {
                        nombre: { [Op.like]: `%${queryType}%` }
                    },
                    offset: offset,
                    limit: pageSize
                }),
                TipoCupon.count({
                    where: {
                        nombre: { [Op.like]: `%${queryType}%` }
                    }
                })
            ]);
            const [tipoCupones, totalCount] = tipoCuponesAndCount;
            if (tipoCupones) {
                // console.log(users)
                // console.log(users)
                return res.status(200).json({ tipoCupones, newToken: req.newToken,totalTipoCupones:totalCount });
            } else {
                return res.status(200).send("Tipo de Cupones no encontrados con esa busqueda");
            }
        }
    } catch (error) {
        console.log('getTipoCupones - queryType:', queryType, ' - [Error]: ', error);
    }
}
module.exports = {

    getTipoCupones
}