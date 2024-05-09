const db = require("../models");
require('dotenv').config();
const Sequelize = require('sequelize');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Op = Sequelize.Op;

const User = db.users;
const Cupon = db.cupones;
const Locatario = db.locatarios;
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

const getCuponesClientes = async (req, res) => {
    var queryType = req.query.query;
    // console.log(req.query.query)
    const page = parseInt(req.query.page) || 1; // Página actual, default 1
    const pageSize = parseInt(req.query.pageSize) || 10; // Tamaño de página, default 10
    const offset = (page - 1) * pageSize;
    const categoria = req.query.categoria ? req.query.categoria.split(',').map(item => {
        const number = Number(item.trim()); // Convertir el elemento a número eliminando espacios en blanco alrededor
        return !isNaN(number) ? number : null; // Verificar si la conversión fue exitosa
    }).filter(item => item !== null) : [];
    console.log(categoria);
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
            const whereCondition = {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { sumilla: { [Op.like]: `%${queryType}%` } },
                            { descripcionCompleta: { [Op.like]: `%${queryType}%` } }
                        ]
                    }
                ]
            };

            if (categoria.length > 0) {
                whereCondition[Op.and].push({
                    '$locatario.fidCategoriaTienda$': { [Op.or]: categoria }
                });
            }
            const cuponesAndCount = await Promise.all([
                Cupon.findAll({
                    where: whereCondition,
                    include: [{ model: Locatario, as: 'locatario', attributes: []  }],
                    offset: offset,
                    limit: pageSize
                }),
                Cupon.count({
                    where: whereCondition,
                    include: [{ model: Locatario, as: 'locatario', attributes: []  }],
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
const habilitar = async (req, res) => {
    console.log(req.body)
    try {
        console.log('updateCupon - updateItem: ', req.body);
        for (let i = 0; i < req.body.selected.length; i++) {
            const selectedItem = req.body.selected[i];
            console.log('Item seleccionado:', selectedItem);
            const cupon = await Cupon.findOne({
                where: {
                    id: selectedItem
                }
            });
            if (!cupon) {
                return res.status(409).send("El id del cupon  "+selectedItem+" no se encontro en la bd");
            }
            await Cupon.update(
                {
                    activo: 1
                },
                {
                    where: { id: selectedItem }
                }
            );
        }
        return res.status(200).send({message:"Cupones habilitados correctamente", code:0});
    } catch (error) {
        console.log('updateCupon - updateItem:', updateItem, ' - [Error]: ', error)
    }
}
const deshabilitar = async (req, res) => {
    try {
        console.log('updateCupon - updateItem: ', req.body.selected);
        console.log(req.body.selected.length);
        for (let i = 0; i < req.body.selected.length; i++) {
            const selectedItem = req.body.selected[i];
            console.log('Item seleccionado:', selectedItem);
            const cupon = await Cupon.findOne({
                where: {
                    id: selectedItem
                }
            });
            if (!cupon) {
                return res.status(409).send("El id del cupon "+selectedItem+" no se encontro en la bd");
            }
            await Cupon.update(
                {
                    activo: 0
                },
                {
                    where: { id: selectedItem }
                }
            );
        }
        return res.status(200).send({message:"Cupones deshabilitados correctamente", code:0});
    } catch (error) {
        console.log('updateCupon- updateItem:', updateItem, ' - [Error]: ', error)
    }
}
const crear = async (req, res) => {
    try {
        console.log("entre a registrar nuevo cupon")
        const { codigo,fidLocatario, fidTipoCupon,sumilla, descripcionCompleta, fechaExpiracion,terminosCondiciones,esLimitado,costoPuntos,cantidadInicial,cantidadDisponible,ordenPriorizacion,rutaFoto } = req.body;
        const data = {
            codigo,
            fidLocatario,
            fidTipoCupon,
            sumilla,
            descripcionCompleta,
            fechaExpiracion,
            terminosCondiciones,
            esLimitado,
            costoPuntos,
            cantidadInicial,
            cantidadDisponible,
            ordenPriorizacion,
            rutaFoto,
            activo:1
        };
        const checkCupon = await Cupon.findOne({
            where: {
                codigo: codigo
            }
        });
        if (checkCupon) {
            console.log("Requested "+codigo+" esta duplicado, por favor no colocar un codigo de cupon ya existente")
            return res.status(409).send("Requested "+codigo+" esta duplicado, por favor no colocar un codigo de cupon ya existente");
        }
        //saving the user
        const cupon = await Cupon.create(data);
        //if user details is captured
        //generate token with the user's id and the secretKey in the env file
        // set cookie with the token generated
        if (cupon) {

            //send users details
            //broadcast(req.app.locals.clients, 'signup', user);
            return res.status(200).send("Cupon "+ cupon.id+ " creado correctamente");
        }
        else {
            return res.status(400).send("Invalid request body");
        }


    } catch (error) {
        console.log('signup - [Error]: ', error);
    }
}

const modificar = async (req, res) => {
    var updateItem = req.body.editedCupon;
    console.log('updateUser - updateItem: ', updateItem);
    const {id, codigo,fidLocatario, fidTipoCupon,sumilla, descripcionCompleta, fechaExpiracion,terminosCondiciones,esLimitado,costoPuntos,cantidadInicial,cantidadDisponible,ordenPriorizacion,rutaFoto } = req.body.editedCupon;
    try {
        const cupon = await Cupon.findOne({
            where: {
                id: id
            }
        });
        if (!cupon) {
            console.log("Cupon "+updateItem+" no fue encontrado")
            return res.status(409).send("Cupon "+updateItem+" no fue encontrado");
        }
        const checkCupon = await Cupon.findOne({
            where: {
                codigo: codigo
            }
        });
        if (checkCupon && id!== checkCupon.id) {
            console.log("Requested "+codigo+" esta duplicado, por favor no colocar un codigo de cupon ya existente")
            return res.status(409).send("Requested "+codigo+" esta duplicado, por favor no colocar un codigo de cupon ya existente");
        }
        await Cupon.update(
            {
                codigo,
                fidLocatario,
                fidTipoCupon,
                sumilla,
                descripcionCompleta,
                fechaExpiracion,
                terminosCondiciones,
                esLimitado,
                costoPuntos,
                cantidadInicial,
                cantidadDisponible,
                ordenPriorizacion,
                rutaFoto
            },
            {
                where: { id: id }
            }
        );
        return res.status(200).send({message:"Cupon modificado correctametne"});
    } catch (error) {
        console.log('updateUser - updateItem:', updateItem, ' - [Error]: ', error)
    }
}
module.exports = {
    detalleCupon,
    getCupones,
    deshabilitar,
    habilitar,
    crear,
    modificar,
    getCuponesClientes
}