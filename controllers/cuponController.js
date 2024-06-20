const db = require("../models");
require('dotenv').config();
const Sequelize = require('sequelize');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Op = Sequelize.Op;
const { AWS_ACCESS_KEY, AWS_ACCESS_SECRET, AWS_S3_BUCKET_NAME, AWS_SESSION_TOKEN } = process.env;
const mysql = require('mysql2/promise');
const moment = require("moment");

const pool = mysql.createPool({
    host: 'dp2-database.cvezha58bpsj.us-east-1.rds.amazonaws.com',
    port: 3306,
    user: 'administrador',
    password: 'contrasenia',
    database: 'plaza',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 600000

});
const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignUrlForFile } = require("../config/s3");

var s3Config;
s3Config = {
    region: "us-east-1",
    credentials: {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_ACCESS_SECRET,
        sessionToken: AWS_SESSION_TOKEN
    },
};
const s3Client = new S3Client(s3Config);

// USADO PARA LEER LO QUE SE ENCUENTRA DENTRO DEL S3
const AWS = require('aws-sdk');
const { exit } = require("process");
AWS.config.update({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_ACCESS_SECRET,
    sessionToken: AWS_SESSION_TOKEN,
    region: 'us-east-1' // La región donde está tu bucket
});

const s3 = new AWS.S3();



const User = db.users;
const Cupon = db.cupones;
const Cliente = db.clients;
const CuponXCliente = db.cuponXClientes;
const Locatario = db.locatarios;
const TipoCupon = db.tipoCupons;
const detalleCuponCompleto = async (req, res) => {

    try {
        let where = {};
        console.log("RequUSer es ", req.user)
        if (req.user.fidLocatario !== null) {
            where.fidLocatario = req.user.fidLocatario;
        }
        where[Op.and] = [
            { id: req.body.id }
        ];
        console.log("detalleCuponCompleto")
        console.log("detalleCuponCompleto")
        const detalleCupon = await Cupon.findOne({
            where,
            include: [
                {
                    model: db.locatarios,
                    as: 'locatario',
                    attributes: ['id', 'nombre'],
                },
                {
                    model: db.tipoCupons,
                    as: 'tipoCupon',
                    attributes: ['id', 'nombre'],
                }
            ]
        });

        if (detalleCupon) {
            const objectKey = `cupon${detalleCupon.id}.jpg`;
            const url = await getSignUrlForFile(objectKey, "defaultCupon.png");
            console.log(detalleCupon.id)
            console.log(url)
            console.log(`Attempting to retrieve object with key: ${objectKey} from bucket:`, AWS_S3_BUCKET_NAME);
            res.status(200).json({ success: true, detalles: detalleCupon, image: url });
        } else {
            res.status(404).json({ success: false, message: 'Cupón no encontrado' });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: 'Hubo un error al procesar la solicitud' });
    }
}

// arreglar
const detalleCupon = async (req, res) => {
    try {
        let { idCupon, idCliente = 1 } = req.body;
        await nuevaInteraccion(idCupon, idCliente, "detalle");

        const detalles = await db.cupones.findOne({
            where: { id: idCupon },
            attributes: ['codigo', 'sumilla', 'descripcionCompleta', 'fechaExpiracion', 'terminosCondiciones', 'costoPuntos', 'rutaFoto'],
            include: [{
                model: db.locatarios,
                as: 'locatario',
                attributes: ['nombre', 'descripcion', 'locacion', 'rutaFoto', 'id'],
                include: [{
                    model: db.categoriaTiendas,
                    as: 'categoriaTienda',
                    attributes: ['nombre']
                }]
            }]
        });

        /* const locatarioId = detalles.locatario.id;
         const keyLocatario = `tienda${locatarioId}.jpg`;
 
         const url = await getSignUrlForFile('getObject', {
             Bucket: 'appdp2',
             Key: keyLocatario,
             Expires: 8600 // Tiempo de expiración en segundos
         });
 
         const cuponId = detalles.id;
         const keyCupon = `cupon${cuponId}.jpg`;
         const url2 = await getSignUrlForFile('getObject', {
             Bucket: 'appdp2',
             Key: keyCupon,
             Expires: 8600 // Tiempo de expiración en segundos
         });*/

        if (detalles) {

            const keyCupon = `cupon${idCupon}.jpg`;

            // Genera la URL firmada para el objeto en el bucket appdp2
            const urlCupon = s3.getSignedUrl('getObject', {
                Bucket: 'appdp2',
                Key: keyCupon,
                Expires: 8600 // Tiempo de expiración en segundos
            });

            const keyLocatario = `tienda${detalles.locatario.id}.jpg`;

            // Genera la URL firmada para el objeto en el bucket appdp2
            const urlTienda = s3.getSignedUrl('getObject', {
                Bucket: 'appdp2',
                Key: keyLocatario,
                Expires: 8600 // Tiempo de expiración en segundos
            });


            const formattedCupon = {
                cuponCodigo: detalles.codigo,
                cuponSumilla: detalles.sumilla,
                cuponDescripcionCompleta: detalles.descripcionCompleta,
                cuponFechaExpiracion: detalles.fechaExpiracion,
                cuponTerminosCondiciones: detalles.terminosCondiciones,
                cuponCostoPuntos: detalles.costoPuntos,
                cuponRutaFoto: urlCupon,
                locatarioNombre: detalles.locatario.nombre,
                locatarioDescripcion: detalles.locatario.descripcion,
                locatarioLocacion: detalles.locatario.locacion,
                locatarioRutaFoto: urlTienda,
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
    console.log("Entre a getCupones")
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
    let where = {};
    console.log("RequUSer es ", req.user)
    if (req.user.fidLocatario !== null) {
        where.fidLocatario = req.user.fidLocatario;
    }
    try {
        if (queryType === 'all') {
            const cuponesAndCount = await Promise.all([
                Cupon.findAll({
                    where,
                    offset: offset,
                    limit: pageSize
                }),
                Cupon.count({ where })
            ]);
            const [cupones, totalCount] = cuponesAndCount;
            if (cupones) {
                const updatedCupones = await Promise.all(cupones.map(async (cupon) => {
                    const objectKey = `cupon${cupon.id}.jpg`;
                    const url = await getSignUrlForFile(objectKey, "defaultCupon.png");
                    // Agregar la URL firmada al objeto del cupón
                    return { ...cupon.dataValues, rutaFoto: url };
                }));
                return res.status(200).json({ cupones: updatedCupones, newToken: req.newToken, totalCupones: totalCount });
            } else {
                return res.status(400).send("Invalid request body");
            }
        } else {
            console.log("Estoy viendo algo que no es all")
            where[Op.or] = [
                { sumilla: { [Op.like]: `%${queryType}%` } },
                { descripcionCompleta: { [Op.like]: `%${queryType}%` } }
            ];
            const cuponesAndCount = await Promise.all([
                Cupon.findAll({
                    where,
                    offset: offset,
                    limit: pageSize
                }),
                Cupon.count({
                    where
                })
            ]);
            const [cupones, totalCount] = cuponesAndCount;
            if (cupones) {
                // console.log(users)
                // console.log(users)
                const updatedCupones = await Promise.all(cupones.map(async (cupon) => {
                    const objectKey = `cupon${cupon.id}.jpg`;
                    const url = await getSignUrlForFile(objectKey, "defaultCupon.png");
                    // Agregar la URL firmada al objeto del cupón
                    return { ...cupon.dataValues, rutaFoto: url };
                }));
                return res.status(200).json({ cupones: updatedCupones, newToken: req.newToken, totalCupones: totalCount });
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
    console.log('getCuponesClientes- query: ', req.query.query);
    if (!queryType) {
        console.log("Requested item wasn't found!, ?query=xxxx is required!");
        return res.status(409).send("?query=xxxx is required! NB: xxxx is all / email");
    }
    try {
        if (queryType === 'all') {
            const cuponesAndCount = await Promise.all([
                Cupon.findAll({
                    offset: offset,
                    limit: pageSize,
                    include: [{ model: Locatario, as: 'locatario', attributes: [] }],
                    where: {
                        activo: 1,
                        '$locatario.fidCategoriaTienda$': { [Op.or]: categoria }

                    },
                    attributes: ["id", "cantidadDisponible", "costoPuntos", "esLimitado", "sumilla", "fidLocatario"]
                }),
                Cupon.count({
                    include: [{ model: Locatario, as: 'locatario', attributes: [] }],

                    where: {
                        '$locatario.fidCategoriaTienda$': { [Op.or]: categoria },
                        activo: 1
                    }
                })
            ]);
            const [cupones, totalCount] = cuponesAndCount;
            if (cupones) {
                // Iterar sobre los cupones y realizar una acción asíncrona con cada uno
                const updatedCupones = await Promise.all(cupones.map(async (cupon) => {
                    const objectKey = `cupon${cupon.id}.jpg`;
                    const url = await getSignUrlForFile(objectKey, "defaultCupon.png");
                    console.log("cupon.fidLocatario")
                    console.log(cupon.fidLocatario)
                    const objectKey2 = `tienda${cupon.fidLocatario}.jpg`;
                    const urlTienda = await getSignUrlForFile(objectKey2, "defaultStore.png");


                    // Agregar la URL firmada al objeto del cupón
                    return { ...cupon.dataValues, rutaFoto: url, rutaTienda: urlTienda };
                }));
                return res.status(200).json({ cupones: updatedCupones, newToken: req.newToken, totalCupones: totalCount });
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
                    },
                    {
                        activo: 1
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
                    include: [{ model: Locatario, as: 'locatario', attributes: [] }],
                    offset: offset,
                    limit: pageSize,
                    attributes: ["id", "cantidadDisponible", "costoPuntos", "esLimitado", "sumilla", "fidLocatario"]
                }),
                Cupon.count({
                    where: whereCondition,
                    include: [{ model: Locatario, as: 'locatario', attributes: [] }],
                })
            ]);
            const [cupones, totalCount] = cuponesAndCount;
            if (cupones) {

                const updatedCupones = await Promise.all(cupones.map(async (cupon) => {
                    const objectKey = `cupon${cupon.id}.jpg`;
                    const url = await getSignUrlForFile(objectKey, "defaultCupon.png");
                    console.log("cupon.fidLocatario")
                    console.log(cupon.fidLocatario)
                    const objectKey2 = `tienda${cupon.fidLocatario}.jpg`;
                    const urlTienda = await getSignUrlForFile(objectKey2, "defaultStore.png");


                    // Agregar la URL firmada al objeto del cupón
                    return { ...cupon.dataValues, rutaFoto: url, rutaTienda: urlTienda };
                }));
                // console.log(users)
                // console.log(users)
                return res.status(200).json({ cupones: updatedCupones, newToken: req.newToken, totalCupones: totalCount });
            } else {
                return res.status(200).send("Cupones no encontrados con esa busqueda");
            }
        }
    } catch (error) {
        console.log('getUser - queryType:', queryType, ' - [Error]: ', error);
    }
}
const getClientesXCupon = async (req, res) => {
    var queryType = req.query.query;
    var idParam = parseInt(req.query.idParam);
    // console.log(req.query.query)
    const page = parseInt(req.query.page) || 1; // Página actual, default 1
    const pageSize = parseInt(req.query.pageSize) || 10; // Tamaño de página, default 10
    const offset = (page - 1) * pageSize;

    console.log('getClientesXCupon - query: ', req.query.query);
    if (!queryType) {
        console.log("Requested item wasn't found!, ?query=xxxx is required!");
        return res.status(409).send("?query=xxxx is required! NB: xxxx is all / email");
    }
    try {
        if (queryType === 'all') {
            const cuponesAndCount = await Promise.all([
                CuponXCliente.findAll({
                    offset: offset,
                    limit: pageSize,
                    where: {
                        fidCupon: idParam
                    },
                    include: [
                        {
                            model: Cliente,
                            as: 'cliente',
                            attributes: ["nombre", "apellidoPaterno", "email", "telefono"]  // No necesitamos otros atributos del locatario para esta consulta
                        }
                    ]
                }),
                CuponXCliente.count({
                    where: {
                        fidCupon: idParam
                    }

                })
            ]);
            const [clientesXCupon, totalCount] = cuponesAndCount;
            return res.status(200).json({ clientesxCupon: clientesXCupon, newToken: req.newToken, totalClientes: totalCount });
        } else {
            console.log("Estoy viendo algo que no es all")
            const whereCondition = {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { nombre: { [Op.like]: `%${queryType}%` } },
                            { correo: { [Op.like]: `%${queryType}%` } }
                        ]
                    },
                    {
                        id: idParam
                    }
                ]
            };
            const cuponesAndCount = await Promise.all([
                Cupon.findAll({
                    where: whereCondition,
                    include: [{ model: Locatario, as: 'locatario', attributes: [] }],
                    offset: offset,
                    limit: pageSize
                }),
                Cupon.count({
                    where: whereCondition,
                    include: [{ model: Locatario, as: 'locatario', attributes: [] }],
                })
            ]);
            const [cupones, totalCount] = cuponesAndCount;
            if (cupones) {
                // console.log(users)
                // console.log(users)
                return res.status(200).json({ cupones, newToken: req.newToken, totalCupones: totalCount });
            } else {
                return res.status(200).send("Clientes no encontrados con esa busqueda para el cupon");
            }
        }
    } catch (error) {
        console.log('getClientesXCupon - queryType:', queryType, ' - [Error]: ', error);
    }
}
const getCuponesXDiaCanjeado = async (req, res) => {

    var idParam = parseInt(req.query.idParam);

    console.log('getCuponXDia - query: ', req.query.idParam);
    if (!idParam) {
        console.log("Requested item wasn't found!, ?query=xxxx is required!");
        return res.status(409).send("?query=xxxx is required! NB: xxxx is all / email");
    }
    try {
        const cuponesGroupedByDate = await CuponXCliente.findAll({
            where: {
                fidCupon: idParam
            },
            attributes: [

                [db.sequelize.literal(`DATE_FORMAT(fechaCompra, '%b %Y')`), 'fecha'],
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'cantidad'] // Contar el número de cupones por fecha
            ],
            group: [db.sequelize.literal(`DATE_FORMAT(fechaCompra, '%b %Y')`)],// Agrupar por la fecha
            order: [
                [db.sequelize.fn('DATE', db.sequelize.col('fechaCompra')), 'ASC']
            ]
        });

        // Formatear los resultados en el formato deseado
        const usoDeCupones = cuponesGroupedByDate.map(cupon => ({
            fecha: cupon.get('fecha'),
            cantidad: cupon.get('cantidad')
        }));

        return res.status(200).json({ usoDeCupones, newToken: req.newToken });

    } catch (error) {
        console.log('getCuponXDia - queryType: - [Error]: ', error);
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
                return res.status(409).send("El id del cupon  " + selectedItem + " no se encontro en la bd");
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
        return res.status(200).send({ message: "Cupones habilitados correctamente", code: 0 });
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
                return res.status(409).send("El id del cupon " + selectedItem + " no se encontro en la bd");
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
        return res.status(200).send({ message: "Cupones deshabilitados correctamente", code: 0 });
    } catch (error) {
        console.log('updateCupon- updateItem:', updateItem, ' - [Error]: ', error)
    }
}
const crear = async (req, res) => {
    try {
        console.log("entre a registrar nuevo cupon");


        const { codigo, fidLocatario, fidTipoCupon, sumilla, descripcionCompleta, fechaExpiracion, terminosCondiciones, esLimitado, costoPuntos, cantidadInicial, ordenPriorizacion } = req.body;

        const checkCupon = await Cupon.findOne({
            where: {
                codigo: codigo
            }
        });
        if (checkCupon) {
            console.log("Requested " + codigo + " esta duplicado, por favor no colocar un codigo de cupon ya existente")
            return res.status(409).send("Requested " + codigo + " esta duplicado, por favor no colocar un codigo de cupon ya existente");
        }
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
            cantidadDisponible: cantidadInicial,
            ordenPriorizacion,
            rutaFoto: codigo,
            activo: 1
        };
        //saving the user
        const cupon = await Cupon.create(data);
        //if user details is captured
        //generate token with the user's id and the secretKey in the env file
        // set cookie with the token generated
        if (cupon) {
            const file = req.files[0];
            const bucketParams = {
                Bucket: AWS_S3_BUCKET_NAME,
                Key: `cupon${cupon.id}.jpg`,
                Body: file.buffer,
                ContentType: file.mimetype
            };
            try {
                // Intenta subir el archivo a S3
                const data = await s3Client.send(new PutObjectCommand(bucketParams));
                console.log("Archivo subido con éxito al s3:", data);
            } catch (error) {
                // Captura cualquier error durante la subida del archivo a S3
                console.error("Error al subir el archivo a S3:", error);
                // Aun así, informa que el cupón fue creado pero el archivo no se subió correctamente
                return res.status(200).send({
                    message: "Se encontró un error durante la subida del archivo, pero sí se creó el cupón. Edítalo posteriormente."
                });
            }

            //send users details
            //broadcast(req.app.locals.clients, 'signup', user);
            return res.status(200).send({ message: "Cupon " + cupon.id + " creado correctamente" });
        }
        else {
            return res.status(400).send("Invalid request body");
        }


    } catch (error) {
        console.log('crearCupon - [Error]: ', error);
    }
}
const modificar = async (req, res) => {

    console.log("viendo modificar cupon")
    const { id, codigo, fidLocatario, fidTipoCupon, sumilla, descripcionCompleta, fechaExpiracion, terminosCondiciones, esLimitado, costoPuntos, cantidadInicial, cantidadDisponible, ordenPriorizacion, rutaFoto } = req.body;
    try {
        const cupon = await Cupon.findOne({
            where: {
                id: id
            }
        });
        if (!cupon) {
            console.log("Cupon " + updateItem + " no fue encontrado")
            return res.status(409).send("Cupon " + updateItem + " no fue encontrado");
        }
        const checkCupon = await Cupon.findOne({
            where: {
                codigo: codigo
            }
        });
        if (checkCupon && parseInt(id, 10) !== checkCupon.id) {

            console.log("Requested " + codigo + " esta duplicado, por favor no colocar un codigo de cupon ya existente")
            return res.status(409).send("Requested " + codigo + " esta duplicado, por favor no colocar un codigo de cupon ya existente");
        }
        const file = req.files[0];
        if (file) {
            const existingFileKey = `cupon${checkCupon.id}.jpg`; // Asumiendo que el archivo existente tiene el mismo código y extensión .jpg
            const newFileKey = `cupon${id}.jpg`;

            try {
                // Eliminar el archivo existente en S3
                const deleteParams = {
                    Bucket: AWS_S3_BUCKET_NAME,
                    Key: existingFileKey
                };
                await s3Client.send(new DeleteObjectCommand(deleteParams));
                console.log("Archivo eliminado con éxito de S3:", existingFileKey);

                // Subir el nuevo archivo a S3
                const bucketParams = {
                    Bucket: AWS_S3_BUCKET_NAME,
                    Key: newFileKey,
                    Body: file.buffer,
                    ContentType: file.mimetype
                };
                const data = await s3Client.send(new PutObjectCommand(bucketParams));
                console.log("Archivo subido con éxito al S3:", data);
            } catch (error) {
                // Captura cualquier error durante la subida del archivo a S3
                console.error("Error al subir el archivo a S3:", error);
                // Aun así, informa que el cupón fue creado pero el archivo no se subió correctamente
                return res.status(200).send({
                    message: "Se encontró un error durante la subida del archivo, pero sí se creó el cupón. Edítalo posteriormente."
                });
            }
        } else {
            console.log("no has enviado ningun archivo")
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
        return res.status(200).send({ message: "Cupon modificado correctametne" });
    } catch (error) {
        console.log('updateUser - updateItem:', updateItem, ' - [Error]: ', error)
    }
}
const cuponesFiltradosGeneral = async (req, res) => {
    console.log("Req ", req.query, req.body)
    const { busqueda, page = 0, size = 5 } = req.query;
    let { categorias, orderBy, orden } = req.body;

    var options = {
        limit: +size,
        offset: (+page) * (+size),
        attributes: ['id', 'codigo', 'sumilla', 'descripcionCompleta', 'fechaExpiracion', 'terminosCondiciones',
            'costoPuntos', 'rutaFoto', 'esLimitado', 'cantidadDisponible'],
        required: true,
        include: [
            {
                model: db.locatarios,
                association: 'locatario',
                attributes: ['id', 'nombre', 'descripcion', 'locacion', 'rutaFoto'],
                required: true,
                include: [
                    {
                        model: db.categoriaTiendas,
                        association: 'categoriaTienda',
                        required: true,
                        attributes: ['nombre'], // Opcional: si no necesitas atributos específicos de la categoría
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
                [Op.gt]: 0 // Validar que la fecha de expiración sea mayor a la fecha actual
            }
        }
    }

    if (busqueda != "") {
        options.where[Op.or] = [
            {
                sumilla: {
                    [Op.like]: `%${busqueda}%` // Buscar sumilla que contenga el texto especificado
                }
            },
            {
                '$locatario.nombre$': {
                    [Op.like]: `%${busqueda}%` // Buscar nombre de locatario que contenga el texto especificado
                }
            }
        ];
    }

    if (!categorias || categorias.length === 0) {
        options.include[0].include[0].where = {}; // Vaciar el objeto where
    } else {
        options.include[0].include[0].where = { id: categorias };
    }

    if (orden !== "ASC" && orden != "DESC") {
        orden = "ASC";
    }

    const orderCriteria = [];
    if (orderBy === 'fechaExpiracion') {
        orderCriteria.push([['fechaExpiracion', orden]]);
    } else if (orderBy === 'categoria') {
        orderCriteria.push([[db.Sequelize.literal("`locatario.categoriaTienda.nombre`"), orden]]);
    } else if (orderBy === 'puntos') {
        orderCriteria.push([['costoPuntos', orden]]);
    }

    orderCriteria.push([['id', 'ASC']]);
    options.order = orderCriteria;

    const { count, rows: cupones } = await db.cupones.findAndCountAll(options);

    const formattedCupones = cupones.map(cupon => {
        const key = `tienda${cupon.locatario.id}.jpg`;

        const url = s3.getSignedUrl('getObject', {
            Bucket: 'appdp2',
            Key: key,
            Expires: 8600 // Tiempo de expiración en segundos
        });

        const key2 = `cupon${cupon.id}.jpg`;
        const url2 = s3.getSignedUrl('getObject', {
            Bucket: 'appdp2',
            Key: key2,
            Expires: 8600
        });

        return {
            id: cupon.id,
            //codigo: cupon.codigo,
            sumilla: cupon.sumilla,
            //descripcionCompleta: cupon.descripcionCompleta,
            //fechaExpiracion: cupon.fechaExpiracion,
            //terminosCondiciones: cupon.terminosCondiciones,
            costoPuntos: cupon.costoPuntos,
            esLimitado: cupon.esLimitado,
            cantidadDisponible: cupon.cantidadDisponible,
            rutaFoto: url2,

            locatarioNombre: cupon.locatario.nombre,
            //locatarioDescripcion: cupon.locatario.descripcion,
            //locatarioLocacion: cupon.locatario.locacion,
            locatarioRutaFoto: url,

            //categoriaTiendaNombre: cupon.locatario.categoriaTienda.nombre
        };
    });

    console.log('data conseguida');
    res.json({ total: count, cupones: formattedCupones })
};

const cuponesFavoritos = async (req, res) => {
    try {
        const { idCliente } = req.body;
        const tablaCupon = db.cupones;
        //const tablaCategoria = db.categoriaTiendas;
        //const tablaLocatario = db.locatarios;
        const tablaInteracciones = db.interaccionesCupon;

        // Obtener el top 3 de cupones con más interacciones para el cliente específico
        const topCupones = await tablaInteracciones.findAll({
            attributes: ['fidCupon', 'numInteracciones', 'updatedAt'],
            where: { activo: true, fidCliente: idCliente },
            order: [
                ['numInteracciones', 'DESC'],
                ['updatedAt', 'DESC']
            ],
            limit: 3
        });

        //console.log(topCupones)

        const cuponIds = topCupones.map(interaccion => interaccion.fidCupon);

        if (cuponIds.length === 0) {
            return res.status(200).json({ cantidad: 0, cupones: [] });
        }
        //console.log(cuponIds)

        // Obtener detalles de los cupones en el top 3
        const cupones = await tablaCupon.findAll({
            where: { id: cuponIds },
            attributes: ['id', 'sumilla', 'costoPuntos'],
            include: [
                {
                    model: db.locatarios,
                    as: 'locatario',
                    attributes: ['nombre', 'id'],
                    required: true, // Esto convierte el LEFT JOIN en INNER JOIN
                    include: [{
                        model: db.categoriaTiendas,
                        as: 'categoriaTienda',
                        attributes: ['id', 'nombre']
                    }]
                }
            ]
        });

        // Crear un objeto para mapear el número de interacciones por cupón
        const interaccionesMap = topCupones.reduce((acc, interaccion) => {
            acc[interaccion.fidCupon] = interaccion.numInteracciones;
            return acc;
        }, {});

        // Formatear los resultados
        const cuponesFormatted = cupones.map(cupon => ({
            idCupon: cupon.id,
            sumilla: cupon.sumilla,
            costo: cupon.costoPuntos,
            locatarioId: cupon.locatario ? cupon.locatario.id : null,
            locatarioNombre: cupon.locatario ? cupon.locatario.nombre : null,
            categoriaId: cupon.locatario.categoriaTienda ? cupon.locatario.categoriaTienda.id : null,
            categoriaNombre: cupon.locatario.categoriaTienda ? cupon.locatario.categoriaTienda.nombre : null,
            numInteracciones: interaccionesMap[cupon.id] || 0
        }));
        cuponesFormatted.sort((a, b) => b.numInteracciones - a.numInteracciones);
        // Devolver la respuesta
        res.status(200).json({
            cantidad: cuponesFormatted.length,
            cupones: cuponesFormatted
        });

    } catch (error) {
        console.error('Error al obtener los cupones favoritos:', error);
        res.status(500).json({ message: 'Error al obtener los cupones favoritos' });
    }
};

const allInteracciones = async (req, res) => {
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
        res.status(200).json({
            todos
        })
    } catch (error) {
        console.error('Error al obtener los cupones favoritos:', error);
        res.status(500).json({ message: 'Error al obtener los cupones favoritos' });
    }


}

const nuevasRecomendaciones = async (req, res) => {
    try {
        const { cuponFavorito, cuponRecomendado, prioridad, tipoAlgoritmo = 1 } = req.body;

        // Validar que los campos requeridos están presentes
        if (!cuponFavorito || !cuponRecomendado || !prioridad) {
            return res.status(400).json({ message: 'Todos los campos son requeridos: cuponFavorito, cuponRecomendado, prioridad' });
        }

        // Crear un nuevo registro en la tabla recomendacionGenerals
        await db.recomendacionGeneral.create({
            cuponFavorito,
            cuponRecomendado,
            prioridad,
            activo: true,
            tipoAlgoritmo: tipoAlgoritmo
        });

        // Devolver la nueva recomendación creada
        res.status(201).json({ message: 'Registro exitoso' });
    } catch (error) {
        console.error('Error al crear el registro:', error);
        res.status(500).json({ message: 'Error al crear el registro' });
    }
};

const calcularCuponFavorito = (interacciones) => {
    // 1. Calcular las interacciones ponderadas
    const hoy = moment();
    const interaccionesPonderadas = interacciones.map(interaccion => {
        const diasTranscurridos = hoy.diff(moment(interaccion.dia), 'days');
        const numInteraccionF = interaccion.numInteracciones * (180 - (diasTranscurridos / 180));
        return {
            fidCupon: interaccion.fidCupon,
            tipo: interaccion.tipo,
            numInteraccionF
        };
    });

    // 2. Calcular la sumatoria de las interacciones ponderadas por tipo de interacción
    const sumatorias = interaccionesPonderadas.reduce((acc, interaccion) => {
        const { fidCupon, tipo, numInteraccionF } = interaccion;
        if (!acc[fidCupon]) {
            acc[fidCupon] = { ver: 0, canjear: 0, utilizar: 0 };
        }
        if (tipo === 'detalle') {
            acc[fidCupon].ver += numInteraccionF;
        } else if (tipo === 'canje') {
            acc[fidCupon].canjear += numInteraccionF;
        } else if (tipo === 'uso') {
            acc[fidCupon].utilizar += numInteraccionF;
        }
        return acc;
    }, {});

    // 3. Calcular la calificación final del cupón
    const calificacionesFinales = Object.keys(sumatorias).map(fidCupon => {
        const { ver, canjear, utilizar } = sumatorias[fidCupon];
        const calificacionFinal = (1 * ver + 2 * canjear + 3 * utilizar) / 6;
        return { fidCupon, calificacionFinal };
    });

    // 4. Determinar el cupón con la calificación más alta
    const cuponFavorito = calificacionesFinales.reduce((max, cupon) => cupon.calificacionFinal > max.calificacionFinal ? cupon : max, calificacionesFinales[0]);
    console.log("favorito funcion: " + cuponFavorito.fidCupon)
    return cuponFavorito;
};

const cuponesRecomendadosGeneral = async (req, res) => {
    try {
        const { idCliente, tipoAlgoritmo=1 } = req.body;
        //console.log("acaaaaaaaaaaaaaaaaaa "+idCliente)
        //devolver el id el cupon y su sumilla
        const tablaInteracciones = db.interaccionesCupon;
        const tablaRecomendacionGeneral = db.recomendacionGeneral;
        const tablaCupon = db.cupones;

        // 1. Obtener las interacciones del cliente
        const interacciones = await tablaInteracciones.findAll({
            attributes: ['fidCupon', 'numInteracciones', 'dia', 'tipo'],
            where: { activo: true, fidCliente: idCliente }
        });

        let favorito;
        if (!interacciones.length) {
            favorito = await tablaInteracciones.findOne({
                attributes: ['fidCupon', 'numInteracciones', 'dia'],
                where: { activo: true },
                order: [
                    ['numInteracciones', 'DESC'],
                    ['dia', 'DESC']
                ]
            });
            if (!favorito) {

                return res.status(200).json({ message: 'No se encontraron cupones favoritos para este cliente, incluso buscando en la tabla.' });
            };
        }else{
            favorito = calcularCuponFavorito(interacciones);
        }

        const cuponFavoritoId = favorito.fidCupon;
        console.log("fav: " + cuponFavoritoId)
        // 2. Buscar en la tabla recomendacionGenerals por la fecha de hoy y el cuponFavorito
        const today = moment().startOf('day');
        const tomorrow = moment().endOf('day');
        console.log("antes de recomendaciones")
        let recomendaciones = await tablaRecomendacionGeneral.findAll({
            where: {
                cuponFavorito: cuponFavoritoId,
                tipoAlgoritmo: tipoAlgoritmo,
                createdAt: {
                    [Op.between]: [today.toDate(), tomorrow.toDate()]
                }
            }
        });
        if (!recomendaciones.length) {
            console.log("vacio de recomendaciones")
            //si no encuentro busco con los 4 últimos
            recomendaciones = await tablaRecomendacionGeneral.findAll({
                where: {
                    cuponFavorito: cuponFavoritoId,
                    tipoAlgoritmo: tipoAlgoritmo,
                    createdAt: {
                        [Op.between]: [today.toDate(), tomorrow.toDate()]
                    }
                },
                order: [
                    ['updatedAt', 'DESC']
                ],
                limit: 4
            });

            if (!recomendaciones.length){
                return res.status(200).json({ message: 'No se encontraron recomendaciones para el cupón favorito en la fecha actual, tampoco buscando entre los ultimos de la tabla' });

            }
        }

        // 3. Obtener los detalles de los cupones recomendados
        const cuponRecomendadoIds = recomendaciones.map(rec => rec.cuponRecomendado);

        const cuponesRecomendados = await tablaCupon.findAll({
            where: { id: cuponRecomendadoIds },
            attributes: ['id', 'sumilla', 'costoPuntos', 'esLimitado', 'cantidadDisponible'],
            include: [
                {
                    model: db.locatarios,
                    as: 'locatario',
                    attributes: ['nombre'],
                    required: true,
                }
            ]
        });

        if (!cuponesRecomendados.length) {
            return res.status(500).json({ message: 'No se encontraron detalles para los cupones recomendados.' });
        }

        // 4. Obtener las imágenes
        const cuponesConImagenes = await Promise.all(cuponesRecomendados.map(async (cupon) => {
            const keyCupon = `cupon${cupon.id}.jpg`;
            const urlCupon = s3.getSignedUrl('getObject', {
                Bucket: 'appdp2',
                Key: keyCupon,
                Expires: 8600 // Tiempo de expiración en segundos
            });

            const keyLocatario = `tienda${cupon.locatario.id}.jpg`;
            const urlTienda = s3.getSignedUrl('getObject', {
                Bucket: 'appdp2',
                Key: keyLocatario,
                Expires: 8600 // Tiempo de expiración en segundos
            });

            if (tipoAlgoritmo == 1){
                return {
                    id: cupon.id,
                    sumilla: cupon.sumilla,
                    costoPuntos: cupon.costoPuntos,
                    esLimitado: cupon.esLimitado,
                    cantidadDisponible: cupon.cantidadDisponible,
                    locatario: cupon.locatario.nombre,
                    rutaFoto: urlCupon,
                    rutaTienda: urlTienda
                };
            }else{
                if(tipoAlgoritmo == 2){
                    return {
                        id: cupon.id,
                        rutaFoto: urlCupon
                    };
                }else{
                    return{
                        mensaje: "ERROR FATAL PIPIPIPI"
                    }
                }
            }
                
        }));

        // Devolver los datos formateados
        res.status(200).json({ cupones: cuponesConImagenes });

    } catch (error) {
        console.error('Error al obtener los cupones favoritos:', error);
        res.status(500).json({ message: 'Error al obtener los cupones favoritos' });
    }


}

const comprarCuponCliente = async (req, res, next) => {
    let connection;
    const idCliente = parseInt(req.body.idCliente)
    const idCupon = parseInt(req.body.idCupon)

    await nuevaInteraccion(idCupon, idCliente, "canje");

    const intentosMax = 3;
    let intentos = 0;
    let exito = false;
    while (intentos <= intentosMax && !exito) {
        try {
            connection = await pool.getConnection();
            const [result] = await connection.query(`CALL comprarCupon(?,?,@resultado,@mensaje)`, [idCliente, idCupon])

            const [row] = await connection.query('Select @resultado AS resultado, @mensaje AS mensaje')
            const resultado = row[0]
            res.status(200).json(resultado);
            exito = true;
        } catch (error) {
            intentos++;
            if (intentos > intentosMax) {
                next(error);
            } else {
                console.error(`Intento ${intentos} fallido. Reviviendo...`, error)
            }

        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
};

const nuevaInteraccion = async (idCupon, idCliente, tipo) => {
    try {
        // Busca si ya existe una interacción para el cliente y el cupón
        const interaccion = await db.interaccionesCupon.findOne({
            where: {
                fidCupon: idCupon,
                fidCliente: idCliente,
                tipo: tipo,
                dia: Sequelize.literal('CURRENT_DATE')
            }
        });

        if (interaccion) {
            // Si existe, incrementa el número de interacciones en 1
            await interaccion.update({
                numInteracciones: interaccion.numInteracciones + 1
            });
        } else {
            // Si no existe, crea una nueva interacción con numInteracciones igual a 1
            await db.interaccionesCupon.create({
                fidCupon: idCupon,
                fidCliente: idCliente,
                numInteracciones: 1,
                tipo: tipo,
                dia: new Date(),
                activo: true,
                //usuarioCreacion: 'system', // Ajusta según sea necesario
                //usuarioActualizacion: 'system' // Ajusta según sea necesario
            });
        }
    } catch (error) {
        console.error('Error al registrar la nueva interacción:', error);
        throw new Error('Error al registrar la nueva interacción');
    }
};


const cuponesParaIA = async (req, res) => {
    //console.log("Req ", req.query, req.body)

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
                        attributes: ['id', 'nombre'], // Opcional: si no necesitas atributos específicos de la categoría
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
                [Op.gt]: 0 // Validar que la fecha de expiración sea mayor a la fecha actual
            }
        }
    }

    const cupones = await db.cupones.findAll(options);

    const formattedCupones = cupones.map(cupon => {

        return {
            idCupon: cupon.id,
            //codigo: cupon.codigo,
            sumilla: cupon.sumilla,
            descripcionCompleta: cupon.descripcionCompleta,
            //fechaExpiracion: cupon.fechaExpiracion,
            //terminosCondiciones: cupon.terminosCondiciones,
            costoPuntos: cupon.costoPuntos,
            esLimitado: cupon.esLimitado,
            cantidadDisponible: cupon.cantidadDisponible,
            idLocatario: cupon.locatario.id,
            locatarioNombre: cupon.locatario.nombre,
            //locatarioDescripcion: cupon.locatario.descripcion,
            //locatarioLocacion: cupon.locatario.locacion,
            categoriaTiendaID: cupon.locatario.categoriaTienda.id,
            categoriaTiendaNombre: cupon.locatario.categoriaTienda.nombre
        };
    });

    console.log('data conseguida');
    res.json({ cupones: formattedCupones })
};

module.exports = {
    detalleCupon,
    detalleCuponCompleto,
    getCupones,
    deshabilitar,
    habilitar,
    crear,
    modificar,
    getCuponesClientes,

    getClientesXCupon,
    getCuponesXDiaCanjeado,
    cuponesFiltradosGeneral,

    comprarCuponCliente,
    cuponesFavoritos,
    allInteracciones,

    cuponesRecomendadosGeneral,
    nuevasRecomendaciones,
    cuponesParaIA

}