const db = require("../models");
require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

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

module.exports = {
    detalleCupon
}