// Importing modules
const db = require("../models");
const {getSignUrlForFile} = require("../config/s3");
require('dotenv').config();
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'dp2-database.cvezha58bpsj.us-east-1.rds.amazonaws.com',
      port: 3306,
      user: 'administrador',
      password: 'contrasenia',
      database: 'plaza'
      });
const CategoriaTienda = db.categoriaTiendas;
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
                    limit: pageSize
                }),
                CategoriaTienda.count({
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
                        activo: 1,
                        nombre: { [Op.like]: `%${queryType}%` }
                    },
                    offset: offset,
                    limit: pageSize
                }),
                CategoriaTienda.count({
                    where: {
                        activo: 1,
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
    const idCategoria = parseInt(req.body.IDcategoria);

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

module.exports = {
    getCategoriaTiendas,
    getCategoriaTiendasWeb,
    crearCategoriaTiendaWeb,
    editarCategoriaTiendaWeb
};