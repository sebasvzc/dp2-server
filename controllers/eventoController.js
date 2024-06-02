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
      AWS.config.update({
          accessKeyId: AWS_ACCESS_KEY,
          secretAccessKey: AWS_ACCESS_SECRET,
          sessionToken: AWS_SESSION_TOKEN,
          region: 'us-east-1' // La región donde está tu bucket
        });
      
      const s3 = new AWS.S3();

const Evento = db.eventos;
const Locatario = db.locatarios;
const CategoriaTienda=db.categoriaTiendas;
const EventoXCliente=db.eventoXClientes;

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



module.exports = {
    getEventosConAsistentesYCategoria,
    getEventosProximos,
    getEventosProxTotales
}