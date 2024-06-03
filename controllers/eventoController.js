const db = require("../models");
require('dotenv').config();
const Sequelize = require('sequelize');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Op = Sequelize.Op;
const { AWS_ACCESS_KEY, AWS_ACCESS_SECRET, AWS_S3_BUCKET_NAME, AWS_SESSION_TOKEN } = process.env;

const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'dp2-database.cvezha58bpsj.us-east-1.rds.amazonaws.com',
      port: 3306,
      user: 'administrador',
      password: 'contrasenia',
      database: 'plaza'
      });
      const AWS = require('aws-sdk');
const {getSignUrlForFile} = require("../config/s3");
      AWS.config.update({
          accessKeyId: AWS_ACCESS_KEY,
          secretAccessKey: AWS_ACCESS_SECRET,
          sessionToken: AWS_SESSION_TOKEN,
          region: 'us-east-1' // La región donde está tu bucket
        });
const s3 = new AWS.S3();
const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand
} = require("@aws-sdk/client-s3");
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

const Evento = db.eventos;
const Locatario = db.locatarios;
const CategoriaTienda=db.categoriaTiendas;
const EventoXCliente=db.eventoXClientes;
const User=db.users;

const getEventosConAsistentesYCategoria = async (req, res) => {
    const { fechaInicial, fechaFinal } = req.query;
    console.log(fechaInicial);
    console.log(fechaFinal);
    if (!fechaInicial || !fechaFinal) {
        return res.status(400).send("Parámetros 'fechaInicial' y 'fechaFinal' son requeridos.");
    }

    try {
        const eventos = await Evento.findAll({
            where: {
                fechaInicio: {
                    [db.Sequelize.Op.gte]: new Date(fechaInicial)
                },
                fechaFin: {
                    [db.Sequelize.Op.lte]: new Date(fechaFinal)
                }
            },
            include: [
                {
                    model: Locatario,
                    as: 'locatario',
                    include: [{
                        model: CategoriaTienda,
                        as: 'categoriaTienda',
                        attributes: []  // No necesitamos más atributos aquí porque lo agregaremos en el nivel superior
                    }],
                    attributes: []  // No necesitamos otros atributos del locatario para esta consulta
                },
                {
                    model: EventoXCliente,
                    as: 'eventoxcliente',
                    attributes: [],
                    where: { asistio: true },
                    required: false
                }
            ],
            attributes: [
                [db.Sequelize.fn('COUNT', db.Sequelize.col('eventoxcliente.id')), 'numeroAsistentes'],
                // Formatea la fecha al estilo "MMM YYYY" en español usando DATE_FORMAT
                [db.Sequelize.literal(`DATE_FORMAT(evento.fechaInicio, '%b %Y')`), 'mes'],
                [db.Sequelize.col('locatario->categoriaTienda.nombre'), 'categoria'],
                [db.Sequelize.col('eventoxcliente.codigoQR'), 'codigoQR']
            ],
            group: [
                db.Sequelize.literal(`DATE_FORMAT(evento.fechaInicio, '%b %Y')`),
                'locatario->categoriaTienda.id',
            ]
        });

        /* const resultadoFinal = eventos.map(evento => {
            const mesEnEspanol = {
                'Jan': 'Ene',
                'Apr': 'Abr',
                'Aug': 'Ago',
                'Dec': 'Dic'
            };
            let mes = evento.dataValues.mes.split(' ');
            mes[0] = mesEnEspanol[mes[0]] || mes[0];
            mes = mes.join(' ');

            return {
                numeroAsistentes: evento.dataValues.numeroAsistentes,
                mes: mes,
                categoria: evento.dataValues.categoria
            };
        }); */

        if (eventos && eventos.length > 0) {
            return res.status(200).json(eventos);
        } else {
            return res.status(404).send('No se encontraron eventos.');
        }
    } catch (error) {
        console.error('Error al obtener los eventos con categorías de tienda y asistentes:', error);
        res.status(500).send('Error interno del servidor');
    }
};

// Aparece en Home solo los 10 o X principales
const getEventosProximos = async (req, res,next) => {
    const page = parseInt(req.body.page) || 1; // Página actual, default 1
    const pageSize = parseInt(req.body.pageSize) || 3; // Tamaño de página, default 3
    const offset = (page - 1) * pageSize; // Calcular el offset
    const cantidad =parseInt(req.body.maxValores) || 10
    const valoresFaltantes = cantidad - ((page-1)*pageSize)
    let connection;
    try{
         connection = await pool.getConnection();
        const [result] = await connection.query(`CALL eventosProximos(?,?,?)`,[pageSize,offset,valoresFaltantes])
        const totalPages = Math.ceil(cantidad / pageSize);
        const [eventosObtenidos] = result;
   
        const respuesta = {
            totalEncontrados: cantidad,
            totalPaginas: totalPages,
            cupones: eventosObtenidos.map(evento => {
                const key = `evento${evento.idEvento}.jpg`;

                // Genera la URL firmada para el objeto en el bucket appdp2
                const urlEvento = s3.getSignedUrl('getObject', {
                    Bucket: 'appdp2',
                    Key: key,
                    Expires: 8600 // Tiempo de expiración en segundos
                });
                
                evento.fechaInicio= evento.fechaInicio.toISOString().split('T')[0];
                evento.fechaFin=evento.fechaFin.toISOString().split('T')[0];
                evento.fechaInicio=`${evento.fechaInicio.split('-')[2]}-${evento.fechaInicio.split('-')[1]}-${evento.fechaInicio.split('-')[0]}`;
                evento.fechaFin=`${evento.fechaFin.split('-')[2]}-${evento.fechaFin.split('-')[1]}-${evento.fechaFin.split('-')[0]}`;

              return {
                idEvento: evento.idEvento,
                nombreEvento: evento.nombreEvento,
                fechaInicio: evento.fechaInicio,
                fechaFin: evento.fechaFin,
                horarioInicio: evento.horaInicio,
                horaFin:evento.horaFin,
                descripcion: evento.descripcionEvento,
                puntos: evento.puntosOtorgados,
                ubicacion: evento.ubicacion,
                aforo: evento.aforo,
                nombreTienda:evento.nombreTienda,
                urlEvento: urlEvento,
              };
            })
          };
        res.status(200).json(respuesta);
    }catch(error){
        next(error)
    }finally {
        if (connection){
            connection.release();
        }
    }
}

// Aparece en su pagina unica todos los que hay
const getEventosProxTotales= async (req, res,next) => {
    const page = parseInt(req.body.page) || 1; // Página actual, default 1
    const pageSize = parseInt(req.body.pageSize) || 3; // Tamaño de página, default 3
    const offset = (page - 1) * pageSize; // Calcular el offset
    let connection;
    try{
        const {} = req.params
        connection = await pool.getConnection();
        const [total] = await connection.query(`CALL eventosProximosTotal(@cantidad)`)
        
        const [row] = await connection.query('SELECT @cantidad AS cantidad')
        const cantidad = row[0].cantidad

        const [result] = await connection.query(`CALL eventosProximosPaginacion(?,?)`,[pageSize,offset])
        const totalPages = Math.ceil(cantidad / pageSize);
        const [eventosObtenidos] = result;
   
        const respuesta = {
            totalEncontrados: cantidad,
            totalPaginas: totalPages,
            eventos: eventosObtenidos.map(evento => {
                const key = `evento${evento.idEvento}.jpg`;

                // Genera la URL firmada para el objeto en el bucket appdp2
                const urlEvento = s3.getSignedUrl('getObject', {
                    Bucket: 'appdp2',
                    Key: key,
                    Expires: 8600 // Tiempo de expiración en segundos
                });

                const key2 = `tienda${evento.idTienda}.jpg`;

                // Genera la URL firmada para el objeto en el bucket appdp2
                const urlTienda = s3.getSignedUrl('getObject', {
                    Bucket: 'appdp2',
                    Key: key2,
                    Expires: 8600 // Tiempo de expiración en segundos
                });

                evento.fechaInicio= evento.fechaInicio.toISOString().split('T')[0];
                evento.fechaFin=evento.fechaFin.toISOString().split('T')[0];
                evento.fechaInicio=`${evento.fechaInicio.split('-')[2]}-${evento.fechaInicio.split('-')[1]}-${evento.fechaInicio.split('-')[0]}`;
                evento.fechaFin=`${evento.fechaFin.split('-')[2]}-${evento.fechaFin.split('-')[1]}-${evento.fechaFin.split('-')[0]}`;

              return {
                idEvento: evento.idEvento,
                nombreEvento: evento.nombreEvento,
                nombreTienda:evento.nombreTienda,
                puntosOtorgados:evento.puntosOtorgados,
                urlEvento: urlEvento,
                urlTienda:urlTienda,
                fechaInicio: evento.fechaInicio,
                fechaFin: evento.fechaFin,
                horarioInicio: evento.horaInicio,
                horaFin:evento.horaFin
              };
            })
          };
        res.status(200).json(respuesta);
    }catch(error){
        next(error)
    }finally {
        if (connection){
            connection.release();
        }
    }
}

const getEventos = async (req, res) => {
    console.log(req.query)
    var queryType = req.query.query;
    // console.log(req.query.query)
    const page = parseInt(req.query.page) || 1; // Página actual, default 1
    const pageSize = parseInt(req.query.pageSize) || 6; // Tamaño de página, default 10
    const offset = (page - 1) * pageSize;
    console.log('getEvento - query: ', req.query.query);
    if (!queryType) {
        console.log("Requested item wasn't found!, ?query=xxxx is required!");
        return res.status(409).send("?query=xxxx is required! NB: xxxx is all / email");
    }
    try {
        if (queryType === 'all') {
            const eventosAndCount = await Promise.all([
                Evento.findAll({
                    offset: offset,
                    limit: pageSize
                }),
                Evento.count({})
            ]);
            const [eventos, totalCount] = eventosAndCount;
            if (eventos) {
                const updatedEventos = await Promise.all(eventos.map(async (evento) => {
                    const objectKey = `evento${evento.id}.jpg`;
                    const url = await getSignUrlForFile(objectKey);
                    // Agregar la URL firmada al objeto del cupón
                    return { ...evento.dataValues, rutaFoto: url };
                }));
                return res.status(200).json({ eventos:updatedEventos, newToken: req.newToken,totalEventos:totalCount });
            } else {
                return res.status(400).send("Invalid request body");
            }
        } else {
            console.log("Estoy viendo algo que no es all")

            const eventosAndCount = await Promise.all([
                Evento.findAll({
                    where: {
                        [Op.or]: [
                            { nombre: { [Op.like]: `%${queryType}%` } }

                        ]
                    },
                    offset: offset,
                    limit: pageSize
                }),
                Evento.count({
                    where: {
                        [Op.or]: [
                            { nombre: { [Op.like]: `%${queryType}%` } }
                        ]
                    }
                })
            ]);
            const [eventos, totalCount] = eventosAndCount;
            if (eventos) {
                // console.log(users)
                // console.log(users)
                const updatedEventos = await Promise.all(eventos.map(async (evento) => {
                    const objectKey = `evento${evento.id}.jpg`;
                    const url = await getSignUrlForFile(objectKey);
                    // Agregar la URL firmada al objeto del cupón
                    return { ...evento.dataValues, rutaFoto: url };
                }));
                return res.status(200).json({ eventos:updatedEventos, newToken: req.newToken,totalEventos:totalCount });
            } else {
                return res.status(200).send("Eventos no encontrados con esa busqueda");
            }
        }
    } catch (error) {
        console.log('getEventos - queryType:', queryType, ' - [Error]: ', error);
    }
}
const crear = async (req, res) => {
    try {
        console.log("entre a registrar nuevo evento");


        const { codigo,nombre, fechaInicio,fechaFin, descripcion, fidLugar,fidTipoEvento,fidTienda,puntosOtorgados } = req.body;

        const checkEvento= await Evento.findOne({
            where: {
                codigo: codigo
            }
        });
        if (checkEvento) {
            console.log("Requested "+codigo+" esta duplicado, por favor no colocar un codigo de evento ya existente")
            return res.status(409).send("Requested "+codigo+" esta duplicado, por favor no colocar un codigo de evento ya existente");
        }
        const findUser = await User.findOne({
            where: {
                id: req.user.id,

            },
            attributes: {exclude: ['contrasenia']}
        });
        const data = {
            codigo,
            nombre,
            fechaInicio,
            fechaFin,
            descripcion,
            fidLugar,
            fidTipoEvento,
            fidTienda,
            puntosOtorgados,
            ordenPriorizacion:1,
            rutaFoto: codigo,
            usuarioCreacion:findUser.nombre + " " + findUser.apellido,
            usuarioActualizacion:findUser.nombre + " " + findUser.apellido,
            activo:1
        };
        //saving the user
        const evento = await Evento.create(data);
        //if user details is captured
        //generate token with the user's id and the secretKey in the env file
        // set cookie with the token generated
        if (evento) {
            const file = req.files[0];
            const bucketParams = {
                Bucket: AWS_S3_BUCKET_NAME,
                Key: `evento${evento.id}.jpg`,
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
            return res.status(200).send({message:"Evento "+ evento.id+ " creado correctamente"});
        }
        else {
            return res.status(400).send("Invalid request body");
        }


    } catch (error) {
        console.log('crearEvento- [Error]: ', error);
    }
}
const modificar = async (req, res) => {
    try {
        console.log("viendo modificar evento")


        const { id, codigo,nombre, fechaInicio,fechaFin, descripcion, fidLugar,fidTipoEvento,fidTienda,puntosOtorgados } = req.body;

        const evento = await Evento.findOne({
            where: {
                id: id
            }
        });
        if (!evento) {
            console.log("Evento "+updateItem+" no fue encontrado")
            return res.status(409).send("Evento "+updateItem+" no fue encontrado");
        }

        const checkEvento= await Evento.findOne({
            where: {
                codigo: codigo
            }
        });
        if (checkEvento && parseInt(id,10)!== checkEvento.id) {

            console.log("Requested "+codigo+" esta duplicado, por favor no colocar un codigo de evento ya existente")
            return res.status(409).send("Requested "+codigo+" esta duplicado, por favor no colocar un codigo de evento ya existente");
        }
        const findUser = await User.findOne({
            where: {
                id: req.user.id,

            },
            attributes: {exclude: ['contrasenia']}
        });
        const file = req.files[0];
        if(file){
            const existingFileKey = `evento${checkEvento.id}.jpg`; // Asumiendo que el archivo existente tiene el mismo código y extensión .jpg
            const newFileKey = `evento${id}.jpg`;

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
                    message: "Se encontró un error durante la subida del archivo, pero sí se creó el evento. Edítalo posteriormente."
                });
            }
        }else{
            console.log("no has enviado ningun archivo")
        }
        await Evento.update(
            {
                codigo,nombre, fechaInicio,fechaFin, descripcion, fidLugar,fidTipoEvento,fidTienda,puntosOtorgados,
                usuarioActualizacion:findUser.nombre + " " + findUser.apellido
            },
            {
                where: { id: id }
            }
        );
        return res.status(200).send({message:"Evento modificado correctametne"});

    } catch (error) {
        console.log('crearEvento- [Error]: ', error);
    }
}

const habilitar = async (req, res) => {
    console.log(req.body)
    try {
        console.log('updateEvento - updateItem: ', req.body);
        for (let i = 0; i < req.body.selected.length; i++) {
            const selectedItem = req.body.selected[i];
            console.log('Item seleccionado:', selectedItem);
            const evento = await Evento.findOne({
                where: {
                    id: selectedItem
                }
            });
            if (!evento) {
                return res.status(409).send("El id del cupon  "+selectedItem+" no se encontro en la bd");
            }
            await Evento.update(
                {
                    activo: 1
                },
                {
                    where: { id: selectedItem }
                }
            );
        }
        return res.status(200).send({message:"Eventos habilitados correctamente", code:0});
    } catch (error) {
        console.log('updateEvento - updateItem: - [Error]: ', error)
    }
}
const deshabilitar = async (req, res) => {
    try {
        console.log('updateEvento - updateItem: ', req.body.selected);
        console.log(req.body.selected.length);
        for (let i = 0; i < req.body.selected.length; i++) {
            const selectedItem = req.body.selected[i];
            console.log('Item seleccionado:', selectedItem);
            const evento = await Evento.findOne({
                where: {
                    id: selectedItem
                }
            });
            if (!evento) {
                return res.status(409).send("El id del cupon "+selectedItem+" no se encontro en la bd");
            }
            await Evento.update(
                {
                    activo: 0
                },
                {
                    where: { id: selectedItem }
                }
            );
        }
        return res.status(200).send({message:"Eventos deshabilitados correctamente", code:0});
    } catch (error) {
        console.log('updateEvento updateItem: - [Error]: ', error)
    }
}

module.exports = {
    getEventosConAsistentesYCategoria,
    getEventosProximos,
    getEventosProxTotales,
    getEventos,
    crear,
    modificar,
    habilitar,
    deshabilitar
}