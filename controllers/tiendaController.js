//importing modules
const jwt = require("jsonwebtoken");
const db = require("../models");
require('dotenv').config();
const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const Op = Sequelize.Op;
const WebSocket = require("ws");
const crypto = require("crypto");
const { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY } = process.env;
const { AWS_ACCESS_KEY, AWS_ACCESS_SECRET, AWS_S3_BUCKET_NAME, AWS_SESSION_TOKEN } = process.env;
const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand
} = require("@aws-sdk/client-s3");
const {getSignUrlForFile} = require("../config/s3");

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
const User = db.users;
const Tienda = db.locatarios;
const UserInv = db.usersInv;
const Locatario = db.locatarios;
const CategoriaTienda = db.categoriaTiendas;
const Cupon = db.cupones;
const CuponXCliente = db.cuponXClientes;
const Cliente = db.clients;
const Escaneo = db.escaneos;


function generarRangoMeses(start, end) {
    const result = [];
    const current = new Date(start);
    while (current <= end) {
        result.push(new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short' }).format(current));
        current.setMonth(current.getMonth() + 1);
    }
    return result;
}
function parseDate(dateString) {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day); // Restar 1 al mes porque los meses en JavaScript van de 0 a 11
}
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
                    offset: offset,
                    limit: pageSize
                }),
                Tienda.count({
                })
            ]);
            const [tiendas, totalCount] = tiendasAndCount;
            if (tiendas) {
                const updatedTiendas = await Promise.all(tiendas.map(async (tienda) => {
                    const objectKey = `tienda${tienda.id}.jpg`;
                    const url = await getSignUrlForFile(objectKey,"defaultStore.png");
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
                    const url = await getSignUrlForFile(objectKey,"defaultStore.png");
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

const getPdfManual = async (req, res) => {

    try {

        const objectKey = `guiaweb.pdf`;
        const url = await getSignUrlForFile(objectKey,"defaultStore.png");
        console.log(url)
        return res.status(200).json({ urlPdf:url, newToken: req.newToken});

    } catch (error) {
        console.log('getPdfManual - queryType:', queryType, ' - [Error]: ', error);
        return res.status(404);
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
const crear = async (req, res) => {
    try {
        console.log("entre a registrar nueva tienda");
        console.log(req.user.id)

        const { nombre, fidCategoriaTienda, descripcion, locacion,horaApertura,horaCierre,aforo } = req.body;
        const findUser = await User.findOne({
            where: {
                id: req.user.id,

            },
            attributes: {exclude: ['contrasenia']}
        });
        const data = {
            nombre,
            fidCategoriaTienda,
            descripcion,
            locacion,
            horaApertura,
            horaCierre,
            aforo,
            rutaFoto:"www",
            usuarioCreacion:findUser.nombre + " " + findUser.apellido,
            usuarioActualizacion:findUser.nombre + " " + findUser.apellido,
            activo:1
        };
        //saving the user
        const tienda = await Tienda.create(data);
        //if user details is captured
        //generate token with the user's id and the secretKey in the env file
        // set cookie with the token generated
        if (tienda) {
            const file = req.files[0];
            const bucketParams = {
                Bucket: AWS_S3_BUCKET_NAME,
                Key: `tienda${tienda.id}.jpg`,
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
                    message: "Se encontró un error durante la subida del archivo, pero sí se creó la tienda. Edítalo posteriormente."
                });
            }

            //send users details
            //broadcast(req.app.locals.clients, 'signup', user);
            return res.status(200).send({message:"Tienda "+ tienda.id+ " creado correctamente"});
        }
        else {
            return res.status(400).send("Invalid request body");
        }


    } catch (error) {
        console.log('crearTienda - [Error]: ', error);
    }
}

const modificar = async (req, res) => {
    console.log("modiciar tienda")
    console.log(req.body)

    const {id, nombre, fidCategoriaTienda, descripcion, locacion,horaApertura,horaCierre,aforo} = req.body;
    try {
        console.log("entre a modificar  tienda");
        console.log(id)
        const tienda = await Tienda.findOne({
            where: {
                id: parseInt(id)
            }
        });
        if (!tienda) {
            console.log("Tienda "+updateItem+" no fue encontrado")
            return res.status(409).send("Tienda "+updateItem+" no fue encontrado");
        }
        console.log("despues de tienda")
        const file = req.files[0];
        console.log("despues de tienda2")
        if(file){
            const existingFileKey = `tienda${tienda.id}.jpg`; // Asumiendo que el archivo existente tiene el mismo código y extensión .jpg
            const newFileKey = `tienda${id}.jpg`;
            console.log("despues de tienda23")
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
                    message: "Se encontró un error durante la subida del archivo, pero sí se edito la tienda. Edítalo posteriormente."
                });
            }
        }else{
            console.log("no has enviado ningun archivo")
        }
        console.log("despues de tienda232")
        const findUser = await User.findOne({
            where: {
                id:req.user.id,

            },
            attributes: {exclude: ['contrasenia']}
        });
        console.log("despues de tienda23")
        await Tienda.update(
            {
                nombre, fidCategoriaTienda, descripcion, locacion,horaApertura,horaCierre,aforo, usuarioCreacion:findUser.nombre + " " + findUser.apellido,
                usuarioActualizacion:findUser.nombre + " " + findUser.apellido,
            },
            {
                where: { id: id }
            }
        );
        console.log("despues de tienda23")
        return res.status(200).send({message:"Tienda modificada correctametne"});
    } catch (error) {
        console.log('updateTienda - updateItem:', updateItem, ' - [Error]: ', error)
    }
}
const detalleTiendaCompleto = async (req, res) => {
    try {
        console.log(req.body)

        const detalleTienda = await Tienda.findOne({
            where: { id: req.body.id },
            include: [
                {
                    model: db.categoriaTiendas,
                    as: 'categoriaTienda',
                    attributes: ['id','nombre'],
                },
            ]
        });

        if (detalleTienda) {

                const objectKey = `tienda${detalleTienda.id}.jpg`;
                const url = await getSignUrlForFile(objectKey,"defaultStore.png");
            console.log(detalleTienda.id)
            console.log(url)
            console.log(`Attempting to retrieve object with key: ${objectKey} from bucket:`, AWS_S3_BUCKET_NAME);
            res.status(200).json({ success: true, detalles: detalleTienda, image:url});
        } else {
            res.status(404).json({ success: false, message: 'Tienda no encontrado'});
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: 'Hubo un error al procesar la solicitud' });
    }
}

const listarCuponesMesxTienda= async (req, res) => {
    var idParam = parseInt(req.query.idParam); // IdParam es el id del cliente
    const startDate = req.query.startDate ? parseDate(req.query.startDate) : null;
    const endDate = req.query.endDate ? parseDate(req.query.endDate) : null;

    console.log('getCuponesXTiendaEspecifica - query: ', req.query.idParam, startDate, endDate);
    if (!idParam) {
        console.log("Requested item wasn't found!, ?query=xxxx is required!");
        return res.status(409).send("?query=xxxx is required! NB: xxxx is all / email");
    }
    if (!startDate || !endDate) {
        return res.status(400).send("startDate and endDate are required!");
    }
    console.log(startDate)
    console.log(endDate)
    try {
        // Obtener cupones agrupados por fecha y categoría
        // Obtener cupones agrupados por fecha y categoría para cupones canjeados
        const cuponesxTienda = await CuponXCliente.findAll({
            where: {
                '$cupon.locatario.id$': idParam,
                fechaCompra: {
                    [db.Sequelize.Op.between]: [startDate, endDate]
                }
            },
            include: [{
                model: Cupon,
                as: 'cupon',
                attributes: [], // No necesitamos atributos adicionales de Cupon
                include: [{
                    model: Locatario,
                    as: 'locatario'
                }]
            }],
            attributes: [
                [db.sequelize.literal(`DATE_FORMAT(cuponXCliente.fechaCompra, '%b %Y')`), 'fechaMesAnio'],
                [db.sequelize.fn('COUNT', db.sequelize.col('cuponXCliente.id')), 'cantidad']
            ],
            group: [
                db.sequelize.literal(`DATE_FORMAT(cuponXCliente.fechaCompra, '%b %Y')`)
            ],
            order: [
                [db.sequelize.fn('DATE', db.sequelize.col('cuponXCliente.fechaCompra')), 'ASC']
            ]
        });

        const monthsRange = generarRangoMeses(startDate, endDate);
        // Función para mapear los datos
        const mapearCupones = (cupones) => {
            const result = monthsRange.map(month => ({
                fechaMesAnio: month,
                cantidad: 0
            }));
            cupones.forEach(cupon => {
                const fechaMesAnio = cupon.get('fechaMesAnio');
                const cantidad = cupon.get('cantidad');
                const foundMonth = result.find(month => month.fechaMesAnio === fechaMesAnio);
                if (foundMonth) {
                    foundMonth.cantidad = cantidad;
                }
            });
            return result;
        };

        const dataCupones = mapearCupones(cuponesxTienda);


        // Crear la estructura final
        const resultado = [
            {
                variable: "Cupones",
                data: dataCupones
            }
        ];
        console.log("resultados canejado usados")
        console.log(resultado)
        return res.status(200).json({ cupones: resultado, newToken: req.newToken });
    } catch (error) {
        console.log('getCuponXTienda - queryType: - [Error]: ', error);
        return res.status(500).send('Internal Server Error');
    }
}

const getCuponesXTienda = async (req, res) => {
    var queryType = req.query.query;
    console.log(req.query)
    console.log(req.query.idParam)
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
            console.log("Estoy viendo algo que  es all")
            const cuponesAndCount = await Promise.all([
                CuponXCliente.findAll({
                    offset: offset,
                    limit: pageSize,
                    where: {
                        '$cupon.locatario.id$': idParam
                    },
                    include: [
                        {
                            model: Cupon,
                            as: 'cupon',
                            include: [{
                                model: Locatario,
                                as: 'locatario'
                            }]
                        },{
                            model: Cliente,
                            as: 'cliente',
                        }
                    ]
                }),
                CuponXCliente.count({
                    where: {
                        '$cupon.locatario.id$': idParam
                    },
                    include: [
                        {
                            model: Cupon,
                            as: 'cupon',
                            include: [{
                                model: Locatario,
                                as: 'locatario'
                            }]
                        }
                    ]
                })
            ]);
            const [cuponesXTienda, totalCount] = cuponesAndCount;
            return res.status(200).json({ cuponesXTienda:cuponesXTienda, newToken: req.newToken,totalCupones:totalCount });
        } else {
            console.log("Estoy viendo algo que no es all")
            const whereCondition = {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { nombre: { [Op.like]: `%${queryType}%` } }
                        ]
                    },
                    {
                        '$cupon.locatario.id$': idParam
                    }
                ]
            };
            const cuponesAndCount = await Promise.all([
                CuponXCliente.findAll({
                    where: whereCondition,
                    include: [
                        {
                            model: Cupon,
                            as: 'cupon',
                            include: [{
                                model: Locatario,
                                as: 'locatario'
                            }]
                        },{
                            model: Cliente,
                            as: 'cliente',
                        }

                        ],
                    offset: offset,
                    limit: pageSize
                }),
                CuponXCliente.count({
                    where: whereCondition,
                    include: [{
                        model: Cupon,
                        as: 'cupon',
                        include: [{
                            model: Locatario,
                            as: 'locatario'
                        }]
                    }],
                })
            ]);
            const [cupones, totalCount] = cuponesAndCount;
            if (cupones) {
                // console.log(users)
                // console.log(users)
                return res.status(200).json({ cupones, newToken: req.newToken,totalCupones:totalCount });
            } else {
                return res.status(200).send("Cupones no encontrados con esa busqueda para el cupon");
            }
        }
    } catch (error) {
        console.log('getClientesXCupon - queryType:', queryType, ' - [Error]: ', error);
    }
}

const getTopTiendasAsist= async (req, res) => {

    const startDate = req.query.startDate ? parseDate(req.query.startDate) : null;
    const endDate = req.query.endDate ? parseDate(req.query.endDate) : null;

    console.log('getTopTiendasAsist - query: ');

    if (!startDate || !endDate) {
        return res.status(400).send("startDate and endDate are required!");
    }
    console.log(startDate)
    console.log(endDate)
    try {
        // Obtener cupones agrupados por fecha y categoría
        // Obtener cupones agrupados por fecha y categoría para cupones canjeados
        const escaneo = await db.sequelize.query(
            `
                SELECT
                    
                    locatario.nombre AS NombreTienda,
                    COALESCE(c.cantidad, 0) AS cantidad
                FROM
                    locatarios AS locatario
                        LEFT JOIN
                    (
                        SELECT
                            fidReferencia,
                            COUNT(*) AS cantidad
                        FROM
                            escaneos
                        WHERE
                            ultimoEscaneo BETWEEN :startDate AND :endDate
                          AND tipo = 'tienda'
                        GROUP BY
                            fidReferencia
                    ) AS c ON locatario.id = c.fidReferencia
                ORDER BY
                    cantidad
                    DESC
                    LIMIT 10`, {
            replacements: { startDate, endDate },
            type: QueryTypes.SELECT
        });
        console.log("resultados topTiendas Asitencias")
        console.log(escaneo)
        return res.status(200).json({ resultadoTopTiendas: escaneo, newToken: req.newToken });
    } catch (error) {
        console.log('getCuponXTienda - queryType: - [Error]: ', error);
        return res.status(500).send('Internal Server Error');
    }
}

const getBottomTiendasAsist= async (req, res) => {

    const startDate = req.query.startDate ? parseDate(req.query.startDate) : null;
    const endDate = req.query.endDate ? parseDate(req.query.endDate) : null;

    console.log('getTopTiendasAsist - query: ');

    if (!startDate || !endDate) {
        return res.status(400).send("startDate and endDate are required!");
    }
    console.log(startDate)
    console.log(endDate)
    try {
        // Obtener cupones agrupados por fecha y categoría
        // Obtener cupones agrupados por fecha y categoría para cupones canjeados
        const escaneo = await db.sequelize.query(
            `
                SELECT
                    
                    locatario.nombre AS NombreTienda,
                    COALESCE(c.cantidad, 0) AS cantidad
                FROM
                    locatarios AS locatario
                        LEFT JOIN
                    (
                        SELECT
                            fidReferencia,
                            COUNT(*) AS cantidad
                        FROM
                            escaneos
                        WHERE
                            ultimoEscaneo BETWEEN :startDate AND :endDate
                          AND tipo = 'tienda'
                        GROUP BY
                            fidReferencia
                    ) AS c ON locatario.id = c.fidReferencia
                ORDER BY
                    cantidad
                    ASC
                    LIMIT 10`, {
                replacements: { startDate, endDate },
                type: QueryTypes.SELECT
            });
        console.log("resultados topTiendas Asitencias")
        console.log(escaneo)
        return res.status(200).json({ resultadoTopTiendas: escaneo, newToken: req.newToken });
    } catch (error) {
        console.log('getCuponXTienda - queryType: - [Error]: ', error);
        return res.status(500).send('Internal Server Error');
    }
}

const getPuntosTiendasAsitencia = async (req, res) => {

    const startDate = req.query.startDate ? parseDate(req.query.startDate) : null;
    const endDate = req.query.endDate ? parseDate(req.query.endDate) : null;

    console.log('getPuntosTiendasAsitencia - query: ');

    if (!startDate || !endDate) {
        return res.status(400).send("startDate and endDate are required!");
    }
    console.log(startDate)
    console.log(endDate)

    try {

        // Obtener todos los géneros únicos
        const tiendaEscPuntos = await Escaneo.findAll({
            where: {
                ultimoEscaneo: {
                    [db.Sequelize.Op.between]: [startDate, endDate]
                },
                tipo: 'tienda'
            },
            attributes: [
                [db.sequelize.fn('SUM', db.sequelize.col('puntosOtorgados')), 'totalPuntosOtorgadosTienda']
            ]
        });

        console.log(tiendaEscPuntos[0])
        return res.status(200).json(tiendaEscPuntos[0]);
    } catch (error) {
        console.log('getPuntosTiendasAsitencia - queryType: - [Error]: ', error);
        return res.status(500).send('Internal Server Error');
    }
}
module.exports = {
    habilitar,
    deshabilitar,
    getTiendas,
    crear,
    modificar,
    detalleTiendaCompleto,
    listarCuponesMesxTienda,
    getCuponesXTienda,
    getTopTiendasAsist,
    getBottomTiendasAsist,
    getPuntosTiendasAsitencia,
    getPdfManual
};