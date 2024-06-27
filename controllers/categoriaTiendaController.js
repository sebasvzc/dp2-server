// Importing modules
const db = require("../models");
const {getSignUrlForFile} = require("../config/s3");
require('dotenv').config();
const mysql = require('mysql2/promise');
const Sequelize = require("sequelize");
const {QueryTypes} = require("sequelize");
const Op = Sequelize.Op;
const pool = mysql.createPool({
      host: 'dp2-database.cvezha58bpsj.us-east-1.rds.amazonaws.com',
      port: 3306,
      user: 'administrador',
      password: 'contrasenia',
      database: 'plaza'
      });
const CategoriaTienda = db.categoriaTiendas;
function parseDate(dateString) {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day); // Restar 1 al mes porque los meses en JavaScript van de 0 a 11
}
// Function to get active "categoriaTiendas"
const getCategoriaTiendas = async (req, res) => {
    try {
        const categoriaTiendas = await db.categoriaTiendas.findAll({
            attributes: ['id', 'nombre', 'descripcion'],
            where: { activo: 1 }
        });
        res.json(categoriaTiendas);  // Respond with the retrieved records
    } catch (error) {
        console.error('Error fetching categoriaTiendas:', error);
        res.status(500).send('Internal Server Error');
    }
}
const getCategoriaTiendasWeb = async (req, res) => {
    var queryType = req.query.query;
    // console.log(req.query.query)
    const page = parseInt(req.query.page) || 1; // Página actual, default 1
    const pageSize = parseInt(req.query.pageSize) || 6; // Tamaño de página, default 10
    const offset = (page - 1) * pageSize;
    console.log('getCategoriaTienda - query: ')
    console.log('getCategoriaTienda - query: ', req.query.query);
    if (!queryType) {
        console.log("Requested item wasn't found!, ?query=xxxx is required!");
        return res.status(409).send("?query=xxxx is required! NB: xxxx is all / email");
    }
    try {
        if (queryType === 'all') {
            const categoriatiendasAndCount = await Promise.all([
                CategoriaTienda.findAll({
                    offset: offset,
                    limit: pageSize,
                    where: {
                        activo: true
                    }
                }),
                CategoriaTienda.count({
                    where: {
                        activo: true
                    }
                })
            ]);
            const [cattiendas, totalCount] = categoriatiendasAndCount;
            if (cattiendas) {

                return res.status(200).json({ cattiendas, newToken: req.newToken,totalCatTiendas:totalCount });
            } else {
                return res.status(400).send("Invalid request body");
            }
        } else {
            console.log("Estoy viendo algo que no es all")

            const categoriatiendasAndCount = await Promise.all([
                CategoriaTienda.findAll({

                    where: {
                        activo: true,
                        nombre: { [Op.like]: `%${queryType}%` }
                    },
                    offset: offset,
                    limit: pageSize
                }),
                CategoriaTienda.count({
                    where: {
                        activo: true,
                        nombre: { [Op.like]: `%${queryType}%` }
                    }
                })
            ]);
            const [cattiendas, totalCount] = categoriatiendasAndCount;
            if (cattiendas) {

                return res.status(200).json({ cattiendas, newToken: req.newToken,totalCatTiendas:totalCount });
            } else {
                return res.status(200).send("Categoria Tienda no encontrado");
            }
        }
    } catch (error) {
        console.log('getTiendas - queryType:', queryType, ' - [Error]: ', error);
    }
}

const crearCategoriaTiendaWeb = async (req, res,next) => {
    let connection;
    const {nombre,descripcion} = req.body;

    try{

        connection = await pool.getConnection();
        const [result] = await connection.query(`CALL crearCategoriaTiendaWeb(?,?,@resultado,@mensaje)`,[nombre,descripcion])
        
        const [row] = await connection.query ('Select @resultado AS resultado, @mensaje AS mensaje')
        const resultado = row[0]
        res.status(200).json(resultado);
    }catch(error){
        next(error)
    }finally {
        if (connection){
            connection.release();
        }
    }
}

const editarCategoriaTiendaWeb = async (req, res,next) => {
    let connection;
    const nombre = req.body.nombre ;
    const descripcion = req.body.descripcion;
    const idCategoria = parseInt(req.body.idCategoria);

    try{

        connection = await pool.getConnection();
        const [result] = await connection.query(`CALL editarCategoriaTiendaWeb(?,?,?,@resultado,@mensaje)`,[idCategoria,nombre,descripcion])
        
        const [row] = await connection.query ('Select @resultado AS resultado, @mensaje AS mensaje')
        const resultado = row[0]
        res.status(200).json(resultado);
    }catch(error){
        next(error)
    }finally {
        if (connection){
            connection.release();
        }
    }
}

const habilitarCategoria = async (req, res,next) => {
    let connection;
    let ids = req.body.selected || [1, 2, 3, 4, 5]; //ids en lista GA

    if (typeof ids === 'string') {
        ids = JSON.parse(ids).map(id => parseInt(id, 10));
    } else if (Array.isArray(ids)) {
        ids = ids.map(id => parseInt(id, 10));
    }

    const categoriasHabilitadas = [];
    try{
        connection = await pool.getConnection();
        for (let i = 0; i < ids.length; i++) {
            const idSub = ids[i];
            await connection.query(`CALL habilitarCategorias(?)`, [idSub]);
        
            const [rows] = await connection.query(`SELECT nombre FROM categoriaTiendas WHERE id = ?`, [idSub]);
            if (rows.length > 0) {
                categoriasHabilitadas.push(rows[0].nombre);
            }
        
        }
    res.status(200).json({ message: 'Categorías habilitadas correctamente', categorias: categoriasHabilitadas });
    }catch(error){
        next(error)
    }finally {
        if (connection){
            connection.release();
        }
    }
}


const deshabilitarCategoria = async (req, res,next) => {
    let connection;
    let ids = req.body.selected || [1, 2, 3, 4, 5]; //ids en lista GA

    if (typeof ids === 'string') {
        ids = JSON.parse(ids).map(id => parseInt(id, 10));
    } else if (Array.isArray(ids)) {
        ids = ids.map(id => parseInt(id, 10));
    }

    const categoriasHabilitadas = [];
    try{
        connection = await pool.getConnection();
        for (let i = 0; i < ids.length; i++) {
            const idSub = ids[i];
            await connection.query(`CALL deshabilitarCategorias(?)`, [idSub]);
        
            const [rows] = await connection.query(`SELECT nombre FROM categoriaTiendas WHERE id = ?`, [idSub]);
            if (rows.length > 0) {
                categoriasHabilitadas.push(rows[0].nombre);
            }
        
        }
    res.status(200).json({ message: 'Categorías deshabilitadas correctamente', categorias: categoriasHabilitadas });
    }catch(error){
        next(error)
    }finally {
        if (connection){
            connection.release();
        }
    }
}

const getTopCategoriasAsist= async (req, res) => {

    const startDate = req.query.startDate ? parseDate(req.query.startDate) : null;
    const endDate = req.query.endDate ? parseDate(req.query.endDate) : null;

    console.log('getTopCategoriassAsist - query: ');

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
                    ct.nombre AS nombre_categoria,
                    COUNT(e.id) AS cantidad_escaneos
                FROM
                    categoriaTiendas ct
                        LEFT JOIN locatarios l ON ct.id = l.fidCategoriaTienda
                        LEFT JOIN escaneos e ON e.tipo = 'tienda' AND e.fidReferencia = l.id AND e.ultimoEscaneo BETWEEN :startDate AND :endDate
                GROUP BY
                    ct.id
                ORDER BY
                    cantidad_escaneos  DESC
                    LIMIT 10`, {
                replacements: { startDate, endDate },
                type: QueryTypes.SELECT
            });
        console.log("resultados topTiendas Asitencias")
        console.log(escaneo)
        return res.status(200).json({ resultado: escaneo, newToken: req.newToken });
    } catch (error) {
        console.log('getTopCategoriassAsist - queryType: - [Error]: ', error);
        return res.status(500).send('Internal Server Error');
    }
}
const getBottomCategoriasAsist= async (req, res) => {

    const startDate = req.query.startDate ? parseDate(req.query.startDate) : null;
    const endDate = req.query.endDate ? parseDate(req.query.endDate) : null;

    console.log('getTopCategoriassAsist - query: ');

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
                    ct.nombre AS nombre_categoria,
                    COUNT(e.id) AS cantidad_escaneos
                FROM
                    categoriaTiendas ct
                        LEFT JOIN locatarios l ON ct.id = l.fidCategoriaTienda
                        LEFT JOIN escaneos e ON e.tipo = 'tienda' AND e.fidReferencia = l.id AND e.ultimoEscaneo BETWEEN :startDate AND :endDate
                GROUP BY
                    ct.id
                ORDER BY
                    cantidad_escaneos  ASC
                    LIMIT 10`, {
                replacements: { startDate, endDate },
                type: QueryTypes.SELECT
            });
        console.log("resultados topTiendas Asitencias")
        console.log(escaneo)
        return res.status(200).json({ resultado: escaneo, newToken: req.newToken });
    } catch (error) {
        console.log('getTopCategoriassAsist - queryType: - [Error]: ', error);
        return res.status(500).send('Internal Server Error');
    }
}
module.exports = {
    getCategoriaTiendas,
    getCategoriaTiendasWeb,
    crearCategoriaTiendaWeb,
    editarCategoriaTiendaWeb,
    habilitarCategoria,
    deshabilitarCategoria,
    getTopCategoriasAsist,
    getBottomCategoriasAsist
};