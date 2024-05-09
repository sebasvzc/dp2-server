//importing modules
const jwt = require("jsonwebtoken");
const db = require("../models");
require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const WebSocket = require("ws");
const crypto = require("crypto");
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'dp2-database.cvezha58bpsj.us-east-1.rds.amazonaws.com',
      port: 3306,
      user: 'administrador',
      password: 'contrasenia',
      database: 'plaza'
      });
const { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY } = process.env;
const AWS = require('aws-sdk');

// Configura las credenciales de AWS
AWS.config.update({
  accessKeyId: 'ASIA3VZIIXMJMUZ5EZMB',
  secretAccessKey: 'hWTzZh2QelqLDiPL4Or02M/G1HyWN2xTSRdTwGz8',
  sessionToken: 'IQoJb3JpZ2luX2VjEKP//////////wEaCXVzLXdlc3QtMiJHMEUCICCaIVOn0pQ4+6Q8D5PsYd+eOF6r9tuvNsDq3OUNXZJTAiEAkap8PI7hx9YysvKORqxG871/m4DGHDq6JvJvC9fsohoquQII/P//////////ARAAGgw4MDI3MDY0NzE2OTgiDNEJdKSMRQnK0PUI9yqNAupdPE6DLiNGN6g3FcyhlP4CLo9TW2MrQ92jZta8tAtLOKNn75lnyEx3YenOTgaktViC4ZhgBThK7q7XjXSxlVSAoXhUzVQKZmpp/6fKBwTuYNIpAa+/yGBiWRxXFMF4Mtp+MTUBi0uAAV6Fkq7cWl3veCJPI3tGcjvzQ62KYe0BFJbKhjJQYD5qrQyL0x0KzfhqaotWYOMzbEOCFYjcts6t0hNlJswSMMXQVsEjfVrshBOmOhlbZnBojfI5AH2pUItCshKtx2NPikekMYu9AsbTy3N0/hAkXZIPjTaO2oW0qhe16TVRKyw7SUY00VJ6PUTPDK+erxOIdKbc1KYm9g7MPzs+z8Bi4eXsCPNrMLTn8LEGOp0B/cQjbMlZyuhIL04zW7KPyd7eLoan/Jx6hy+zLtgb8rQO6s3nQUEXpjpDWa7cvitOHJgO6iktWjJfEMKOcX8z/Keu+VWlickgCZV2ZFUkz7L6sYvZPoj9g73a2KoLJOFaMHflrezIugv/dXJ3nZr09LCLhC9Qy7IddHUfOjnUZ7X46b+qsLmDkKHRZk43LiHVDSrGoiTspYYc2gzpSQ==',
  region: 'us-east-1' // La región donde está tu bucket
});

// Crea un nuevo objeto S3
const s3 = new AWS.S3();


// Assigning users to the variable User
const Client = db.clients;

const broadcast = (clients, method, message) => {
    if(clients){
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                console.log('[SERVER] broadcast(',method,'): ', JSON.stringify(message));
                const data = {
                    id: message.id,
                    userName: message.userName,
                    email: message.email,
                    password: message.password,
                    role: message.role,
                    updatedAt: message.updatedAt,
                    createdAt: message.createdAt,
                    method: method
                }
                client.send(JSON.stringify(data), (err) => {
                    if(err){
                        console.log(`[SERVER] error:${err}`);
                    }
                });
            }
        })
    }
}

//login authentication
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        //find a user by their email
        const client = await Client.findOne({ where: { email: email } });
        // Encriptar la contraseña proporcionada con MD5
        const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
        //if user email is found, compare password
        if (client) {

            // console.log(password);
            // console.log(client.contrasenia);
            const isSame = hashedPassword === client.contrasenia;
            if (isSame) {
                console.log("El usuario si existe y su contrasenia esta bien")
                const accessToken = jwt.sign(
                    { email: client.email },
                    ACCESS_TOKEN_SECRET,
                    { expiresIn: ACCESS_TOKEN_EXPIRY }
                );
                const refreshToken = jwt.sign(
                    {email: client.email},
                    REFRESH_TOKEN_SECRET,
                    { expiresIn: REFRESH_TOKEN_EXPIRY }
                );
                res.status(200).send({
                    token: accessToken,
                    refreshToken: refreshToken,
                    clienteId: client.id,
                    code:"0"
                });
            } else {
                console.log("El usuario existe pero no es su contraseña")
                return res.status(401).send({message:"Authentication failed: El usuario existe pero no es su contraseña", code:"2"});
            }
        } else {
            console.log("Auth failed, nop hay usuario relacionadao")
            return res.status(401).send({message:"Authentication failed: El usuario no existe", code:"1"});
        }
    } catch (error) {
        console.log('login - [Error]: ', error);
    }
}


//signing a user up
//hashing users password before its saved to the database
const signup = async (req, res) => {
    console.log("viendo Signup")
    try {
        const { nombre, email, apellidoPaterno, apellidoMaterno, telefono,contrasenia, genero, fechaNacimiento} = req.body;
        const data = {
            nombre,
            email,
            apellidoPaterno,
            apellidoMaterno,
            telefono,
            contrasenia:crypto.createHash('md5').update(contrasenia).digest('hex'),
            genero,
            fechaNacimiento,
            activo:1,
            puntos:0
        };
        //saving the user
        const client = await Client.create(data);
        //if user details is captured
        //generate token with the user's id and the secretKey in the env file
        // set cookie with the token generated
        if (client) {
            let token = jwt.sign(
                { id: client.id},
                REFRESH_TOKEN_SECRET,
                { expiresIn: REFRESH_TOKEN_EXPIRY }
            );
            res.cookie("jwt", token, { maxAge: 1 * 24 * 60 * 60, httpOnly: true });
            console.log("client", JSON.stringify(client, null, 2));
            console.log(token);
            //send users details
            //broadcast(req.app.locals.clients, 'signup', user);
            return res.status(200).send(client);
        } else {
            return res.status(400).send("Invalid request body");
        }
    } catch (error) {
        console.log('signup - [Error]: ', error);
    }
}
const comprobarTokenRegistroUsuario = async (req, res) => {

    try {
        console.log("entre a comprobar")

        console.log(req.body)
        const { tokenReg} = req.body;
        jwt.verify(tokenReg, 'secretKey', (err, decoded) => {
            if (err) {
                console.log(err)
                if (err.name === 'TokenExpiredError') {
                    console.log('Access denied. Token expired.');

                } else {
                    return res.status(403).send('Access denied. Invalid token.');
                }
            } else {
                console.log(decoded.email)
            }
        });
    } catch (error) {
        console.log( error);
    }
}
const getUser = async (req, res) => {
    var queryType = req.query.query;
    console.log('getUser - query: ', req.query.query);
    if (!queryType) {
        console.log("Requested item wasn't found!, ?query=xxxx is required!");
        return res.status(409).send("?query=xxxx is required! NB: xxxx is all / email");
    }
    try {
        if (queryType == 'all') {
            const users = await User.findAll({
                attributes: { exclude: ['password'] },
                where: {
                    role: {[Op.not]: 'admin'}
                }
            });
            if (users) {
                return res.status(200).json({ users, newToken: req.newToken });
            } else {
                return res.status(400).send("Invalid request body");
            }
        } else {
            const user = await User.findOne({
                where: {
                    email: queryType//{[Op.like]: queryType+'%'}
                },
                attributes: { exclude: ['password'] }
            });
            if (user) {
                return res.status(200).json({ users, newToken: req.newToken });
            } else {
                return res.status(200).send("Email no encontrado");
            }
        }
    } catch (error) {
        console.log('getUser - queryType:', queryType, ' - [Error]: ', error);
    }
}

const updateUser = async (req, res) => {
    var updateItem = req.params.email;
    console.log('updateUser - updateItem: ', updateItem);
    const { userName, email, password, role } = req.body;
    try {
        const user = await User.findOne({
            where: {
                email: updateItem
            }
        });
        if (!user) {
            return res.status(409).send("Requested "+updateItem+" wasn't found!");
        }
        const checkSameUser = await User.findOne({
            where: {
                email: user.email
            }
        });
        if (checkSameUser && updateItem != user.email) {
            return res.status(403).send("Requested "+email+" is duplicate, please change and retry it.");
        }
        await User.update(
            {
                userName: userName,
                email: email,
                password: password,
                role: role
            },
            {
                where: { email: updateItem }
            }
        );
        const findUser = await User.findOne({
            where: {
                email: email
            },
            attributes: { exclude: ['password'] }
        });
        broadcast(req.app.locals.clients, 'update', findUser);
        return res.status(200).send(findUser);

    } catch (error) {
        console.log('updateUser - updateItem:', updateItem, ' - [Error]: ', error)
    }
}

const deleteUser = async (req, res) => {
    const email = req.params.email;
    try {
        const user = await User.findOne({
            where: { email: email }
        });
        if (!user) {
            return res.status(409).send("Requested " + email + " wasn't found!");
        } else {
            await user.destroy();
            broadcast(req.app.locals.clients, 'delete', user);
            return res.status(200).send("OK");
        }
    } catch (error) {
        console.log('deleteUser - email:', email, ' - [Error]: ', error)
    }
}

const getMisCupones = async (req, res) => {
    console.log("Req ", req.query, req.body)
    const { page = 0, size = 5 } = req.query;
    let { idCliente, usado, categorias, orderBy, orden } = req.body;

    var options = {
        limit: +size,
        offset: (+page) * (+size),
        attributes: ['id', 'fidCupon', 'fechaCompra', 'usado'],
        required: true,
        include: [
            {
                model: db.cupones,
                association: 'cupon',
                attributes: ['codigo', 'sumilla', 'descripcionCompleta', 'fechaExpiracion', 'terminosCondiciones', 'costoPuntos','rutaFoto'],
                required: true,
                include: [
                    {
                        model: db.locatarios,
                        association: 'locatario',
                        attributes: ['id','nombre', 'descripcion', 'locacion','rutaFoto'],
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
                ]
            }
        ],
        where: {
            fidCliente: idCliente,
            usado: usado,
            activo: 1
        }
    }

    if (!categorias || categorias.length === 0) {
        options.include[0].include[0].include[0].where = {}; // Vaciar el objeto where
    } else {
        options.include[0].include[0].include[0].where = {id: categorias};
    }


    if(orden !== "ASC" && orden != "DESC"){
        orden = "ASC";
    }

    if (orderBy === 'fechaCompra') {
        console.log('hola')
        options.order = [['fechaCompra', orden]];
    } else{
        if (orderBy === 'fechaExpiracion') {
            options.order = [[db.Sequelize.literal("`cupon.fechaExpiracion`") , orden]];
        } else{
            if (orderBy === 'categoria') {
                options.order = [[db.Sequelize.literal("`cupon.locatario.categoriaTienda.nombre`"), orden]];
            }else{
                if (orderBy === 'puntos') {
                        options.order = [[db.Sequelize.literal("`cupon.costoPuntos`"), orden]];
                    }
            }
        } 
    } 

    const { count, rows: misCupones } = await db.cuponXClientes.findAndCountAll(options);

    /*
    console.log('data conseguida');
    console.log({total:count, cupones: misCupones })
    res.json({total:count, cupones: misCupones });*/
    // Formatear los datos para eliminar los campos [Object] y [cupones]
    const formattedCupones = misCupones.map(cupon => {

        const key = `tienda${cupon.cupon.locatario.id}.jpg`;

                // Genera la URL firmada para el objeto en el bucket appdp2
                const url = s3.getSignedUrl('getObject', {
                    Bucket: 'appdp2',
                    Key: key,
                    Expires: 8600 // Tiempo de expiración en segundos
                });


        const key2 = `cupon${cupon.fidCupon}.jpg`;
        const url2 = s3.getSignedUrl('getObject', {
            Bucket: 'appdp2',
            Key: key2,
            Expires: 8600
    });
    return{
        id: cupon.id,
        fidCupon: cupon.fidCupon,
        fechaCompra: cupon.fechaCompra,
        usado: cupon.usado,

        cuponCodigo: cupon.cupon.codigo,
        cuponSumilla: cupon.cupon.sumilla,
        cuponDescripcionCompleta: cupon.cupon.descripcionCompleta,
        cuponFechaExpiracion: cupon.cupon.fechaExpiracion,
        cuponTerminosCondiciones: cupon.cupon.terminosCondiciones,
        cuponCostoPuntos: cupon.cupon.costoPuntos,
        cuponRutaFoto: url2,
            
        locatarioNombre: cupon.cupon.locatario.nombre,
        locatarioDescripcion: cupon.cupon.locatario.descripcion,
        locatarioLocacion: cupon.cupon.locatario.locacion,
        locatarioRutaFoto: url,
                
        categoriaTiendaNombre: cupon.cupon.locatario.categoriaTienda.nombre
    };
    });

    console.log('data conseguida');
    //console.log({total: count, cupones: formattedCupones});
    res.json({total: count, cupones: formattedCupones})
};





const getCuponesEstado = async (req, res,next) => {
    let connection;
    try{
        const {id_cliente, estadoCupon} = req.params
        connection = await pool.getConnection();
        const [result] = await connection.query(`CALL cuponesXclienteUsados(?,?,@cantidad)`,[1,"Disponible"])
        
        const [row] = await connection.query('SELECT @cantidad AS cantidad')
        const cantidad = row[0].cantidad

        const [cuponesObtenidos] = result;
   
        const respuesta = {
            total: cantidad,
            cupones: cuponesObtenidos.map(cupon => {
                const key = `tienda${cupon.fidLocatario}.jpg`;

                // Genera la URL firmada para el objeto en el bucket appdp2
                const url = s3.getSignedUrl('getObject', {
                    Bucket: 'appdp2',
                    Key: key,
                    Expires: 8600 // Tiempo de expiración en segundos
                });


                const key2 = `cupon${cupon.fidCupon}.jpg`;

                // Genera la URL firmada para el objeto en el bucket appdp2
                const url2 = s3.getSignedUrl('getObject', {
                    Bucket: 'appdp2',
                    Key: key2,
                    Expires: 8600 // Tiempo de expiración en segundos
                });

              return {
                id: cupon.id,
                fidCupon: cupon.fidCupon,
                cupon: {
                  codigo: cupon.codigo,
                  urltienda: url,
                  urlcupon: url2,
                  fidLocatario: cupon.fidLocatario,
                  imagenTienda: cupon.imagenTienda,
                  ubicacionTienda: cupon.ubicacionTienda,
                  sumilla: cupon.sumilla,
                  descripcionCompleta: cupon.descripcionCompleta,
                  fechaExpiracion: cupon.fechaExpiracion,
                  terminosCondiciones: cupon.terminosCondiciones,
                  costoPuntos: cupon.costoPuntos,
                  rutaFoto: cupon.rutaFoto
                }
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
    login,
    signup,
    getUser,
    updateUser,
    deleteUser,
    getCuponesEstado,
    getMisCupones
};