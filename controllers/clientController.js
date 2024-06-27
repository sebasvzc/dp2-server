//importing modules
const jwt = require("jsonwebtoken");
const KNN = require('ml-knn');
const db = require("../models");
require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const WebSocket = require("ws");
const crypto = require("crypto");
const mysql = require('mysql2/promise');
const natural = require('natural');
const TfIdf = natural.TfIdf;
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
const { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY } = process.env;
const { AWS_ACCESS_KEY, AWS_ACCESS_SECRET, AWS_S3_BUCKET_NAME, AWS_SESSION_TOKEN } = process.env;
// USADO PARA LEER LO QUE SE ENCUENTRA DENTRO DEL S3
const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_ACCESS_SECRET,
    sessionToken: AWS_SESSION_TOKEN,
    region: 'us-east-1' // La región donde está tu bucket
  });

const s3 = new AWS.S3();


// Assigning users to the variable User
const Client = db.clients;
const Locatario = db.locatarios;
const CategoriaTienda = db.categoriaTiendas;
const Cupon = db.cupones;
const Evento = db.eventos;
const CuponXCliente = db.cuponXClientes;
const EventoXCliente = db.eventoXClientes;
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
            console.log(client)
            if(client.activo){
                // console.log(password);
                // console.log(client.contrasenia);
                const isSame = hashedPassword === client.contrasenia;
                if (isSame) {
                    console.log("El usuario si existe y su contrasenia esta bien")
                    const accessToken = jwt.sign(
                        { email: client.email,id: client.id  },
                        ACCESS_TOKEN_SECRET,
                        { expiresIn: ACCESS_TOKEN_EXPIRY }
                    );
                    const refreshToken = jwt.sign(
                        {email: client.email,id: client.id },
                        REFRESH_TOKEN_SECRET,
                        { expiresIn: REFRESH_TOKEN_EXPIRY }
                    );
                    res.status(200).send({
                        token: accessToken,
                        refreshToken: refreshToken,
                        clienteId: client.id,
                        puntos: client.puntos,
                        code:"0"
                    });
                } else {
                    console.log("El usuario existe pero no es su contraseña")
                    return res.status(401).send({message:"Authentication failed: El usuario existe pero no es su contraseña", code:"2"});
                }
            }else{
                return res.status(401).send({message:"Login Fallo: El usuario no esta habilitado", code:"1"});
            }

        } else {
            console.log("Auth failed, nop hay usuario relacionadao")
            return res.status(401).send({message:"Authentication failed: El usuario no existe", code:"1"});
        }
    } catch (error) {
        console.log('login - [Error]: ', error);
    }
}
const getClientData = async (req, res) => {
    const token = req.headers['authorization'];
    const refreshToken = req.headers['refresh-token'];
    console.log(token)
    console.log(refreshToken)
    // console.log(req.query.query)
    const tokenSinBearer = token.substring(7); // Comienza desde el índice 7 para omitir "Bearer "
    const refreshTokenSinBearer = refreshToken.substring(7);
    jwt.verify(refreshTokenSinBearer, REFRESH_TOKEN_SECRET, async (err, decoded) => {

        if (err) {
            if (err.name === 'TokenExpiredError') {
                console.log('Access denied. Access Token expired.');

                return res.status(403).send('Access denied. Invalid token.');
            }
        }else{
            const findClient = await Client.findOne({
                where: {
                    id: decoded.id,

                },
                attributes: {exclude: ['contrasenia']}
            });
            if(findClient){

                if(findClient.activo){
                    return res.status(200).send(findClient);
                }else{
                    console.log('Access denied. Client not active in db.');
                    return res.status(403).send('Access denied. Client not active in db.');
                }

            }else{
                console.log('Access denied. Client not found in db.');
                return res.status(403).send('Access denied. Client not found in db.');

            }
        }
    });

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

            const accessToken = jwt.sign(
                { email: client.email,id: client.id  },
                ACCESS_TOKEN_SECRET,
                { expiresIn: ACCESS_TOKEN_EXPIRY }
            );
            const refreshToken = jwt.sign(
                {email: client.email,id: client.id },
                REFRESH_TOKEN_SECRET,
                { expiresIn: REFRESH_TOKEN_EXPIRY }
            );
            console.log("client", JSON.stringify(client, null, 2));

            //send users details
            //broadcast(req.app.locals.clients, 'signup', user);

            return res.status(200).json({ client: client, token: accessToken, refreshToken:refreshToken});
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

const disableClient = async (req, res) => {
    const idsClientes = req.body.selected;  // Esperamos un array de IDs

    if (!idsClientes || idsClientes.length === 0) {
        return res.status(400).send({ message: "No se ha proporcionado una lista de IDs válida.", code: 1 });
    }

    try {
        // Encuentra todos los clientes que corresponden a los IDs proporcionados
        const clientes = await db.clients.findAll({
            where: {
                id: idsClientes
            }
        });

        if (clientes.length === 0) {
            return res.status(404).send({ message: "Ninguno de los clientes especificados existe.", code: 2 });
        }

        const idsEncontrados = clientes.map(cliente => cliente.id);
        const noEncontrados = idsClientes.filter(id => !idsEncontrados.includes(id));

        // Registrar los IDs de los clientes que no se encontraron
        if (noEncontrados.length > 0) {
            console.log("Clientes no encontrados:", noEncontrados);
        }

        // Actualizar el atributo 'activo' del cliente de 1 a 0
        
        await db.clients.update({ activo: 0 }, {
            where: { id: idsEncontrados }
        });

        // Verificar cuántos registros fueron realmente actualizados
        if (actualizados[0] === 0) {
            return res.status(404).send({ message: "Ninguno de los clientes encontrados necesitaba ser desactivado.", code: 3 });
        }

        return res.status(200).send({
            message: "Clientes deshabilitados correctamente.",
            code: 0,
            noEncontrados: noEncontrados  // Opcionalmente devolver los IDs no encontrados
        });

    } catch (error) {
        console.error("Error al deshabilitar clientes:", error);
        return res.status(500).send({ message: "Error interno al intentar deshabilitar los clientes.", code: 4 });
    }
}

const ableClient = async (req, res) => {
    const idsClientes = req.body.selected;  // Esperamos un array de IDs

    if (!idsClientes || idsClientes.length === 0) {
        return res.status(400).send({ message: "No se ha proporcionado una lista de IDs válida.", code: 1 });
    }

    try {
        // Encuentra todos los clientes que corresponden a los IDs proporcionados
        const clientes = await db.clients.findAll({
            where: {
                id: idsClientes
            }
        });

        if (clientes.length === 0) {
            return res.status(404).send({ message: "Ninguno de los clientes especificados existe.", code: 2 });
        }

        const idsEncontrados = clientes.map(cliente => cliente.id);
        const noEncontrados = idsClientes.filter(id => !idsEncontrados.includes(id));

        // Registrar los IDs de los clientes que no se encontraron
        if (noEncontrados.length > 0) {
            console.log("Clientes no encontrados:", noEncontrados);
        }

        // Deshabilitar sólo los clientes que fueron encontrados y están activos
        await db.clients.update({ activo: 1 }, {
            where: { id: idsEncontrados }
        });
        // Verificar cuántos registros fueron realmente actualizados
        if (actualizados[0] === 0) {
            return res.status(404).send({ message: "Ninguno de los clientes encontrados necesitaba ser activado.", code: 3 });
        }

        return res.status(200).send({
            message: "Clientes habilitados correctamente.",
            code: 0,
            noEncontrados: noEncontrados  // Opcionalmente devolver los IDs no encontrados
        });

    } catch (error) {
        console.error("Error al habilitar clientes:", error);
        return res.status(500).send({ message: "Error interno al intentar habilitar los clientes.", code: 4 });
    }
}

const modificarClient = async (req, res) => {
    const {idCliente, ...camposActualizados } = req.body;
    try {
        // Primero, encontramos al cliente para asegurarnos de que existe
        const client = await db.clients.findOne({
            where: { id: idCliente }
        });

        // Si el cliente no existe, devolvemos un error
        if (!client) {
            return res.status(404).send({estado:"El cliente " + idCliente + " no existe"});
        }

        // Actualizar el atributo 'activo' del cliente de 1 a 0
        await db.clients.update(camposActualizados, {
            where: { id: idCliente }
        });

        // Enviar una respuesta exitosa
        return res.status(200).send({estado:"El cliente " + idCliente + " ha sido modificado"});

    } catch (error) {
        return res.status(500).send({estado:"Ha ocurrido un error intentando modificar al cliente"});
    }
}

const getMisCupones = async (req, res) => {
    console.log("Req ", req.query, req.body)
    const { busqueda, page = 0, size = 5 } = req.query;
    let { idCliente, usado, categorias, orderBy, orden } = req.body;

    var options = {
        limit: +size,
        offset: (+page) * (+size),
        attributes: ['id', 'fidCupon', 'fechaCompra', 'usado','cantidad', 'cantidadHistorica'],
        required: true,
        include: [
            {
                model: db.cupones,
                association: 'cupon',
                attributes: ['codigo', 'sumilla', 'descripcionCompleta', 'fechaExpiracion', 'terminosCondiciones', 'costoPuntos',
                    'esLimitado','rutaFoto'],
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

    if(busqueda != ""){
        //...buscar por texto en "sumilla" en cupon
        options.include[0].include[0].where = {
            [Op.or]: [
                {
                    '$cupon.sumilla$': {
                        [Op.like]: `%${busqueda}%` // Buscar sumilla que contenga el texto especificado
                    }
                },
                {
                    nombre: {
                        [Op.like]: `%${busqueda}%` // Buscar nombre de locatario que contenga el texto especificado
                    }
                }
            ]
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

    const orderCriteria = [];
    if (orderBy === 'fechaCompra') {
        orderCriteria.push(['fechaCompra', orden]);
    } else if (orderBy === 'fechaExpiracion') {
        orderCriteria.push([db.Sequelize.literal("`cupon.fechaExpiracion`"), orden]);
    } else if (orderBy === 'categoria') {
        orderCriteria.push([db.Sequelize.literal("`cupon.locatario.categoriaTienda.nombre`"), orden]);
    } else if (orderBy === 'puntos') {
        orderCriteria.push([db.Sequelize.literal("`cupon.costoPuntos`"), orden]);
    }
    // Añadir el criterio de orden por fidCupon como secundario
    orderCriteria.push(['fidCupon', 'ASC']);

    options.order = orderCriteria;

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

        var cantidadActual = cupon.cupon.esLimitado 
            ? cupon.cantidad 
            : (usado ? cupon.cantidadHistorica-cupon.cantidad : cupon.cantidad );

    return{
        id: cupon.id,
        fidCupon: cupon.fidCupon,
        cantidad: cupon.cantidad,
        fechaCompra: cupon.fechaCompra,
        //usado: cupon.usado,

        //cuponCodigo: cupon.cupon.codigo,
        cuponSumilla: cupon.cupon.sumilla,
        cuponDescripcionCompleta: cupon.cupon.descripcionCompleta,
        cuponFechaExpiracion: cupon.cupon.fechaExpiracion,
        cuponTerminosCondiciones: cupon.cupon.terminosCondiciones,
        cuponCostoPuntos: cupon.cupon.costoPuntos,
        esLimitado: cupon.cupon.esLimitado,
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





//PRUEBITA DE FUNCIONALIDAD
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

const listarClientesActivos = async (req, res) => {
    const { active, searchText, id } = req.body; // Obtener desde el cuerpo
    const page = parseInt(req.query.page) || 1; // Página actual, default 1
    const pageSize = parseInt(req.query.pageSize) || 6; // Tamaño de página, default 10
    const offset = (page - 1) * pageSize; // Calcular el offset

    try {
        const whereConditions = {};

        if (id && id > 0) {
            // Si se recibe un id válido, agregarlo a las condiciones de búsqueda
            whereConditions.id = id;
        } else {
            if (active != undefined && (active == 1 || active == 0)) {
                whereConditions.activo = active; // Se incluyen clientes basados en el estado activo solicitado
            }

            if (searchText) {
                whereConditions[Op.or] = [
                    { nombre: { [Op.like]: `%${searchText}%` } },
                    { apellidoPaterno: { [Op.like]: `%${searchText}%` } },
                    { apellidoMaterno: { [Op.like]: `%${searchText}%` } },
                    { telefono: { [Op.like]: `%${searchText}%` } },
                    { email: { [Op.like]: `%${searchText}%` } }
                ];
            }
        }

        // Encontrar todos los clientes según los criterios de búsqueda y paginación
        const clientes = await db.clients.findAll({
            where: whereConditions,
            attributes: { exclude: ['contrasenia', 'createdAt', 'updatedAt', 'usuarioCreacion', 'usuarioActualizacion'] },
            limit: pageSize,
            offset: offset
        });

        // Contar la cantidad total de clientes según los criterios
        const totalClientes = await db.clients.count({ where: whereConditions });

        // Calcular el número total de páginas
        const totalPages = Math.ceil(totalClientes / pageSize);
        console.log("clientes" , clientes);
        console.log("totalPages",clientes);
        // Enviar la lista de clientes activos junto con la información de paginación como respuesta
        return res.status(200).json({
            clientes,
            totalPages,
            totalClientes
        });

    } catch (error) {
        // En caso de error, enviar un mensaje de error al cliente
        return res.status(500).send({ estado: "Ha ocurrido un error intentando listar los clientes activos" });
    }
}
const listarCuponesXClientes = async (req, res) => {
    var idParam = parseInt(req.query.idParam); // IdParam es el id del cliente
    const startDate = req.query.startDate ? parseDate(req.query.startDate) : null;
    const endDate = req.query.endDate ? parseDate(req.query.endDate) : null;

    console.log('getCuponesXCliente - query: ', req.query.idParam, startDate, endDate);
    if (!idParam) {
        console.log("Requested item wasn't found!, ?query=xxxx is required!");
        return res.status(409).send("?query=xxxx is required! NB: xxxx is all / email");
    }
    if (!startDate || !endDate) {
        return res.status(400).send("startDate and endDate are required!");
    }
    console.log(startDate);
    console.log(endDate);
    try {
        // Obtener cupones agrupados solo por fecha
        const cuponesGroupedByDate = await CuponXCliente.findAll({
            where: {
                fidCliente: idParam,
                fechaCompra: {
                    [db.Sequelize.Op.between]: [startDate, endDate]
                }
            },
            attributes: [
                [db.sequelize.literal(`DATE_FORMAT(cuponXCliente.fechaCompra, '%b %Y')`), 'fechaMesAnio'],
                [db.sequelize.fn('COUNT', db.sequelize.col('cuponXCliente.id')), 'cantidad'] // Contar el número de cupones por fecha
            ],
            group: [
                db.sequelize.literal(`DATE_FORMAT(cuponXCliente.fechaCompra, '%b %Y')`)
            ], // Agrupar solo por la fecha
            order: [
                [db.sequelize.fn('DATE', db.sequelize.col('cuponXCliente.fechaCompra')), 'ASC']
            ] // Ordenar por la fecha
        });

        // Verificar la estructura de los datos crudos
        console.log('Datos crudos:', JSON.stringify(cuponesGroupedByDate, null, 2));

        // Crear una estructura de fechas
        const cuponesPorFecha = {};
        const monthsRange = generarRangoMeses(startDate, endDate);

        monthsRange.forEach(month => {
            cuponesPorFecha[month] = 0;
        });

        cuponesGroupedByDate.forEach(cupon => {
            const fechaMesAnio = cupon.get('fechaMesAnio');
            const cantidad = cupon.get('cantidad');
            cuponesPorFecha[fechaMesAnio] = cantidad;
        });

        // Convertir la estructura en el formato deseado
        const resultado = monthsRange.map(month => ({
            fechaMesAnio: month,
            cantidad: cuponesPorFecha[month]
        }));

        return res.status(200).json({ cupones: resultado, newToken: req.newToken });

    } catch (error) {
        console.log('getCuponXDia - queryType: - [Error]: ', error);
        return res.status(500).send('Internal Server Error');
    }
};
const listarCuponesCategoriaRadar = async (req, res) => {
    var idParam = parseInt(req.query.idParam); // IdParam es el id del cliente
    const startDate = req.query.startDate ? parseDate(req.query.startDate) : null;
    const endDate = req.query.endDate ? parseDate(req.query.endDate) : null;

    console.log('getCuponesXClienteRadar - query: ', req.query.idParam, startDate, endDate);
    if (!idParam) {
        console.log("Requested item wasn't found!, ?query=xxxx is required! getCuponesXClienteRadar");
        return res.status(409).send("?query=xxxx is required! NB: xxxx is all / email");
    }
    if (!startDate || !endDate) {
        return res.status(400).send("startDate and endDate are required!");
    }
    console.log(startDate)
    console.log(endDate)
    try {
        // Obtener cupones agrupados por fecha y categoría
        const cuponesGroupedByCategory = await CuponXCliente.findAll({
            where: {
                fidCliente: idParam,
                fechaCompra: {
                    [db.Sequelize.Op.between]: [startDate, endDate]
                }
            },
            attributes: [
                [db.sequelize.col('cupon.locatario.categoriaTienda.nombre'), 'categoria'],
                [db.sequelize.fn('COUNT', db.sequelize.col('cuponXCliente.id')), 'cantidad'] // Contar el número de cupones por fecha
            ],
            include: [{
                model: Cupon,
                as: 'cupon',
                attributes: [], // No necesitamos atributos adicionales de Cupon
                include: [{
                    model: Locatario,
                    as: 'locatario',
                    attributes: [], // No necesitamos atributos adicionales de Locatario
                    include: [{
                        model: CategoriaTienda,
                        as: 'categoriaTienda',
                        attributes: ['nombre'] // Nombre de la categoría
                    }]
                }]
            }],
            group: [
                'cupon.locatario.categoriaTienda.id',
            ]
        });

        // Verificar la estructura de los datos crudos
        console.log('Datos crudos:', JSON.stringify(cuponesGroupedByCategory, null, 2));
        const resultado = {
            name: "Cliente 1",
            data: cuponesGroupedByCategory.map(cupon => cupon.get('cantidad')),
            categoria: cuponesGroupedByCategory.map(cupon => cupon.get('categoria'))
        };
        console.log(resultado)
        console.log("resultado")
        return res.status(200).json({ cupones: resultado, newToken: req.newToken });

    } catch (error) {
        console.log('getCuponesXClienteRadar - queryType: - [Error]: ', error);
        return res.status(500).send('Internal Server Error');
    }
}
const listarCuponesCanjeadosUsados= async (req, res) => {
    var idParam = parseInt(req.query.idParam); // IdParam es el id del cliente
    const startDate = req.query.startDate ? parseDate(req.query.startDate) : null;
    const endDate = req.query.endDate ? parseDate(req.query.endDate) : null;

    console.log('getCuponesXCliente - query: ', req.query.idParam, startDate, endDate);
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
        const cuponesCanjeados = await CuponXCliente.findAll({
            where: {
                fidCliente: idParam,
                fechaCompra: {
                    [db.Sequelize.Op.between]: [startDate, endDate]
                }
            },
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

        // Obtener cupones agrupados por fecha y categoría para cupones usados
        const cuponesUsados = await CuponXCliente.findAll({
            where: {
                fidCliente: idParam,
                fechaCompra: {
                    [db.Sequelize.Op.between]: [startDate, endDate]
                },
                usado: true
            },
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

        // Generar rango de meses
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

        const dataCanjeados = mapearCupones(cuponesCanjeados);
        const dataUsados = mapearCupones(cuponesUsados);

        // Crear la estructura final
        const resultado = [
            {
                variable: "Canjeado",
                data: dataCanjeados
            },
            {
                variable: "Usado",
                data: dataUsados
            }
        ];
        console.log("resultados canejado usados")
        console.log(resultado)
        return res.status(200).json({ cupones: resultado, newToken: req.newToken });
    } catch (error) {
        console.log('getCuponXDia - queryType: - [Error]: ', error);
        return res.status(500).send('Internal Server Error');
    }
}
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
const getEventosHoy = async (req, res,next) => {
    const page = parseInt(req.body.page) || 1; // Página actual, default 1
    const pageSize = parseInt(req.body.pageSize) || 3; // Tamaño de página, default 3
    const offset = (page - 1) * pageSize; // Calcular el offset
    const intentosMax =3;
    let intentos=0;
    let exito = false;
    let connection;
    while(intentos <= intentosMax && !exito){
    try{
        const {} = req.params
        connection = await pool.getConnection();
        const [total] = await connection.query(`CALL eventosHoyTotal(@cantidad)`)
        
        const [row] = await connection.query('SELECT @cantidad AS cantidad')
        const cantidad = row[0].cantidad

        const [result] = await connection.query(`CALL eventosHoyPaginacion(?,?)`,[pageSize,offset])
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

              return {
                idEvento: evento.idEvento,
                nombreEvento: evento.nombreEvento,
                nombreTienda:evento.nombreTienda,
                puntosOtorgados:evento.puntosOtorgados,
                urlEvento: urlEvento,
                urlTienda:urlTienda
              };
            })
          };
        res.status(200).json(respuesta);
        exito=true;
    }catch(error){
        intentos++;
        if(intentos>intentosMax){
            next(error);
        }else{
            console.error(`Intento ${intentos} fallido. Reviviendo...`, error)
        }
    }finally {
        if (connection){
            connection.release();
            }
        }
    }
};

const getEventoDetalle = async (req, res,next) => {
    let connection;
    const intentosMax =3;
    let intentos=0;
    let exito = false;
    while(intentos <= intentosMax && !exito){
    try{
        const {id_evento} = req.params
        connection = await pool.getConnection();
        const [result] = await connection.query(`CALL detalleEvento(?)`,[id_evento])
        
        const eventoDetallado   = result[0][0];
        
                const key = `evento${eventoDetallado.idEvento}.jpg`;

                // Genera la URL firmada para el objeto en el bucket appdp2
                const urlEvento = s3.getSignedUrl('getObject', {
                    Bucket: 'appdp2',
                    Key: key,
                    Expires: 8600 // Tiempo de expiración en segundos
                });

                eventoDetallado.urlEvento =  urlEvento 
                eventoDetallado.fechaInicio= eventoDetallado.fechaInicio.toISOString().split('T')[0];
                eventoDetallado.fechaFin=eventoDetallado.fechaFin.toISOString().split('T')[0];
                eventoDetallado.fechaInicio=`${eventoDetallado.fechaInicio.split('-')[2]}-${eventoDetallado.fechaInicio.split('-')[1]}-${eventoDetallado.fechaInicio.split('-')[0]}`;
                eventoDetallado.fechaFin=`${eventoDetallado.fechaFin.split('-')[2]}-${eventoDetallado.fechaFin.split('-')[1]}-${eventoDetallado.fechaFin.split('-')[0]}`;
       return res.status(200).json(eventoDetallado);
    }catch(error){
        next(error)
    }finally {
        if (connection){
            connection.release();
            }
        }
    }
}

const listarClients = async (req, res) => {
    const { active, searchText } = req.query;

    try {
        const whereConditions = {};

        if (active !== undefined) {
            whereConditions.activo = active;
        }
        if (searchText) {
            whereConditions[Op.or] = [
                { nombre: { [Op.like]: `%${searchText}%` } },
                { apellidoPaterno: { [Op.like]: `%${searchText}%` } },
                { apellidoMaterno: { [Op.like]: `%${searchText}%` } }
            ];
        }

        const clients = await Client.findAll({
            where: whereConditions,
            attributes: { 
                exclude: ['createdAt', 'updatedAt', 'usuarioCreacion', 'usuarioActualizacion']
            }
        });

        res.json(clients);
    } catch (error) {
        console.error('Error al listar los clientes:', error);
        res.status(500).send('Error interno del servidor');
    }
};

const verPermisoUsuario = async (req, res,next) => {
    let connection;
    try{
        const {id_cliente} = req.params
        connection = await pool.getConnection();
        const [result] = await connection.query(`CALL permisoCamaraVer(?,@resultado)`,[id_cliente])
        
        const [row] = await connection.query ('Select @resultado AS resultado')
        const resultado = row[0].resultado
        res.status(200).json(resultado);
    }catch(error){
        next(error)
    }finally {
        if (connection){
            connection.release();
        }
    }
}

const cambiarPermisoUsuario = async (req, res,next) => {
    let connection;
    const idCliente = parseInt(req.body.idCliente)
    const autoriza = parseInt (req.body.autoriza)
    try{

        connection = await pool.getConnection();
        const [result] = await connection.query(`CALL cambiarPermisoCamara(?,?,@resultado)`,[idCliente,autoriza])
        
        const [row] = await connection.query ('Select @resultado AS resultado')
        const resultado = row[0].resultado
        res.status(200).json(resultado);
    }catch(error){
        next(error)
    }finally {
        if (connection){
            connection.release();
        }
    }
}
// KNN PARA RECOMENDACIONS GENERALES PARA EL USUARIO BASANDONOS EN SU EDAD Y GENERO. PARA QUE NO TENGA
// SOLO RECOMENDACIONES DE LO QUE LE GUSTA
const IAKNNCompartido = async (req, res, next) =>{
    //Vamos a conseguir eventos de 4 formas  
    // Si es usuario nuevo en base al genero en el que se encuentra, en el que una le da mas enfasis (realizado)
    // al genero y otro le da mas enfasis a su edad (realizado)
    // en base a su id se buscara si tiene eventos a los que ha asistido para clasificar de forma mas particular
    // el recomendador

    let genero = req.body.genero || 'M'; // Enviame una M si es masculino, F si es femenino y una A si no es ninguno de esos casos
    let edad = parseInt(req.body.edad) || 27; // enviame la edad de la persona
    //const idUsuario = parseInt(req.body.idUsuario)|| 1; // mandame ID del usuario para analizar sus evento recien inscritos, por ahora irving es el especifico
    let connection;

    try{
      connection = await pool.getConnection();

    const [resultClient] = await connection.query(`CALL clientesActivos()`)
    const clientsGeneral = resultClient[0];

    


     const [result] = await connection.query(`CALL eventosHistoricosIA()`)
     const eventosHist = result[0];
     if(eventosHist.length== 0){
        res.status(200).json("No hay eventos historicos");
     }else{
     //Info de generos
     // Clasifica por 0,1,2 los generos que encuentre en los eventos historicos en este caso M de masculino
     // F de femenino y A de ambos, tienen un valor de 0 1 y 2 en ese orden
     const generos = [...new Set(eventosHist.map(evento => evento.generoPromedio))];
    const generoEncoder = generos.reduce((acc, val, idx) => ({ ...acc, [val]: idx }), {});

 //Clasifica los tipos de eventos encontrados
    const tiposEventos = [...new Set(eventosHist.map(evento => evento.tipoEvento))];
    const tipoEventoEncoder = tiposEventos.reduce((acc, val, idx) => ({ ...acc, [val]: idx }), {});
  
    //Info para edades, establezco valores del 0 al 1 para edades
    const edadPromedio = eventosHist.map(evento => evento.edadPromedio);
    const edadMin = Math.min(...edadPromedio);
    const edadMax = Math.max(...edadPromedio);
    const scaledEdadPromedio = edadPromedio.map(val => (val - edadMin) / (edadMax - edadMin));

    const datos = eventosHist.map(evento => [
        generoEncoder[evento.generoPromedio],(evento.edadPromedio - edadMin) / (edadMax - edadMin)
        
      ]);
      const etiquetas = eventosHist.map(evento => tipoEventoEncoder[evento.tipoEvento]);
   
    // Se viene clasificador
    const knn = new KNN(datos, etiquetas, { k: 5 });

    for ( const cliente of clientsGeneral){
        if (cliente.genero=="Masculino"){
            genero='M';
        }else if (cliente.genero=="Femenino"){
            genero='F'
        }else{
            genero='A'
        }
        edad = cliente.edad;

    const edadPromedioNuevo = (edad - edadMin) / (edadMax - edadMin);
    let generoPromedioNuevo = generoEncoder[genero]; 
    let generoPromedioNuevoExt = generoEncoder['A'];
    if(genero=='M'){
        generoPromedioNuevo = generoEncoder[genero]; 
        generoPromedioNuevoExt = generoEncoder['A'];
    }else if(genero=='F'){
         generoPromedioNuevo = generoEncoder[genero];
         generoPromedioNuevoExt = generoEncoder['A'];
    }else{
         generoPromedioNuevo = generoEncoder['A'];
         generoPromedioNuevoExt = generoEncoder['A'];

    }
    
    const datosPrediccion = [[generoPromedioNuevo,edadPromedioNuevo]];
    const datosPrediccionExt = [[generoPromedioNuevoExt,edadPromedioNuevo]];
    const prediccion = knn.predict(datosPrediccion);
    const prediccionExt = knn.predict(datosPrediccionExt);
    const tipoEventoPredicho = tiposEventos[prediccion[0]];
    const tipoEventoPredichoExt = tiposEventos[prediccionExt[0]];
    console.log("Predicción de tipo de evento", tipoEventoPredicho);
    console.log("Predicción de tipo de evento Adicional", tipoEventoPredichoExt);
    const [resultIA] = await connection.query(`CALL eventoRecomendadorIA(?)`,[tipoEventoPredicho])
    const eventoIA = resultIA[0][0];
    const [resultIAExt] = await connection.query(`CALL eventoRecomendadorIA(?)`,[tipoEventoPredichoExt])
    const eventoIAExt = resultIAExt[0][0];

    const [insertarIA] = await connection.query(`CALL insertarValoresIAEvento(?,?,?,?)`,[eventoIA.idEvento,cliente.idCliente,"basado en genero y edad",1])
   
};
   

    
    res.status(200).json("Todo OK");
}
  }catch(error){
     next(error)
  }finally {
     if (connection){
         connection.release();
        }
    }
}


// formula para funcion coseno
function cosineSimilarity(vectorA, vectorB) {
    const dotProduct = vectorA.reduce((sum, a, idx) => sum + a * vectorB[idx], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, val) => sum + val * val, 0));
    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
}

const IARecomendadorPersonalizado = async (req, res, next) =>{
    const idUsuario = parseInt(req.body.idUsuario)|| 1;
    let connection;

    try{
      connection = await pool.getConnection();
      // Me da los ultimos 5 eventos a los que se ha inscrito

    const [resultClient] = await connection.query(`CALL clientesActivos()`)
    const clientsGeneral = resultClient[0];


    
        // me da los eventos disponibles
     const [resultProximos] = await connection.query(`CALL OpcionesIAProxEventos()`)
     const eventosProximos = resultProximos[0];

     const [resultListaTipoEventos] = await connection.query(`CALL listaTiposEventos()`)
     const listaTipoEventos = resultListaTipoEventos[0];
     const listaArrayTipoEventos = listaTipoEventos.map(categoria => categoria.nombre);

     for ( const cliente of clientsGeneral){
     
     const [result] = await connection.query(`CALL IAUltimosEventosCumplidos(?)`,[cliente.idCliente])
     const eventosUsuario = result[0];
     console.log("Eventos al que inscribio usuario")
     console.log(eventosUsuario);

     console.log("Eventos al que puede ir usuario")
     console.log(eventosProximos);

     const documentosUsuario = eventosUsuario.map(evento => `${evento.descripcionEvento} ${evento.nombreTipoEvento} ${evento.nombreEvento}  `);
    const documentosProximos = eventosProximos.map(evento => `${evento.descripcionEvento} ${evento.tipoEvento} ${evento.nombreEvento} `);

    const tfidf = new TfIdf();
    documentosUsuario.concat(documentosProximos).forEach(doc => tfidf.addDocument(doc));
    console.log(documentosProximos);
    console.log(documentosUsuario);
    console.log("soy tifd");
    console.log(tfidf)
    console.log("soy tifd alguno");
    console.log(tfidf.documents[0].listTerms);
    
    // Calcular la similitud coseno
    const similitudes = [];
    eventosProximos.forEach((eventoProx, indexProx) => {
        let maxSimilitud = 0;
        eventosUsuario.forEach((eventoUser, indexUser) => {
            /*console.log("valor de evento prox: ")
            console.log(eventoProx);

            console.log("valor de evento index: ")
            console.log(indexProx);*/

            console.log("valor de evento usuario: ")
            console.log(eventoUser);

            console.log("valor de evento index usuario: ")
            console.log(indexUser);

            const vectorUser = tfidf.documents[indexUser]; // Verifica la nulidad de vectorUser
            const vectorProx = tfidf.documents[eventosUsuario.length + indexProx]; // Verifica la nulidad de vectorProx

            if (vectorUser && vectorProx) { // Verifica que ambos vectores no sean nulos
                const userTerms = Object.keys(vectorUser)
                .filter(key => vectorUser[key] !== undefined)
                .map(key => vectorUser[key]);
                const proxTerms = Object.keys(vectorProx)
                .filter(key => vectorProx[key] !== undefined)
                .map(key => vectorProx[key]);

                console.log("user termss");
                console.log(userTerms);
                console.log("user prox");
                console.log(proxTerms);
                const sim = cosineSimilarity(userTerms, proxTerms) * (eventoUser.asistencia? 1 : 0.9);
                if (sim > maxSimilitud) {
                    maxSimilitud = sim;
                }
            }else{
                console.log("gaa nulo")
            }
        });
        similitudes.push({ ...eventoProx, similitud: maxSimilitud });
    });
    let numero=2;
    // Ordenar los eventos por similitud de mayor a menor
    similitudes.sort((a, b) => b.similitud - a.similitud);
    const top3Similitudes = similitudes.slice(0, 3);
    for ( const similitud of top3Similitudes){
        const [insertarIA] = await connection.query(`CALL insertarValoresIAEvento(?,?,?,?)`,[similitud.idEvento,cliente.idCliente,"basado en gustos personales",numero])
        numero++;
    }

}

    res.status(200).json("Todo OK");
  }catch(error){
     next(error)
  }finally {
     if (connection){
         connection.release();
        }
    }

}
const listarEventosCategoria = async (req, res) => {
    var idParam = parseInt(req.query.idParam); // IdParam es el id del cliente
    const startDate = req.query.startDate ? parseDate(req.query.startDate) : null;
    const endDate = req.query.endDate ? parseDate(req.query.endDate) : null;

    console.log('getEventosXClienteRadar - query: ', req.query.idParam, startDate, endDate);
    if (!idParam) {
        console.log("Requested item wasn't found!, ?query=xxxx is required! getCuponesXClienteRadar");
        return res.status(409).send("?query=xxxx is required! NB: xxxx is all / email");
    }
    if (!startDate || !endDate) {
        return res.status(400).send("startDate and endDate are required!");
    }
    console.log(startDate)
    console.log(endDate)
    try {
        // Obtener cupones agrupados por fecha y categoría
        const eventosGroupedByCategory = await EventoXCliente.findAll({
            where: {
                fidCliente: idParam,
                '$eventocli.fechaInicio$': {
                    [db.Sequelize.Op.between]: [startDate, endDate]
                }
            },
            attributes: [
                [db.sequelize.col('eventocli.locatario.categoriaTienda.nombre'), 'categoria'],
                [db.sequelize.fn('COUNT', db.sequelize.col('eventocli.id')), 'cantidad'] // Contar el número de cupones por fecha
            ],
            include: [{
                model: Evento,
                as: 'eventocli',
                attributes: [], // No necesitamos atributos adicionales de Cupon
                include: [{
                    model: Locatario,
                    as: 'locatario',
                    attributes: [], // No necesitamos atributos adicionales de Locatario
                    include: [{
                        model: CategoriaTienda,
                        as: 'categoriaTienda',
                        attributes: ['nombre'] // Nombre de la categoría
                    }]
                }]
            }],
            group: [
                'eventocli.locatario.categoriaTienda.id',
            ]
        });

        // Verificar la estructura de los datos crudos
        console.log('Datos crudos: eventos por categ', JSON.stringify(eventosGroupedByCategory, null, 2));
        const resultado = {
            name: "Cliente 1",
            data: eventosGroupedByCategory.map(cupon => cupon.get('cantidad')),
            categoria: eventosGroupedByCategory.map(cupon => cupon.get('categoria'))
        };
        console.log(resultado)
        console.log("resultado")
        return res.status(200).json({ eventos: resultado, newToken: req.newToken });

    } catch (error) {
        console.log('getEventosXClienteRadar - queryType: - [Error]: ', error);
        return res.status(500).send('Internal Server Error');
    }
}


const getCuponesXCliente = async (req, res) => {
    var queryType = req.query.query;
    var idParam = parseInt(req.query.idParam);
    // console.log(req.query.query)
    const page = parseInt(req.query.page) || 1; // Página actual, default 1
    const pageSize = parseInt(req.query.pageSize) || 10; // Tamaño de página, default 10
    const offset = (page - 1) * pageSize;
    const startDate = req.query.startDate ? parseDate(req.query.startDate) : null;
    const endDate = req.query.endDate ? parseDate(req.query.endDate) : null;
    const startDateExp = req.query.startDateExp ? parseDate(req.query.startDateExp) : null;
    const endDateExp = req.query.endDateExp ? parseDate(req.query.endDateExp) : null;
    const idTienda = req.query.idTienda ? parseInt(req.query.idTienda) : null;
    const idCategoriaTienda = req.query.idCategoriaTienda ? parseInt(req.query.idCategoriaTienda) : null;
    console.log('getCuponesXCliente - idTienda: ', idTienda)
    console.log('getCuponesXCliente - idCategoriaTienda: ', idCategoriaTienda)
    console.log('getCuponesXCliente - query: ', req.query.query);
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
                        activo: true,
                        fidCliente: idParam,
                        fechaCompra: {
                            [db.Sequelize.Op.between]: [startDate, endDate]
                        }
                    },
                    include: [
                        {
                            model: Cupon,
                            as: 'cupon',
                            attributes: ["codigo","fechaExpiracion"] , // No necesitamos otros atributos del locatario para esta consulta
                            where: {
                                ...(startDateExp && endDateExp && {
                                    fechaExpiracion: {
                                        [db.Sequelize.Op.between]: [startDateExp, endDateExp]
                                    }
                                })
                            },
                            include:[{
                                model: Locatario,
                                as: 'locatario',
                                attributes: ["id","nombre"],
                                where: {
                                    ...(idTienda && { id: idTienda })
                                },
                                include:[{
                                    model: CategoriaTienda,
                                    as: 'categoriaTienda',
                                    attributes: ["id","nombre"],
                                    where: {
                                        ...(idCategoriaTienda && { id: idCategoriaTienda })
                                    }

                                }]
                            }]
                        }
                    ],

                    order: [
                        [db.sequelize.fn('DATE', db.sequelize.col('fechaCompra')), 'DESC']
                    ]
                }),
                CuponXCliente.count({
                    where: {
                        activo: true,
                        fidCliente: idParam,
                        fechaCompra: {
                            [db.Sequelize.Op.between]: [startDate, endDate]
                        }
                    },
                    include: [
                        {
                            model: Cupon,
                            as: 'cupon',
                            attributes: ["codigo","fechaExpiracion"] , // No necesitamos otros atributos del locatario para esta consulta
                            where: {
                                ...(startDateExp && endDateExp && {
                                    fechaExpiracion: {
                                        [db.Sequelize.Op.between]: [startDateExp, endDateExp]
                                    }
                                })
                            },
                            include:[{
                                model: Locatario,
                                as: 'locatario',
                                attributes: ["id","nombre"],
                                where: {
                                    ...(idTienda && { id: idTienda })
                                },
                                include:[{
                                    model: CategoriaTienda,
                                    as: 'categoriaTienda',
                                    attributes: ["id","nombre"],
                                    where: {
                                        ...(idCategoriaTienda && { id: idCategoriaTienda })
                                    }

                                }]
                            }]
                        }
                    ]

                })
            ]);
            const [cuponesXCliente, totalCount] = cuponesAndCount;
            return res.status(200).json({ cuponesXCliente, newToken: req.newToken,totalCupones:totalCount });
        } else {
            console.log("Estoy viendo algo que no es all")

        }
    } catch (error) {
        console.log('getCuponesXCliente - queryType:', queryType, ' - [Error]: ', error);
    }
}

const jugar = async (req, res) => {
    const tablaEscaneos = db.escaneos;
    const tablaClientes = db.clients;
    const resultado = req.body;
    const juegosValidos = ["juego 1", "juego 2", "juego 3", "juego 4"];
    // Verificar que los datos necesarios estén presentes
    if (!resultado.message || !resultado.idCliente || !Array.isArray(resultado.gameScores)) {
        return res.status(400).json({ error: "Datos incompletos" });
    }
    const idCliente = resultado.idCliente;
    const gameScores = resultado.gameScores;
    try {
        // Actualizar los puntos del cliente
        const cliente = await tablaClientes.findOne({ where: { id: idCliente } });
        if (!cliente) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }
        
        for (let i = 0; i < juegosValidos.length; i++) {
            const tipoJuego = juegosValidos[i];
            const puntos = gameScores[i];
            if(puntos==-1){ continue};
            // Verificar si el puntaje es un número válido
            if (typeof puntos !== 'number' || puntos < 0) {
                return res.status(400).json({ error: `Puntaje inválido para ${tipoJuego}` });
            }         
            // Crear nuevo registro en la tabla escaneos
            const nuevoEscaneo = await tablaEscaneos.create({
                fidClient: idCliente,
                tipo: tipoJuego,
                fidReferencia: i + 1,  // idReferencia es el índice + 1
                ultimoEscaneo: new Date(),
                puntosOtorgados: puntos,
                createdAt: new Date(),
                updatedAt: new Date()
            });


            if (!nuevoEscaneo) {
                return res.status(500).json({ error: `No se pudo crear el registro de escaneo para ${tipoJuego}` });
            }

            cliente.puntos += puntos;
        }
        await cliente.save();

        return res.status(200).json({ message: "Puntos actualizados correctamente" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Ocurrió un error en el servidor" });
    }
}

module.exports = {
    login,
    signup,
    getUser,
    updateUser,
    deleteUser,

    getClientData,
    disableClient,
    ableClient,

    getMisCupones,
    modificarClient,
    listarClientesActivos,

    getEventosHoy,
    getEventoDetalle,
    getCuponesEstado,
    getCuponesXCliente,

    verPermisoUsuario,
    cambiarPermisoUsuario,
    listarCuponesXClientes,
    listarCuponesCategoriaRadar,
    listarCuponesCanjeadosUsados,

    listarEventosCategoria,
    IAKNNCompartido,
    IARecomendadorPersonalizado,

    jugar
};



