const db = require("../models");
require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const User = db.users;
const Cupon = db.cupones;

const detalleCupon = async (req, res) => {
    try {
        let { idCupon } = req.body;

        const detalles = await db.cupones.findOne({
            where: { id: idCupon },
            attributes: ['codigo', 'sumilla', 'descripcionCompleta', 'fechaExpiracion', 'terminosCondiciones', 'costoPuntos', 'rutaFoto'],
            include: [{
                model: db.locatarios,
                as: 'locatario',
                attributes: ['nombre', 'descripcion', 'locacion', 'rutaFoto'],
                include: [{
                    model: db.categoriaTiendas,
                    as: 'categoriaTienda',
                    attributes: ['nombre']
                }]
            }]
        });

        if (detalles) {
            const formattedCupon = {
                cuponCodigo: detalles.codigo,
                cuponSumilla: detalles.sumilla,
                cuponDescripcionCompleta: detalles.descripcionCompleta,
                cuponFechaExpiracion: detalles.fechaExpiracion,
                cuponTerminosCondiciones: detalles.terminosCondiciones,
                cuponCostoPuntos: detalles.costoPuntos,
                cuponRutaFoto: detalles.rutaFoto ? "https://appdp2.s3.amazonaws.com/cupon" + idCupon + ".jpg" : null,
                locatarioNombre: detalles.locatario.nombre,
                locatarioDescripcion: detalles.locatario.descripcion,
                locatarioLocacion: detalles.locatario.locacion,
                locatarioRutaFoto: detalles.locatario.rutaFoto ? "https://appdp2.s3.amazonaws.com/tienda" + detalles.locatario.id + ".jpg" : null,
                categoriaTiendaNombre: detalles.locatario.categoriaTienda.nombre
            };

            res.status(200).json({ success: true, detalles: formattedCupon });
        } else {
            res.status(404).json({ success: false, message: 'Cupón no encontrado' });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: 'Hubo un error al procesar la solicitud' });
    }
}
const getCupones = async (req, res) => {
    var queryType = req.query.query;
    // console.log(req.query.query)
    const page = parseInt(req.query.page) || 1; // Página actual, default 1
    const pageSize = parseInt(req.query.pageSize) || 6; // Tamaño de página, default 10
    const offset = (page - 1) * pageSize;
    console.log('getUser - query: ', req.query.query);
    if (!queryType) {
        console.log("Requested item wasn't found!, ?query=xxxx is required!");
        return res.status(409).send("?query=xxxx is required! NB: xxxx is all / email");
    }
    try {
        if (queryType === 'all') {
            const cuponesAndCount = await Promise.all([
                Cupon.findAll({
                    offset: offset,
                    limit: pageSize
                }),
                Cupon.count({})
            ]);
            const [cupones, totalCount] = cuponesAndCount;
            if (cupones) {
                return res.status(200).json({ cupones, newToken: req.newToken,totalCupones:totalCount });
            } else {
                return res.status(400).send("Invalid request body");
            }
        } else {
            console.log("Estoy viendo algo que no es all")

            const cuponesAndCount = await Promise.all([
                Cupon.findAll({
                    where: {
                        [Op.or]: [
                            { sumilla: { [Op.like]: `%${queryType}%` } },
                            { descripcionCompleta: { [Op.like]: `%${queryType}%` } } // Asumiendo que el campo se llama 'name'
                        ]
                    },
                    offset: offset,
                    limit: pageSize
                }),
                Cupon.count({
                    where: {
                        [Op.or]: [
                            { sumilla: { [Op.like]: `%${queryType}%` } },
                            { descripcionCompleta: { [Op.like]: `%${queryType}%` } } // Asumiendo que el campo se llama 'name'
                        ]
                    }
                })
            ]);
            const [cupones, totalCount] = cuponesAndCount;
            if (cupones) {
                // console.log(users)
                // console.log(users)
                return res.status(200).json({ cupones, newToken: req.newToken,totalCupones:totalCount });
            } else {
                return res.status(200).send("Cupones no encontrados con esa busqueda");
            }
        }
    } catch (error) {
        console.log('getUser - queryType:', queryType, ' - [Error]: ', error);
    }
}
module.exports = {
    detalleCupon,
    getCupones
}