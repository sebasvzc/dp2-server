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
  accessKeyId: 'ASIA3VZIIXMJCJ3XRU74',
  secretAccessKey: 'qPWnFM0OMYhSO4abMeLN5fhue6F3wWL/13v2z7lo',
  sessionToken: 'IQoJb3JpZ2luX2VjELj//////////wEaCXVzLXdlc3QtMiJIMEYCIQDOfWo+l7YgcOoKqo/pLc5PtzIinaPxReBDVzQuh/hUIQIhAMkYwcjUc4stIoJIk5OoMgglbeJ2RpzVNdNkrvn1AdiyKrACCCAQABoMODAyNzA2NDcxNjk4IgxitHYaGeYzt738a1EqjQKrUEe/fkWDxW+iMVcmdmIrPu3G0bs+3KnnBpuGDZqtr2Br4HCFWEpSgAQ+jnLXXdEmlSj/OjBxSuxVWH1SxIj0+JDT0wl6nFElF46HizyomwBweB8VFpRUVkVDLaunFiS0a9pd+t+r2bNVOh6DqAz16sVYC1MywBLhclsCDj8EPpx6yiKRF59FOq5MSZt1EZtB7c7iH15WhuZ7d1RFjWfbD47d5g6MUc+d3gZgtuKFdfZr7GjpNXyQ16UjV/uFdunCjY7Hs6Jp1lo2o4OwsjGLENfRAOztXA9eDUgFLE6m7tF5LiWvWrCIKtdirxggzGjgfnX3yko0tLUx5LnjwmdWJG8GMVKn7751L0AjLTDMtPWxBjqcAT6KVS1fS6PQ9/ve5fTHWtvY5LrpTPaipS7DuIUFk9HcV/6/RzFytyoYUo9dnw1DigBeBn0JbTRffNXDaS6L0JSMSVA3/gOf4MuiQK3YNuSx4FlccVOjHs4NiHwkHU3cuo18FfJ7gzo8Dute7xOhMwyO9N8bj4ObsXhchild7eWmocJykM3Lr7+9AX1oKhY5hLIGDi5PbTWfz8cOeg==',
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
    jwt.verify(tokenSinBearer, ACCESS_TOKEN_SECRET, async (err, decoded) => {

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

const disableClient = async (req, res) => {
    const {idCliente} = req.body;
    try {
        // Primero, encontramos al cliente para asegurarnos de que existe
        const client = await db.clients.findOne({
            where: { id: idCliente }
        });

        // Si el cliente no existe, devolvemos un error
        if (!client) {
            return res.status(404).send({estado:"El cliente " + idCliente + " no existe"});
        }

        // Verificar si el cliente ya está desactivado
        if (client.activo === 0) {
            return res.status(400).send({estado:"El cliente " + idCliente + " ya está baneado."});
        }

        // Actualizar el atributo 'activo' del cliente de 1 a 0
        
        await db.clients.update({ activo: 0 }, {
            where: { id: idCliente }
        });
        // Enviar una respuesta exitosa
        return res.status(200).send({estado:"El cliente " + idCliente + " ha sido baneado"});

    } catch (error) {
        return res.status(500).send({estado:"Ha ocurrido un error intentando deshabilitar al cliente"});
    }
}

const ableClient = async (req, res) => {
    const {idCliente} = req.body;
    try {
        // Primero, encontramos al cliente para asegurarnos de que existe
        const client = await db.clients.findOne({
            where: { id: idCliente }
        });

        // Si el cliente no existe, devolvemos un error
        if (!client) {
            return res.status(404).send({estado:"El cliente " + idCliente + " no existe"});
        }

        // Verificar si el cliente ya está desactivado
        if (client.activo === 1) {
            return res.status(400).send({estado:"El cliente " + idCliente + " ya está activo."});
        }

        // Actualizar el atributo 'activo' del cliente de 1 a 0

        await db.clients.update({ activo: 0 }, {
            where: { id: idCliente }
        });

        // Enviar una respuesta exitosa
        return res.status(200).send({estado:"El cliente " + idCliente + " ha sido activado"});

    } catch (error) {
        return res.status(500).send({estado:"Ha ocurrido un error intentando habilitar al cliente"});
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
                        options.order = [[ db.Sequelize.literal("`cupon.costoPuntos`"), orden]];
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
        //usado: cupon.usado,

        //cuponCodigo: cupon.cupon.codigo,
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
    const { active, searchText } = req.body; // Obtener desde el cuerpo
    const page = parseInt(req.query.page) || 1; // Página actual, default 1
    const pageSize = parseInt(req.query.pageSize) || 6; // Tamaño de página, default 10
    const offset = (page - 1) * pageSize; // Calcular el offset

    try {
        const whereConditions = {};

        if (active!=undefined && (active == 1 || active == 0)) {
            whereConditions.activo = active; // Se incluyen clientes basados en el estado activo solicitado
        }
        
        if (searchText) {
            whereConditions[Op.or] = [
                { nombre: { [Op.like]: `%${searchText}%` } },
                { apellidoPaterno: { [Op.like]: `%${searchText}%` } },
                { apellidoMaterno: { [Op.like]: `%${searchText}%` } }
            ];
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

        // Enviar la lista de clientes activos junto con la información de paginación como respuesta
        return res.status(200).json({
            clientes,
            totalPages
        });

    } catch (error) {
        // En caso de error, enviar un mensaje de error al cliente
        return res.status(500).send({ estado: "Ha ocurrido un error intentando listar los clientes activos" });
    }
}


const getEventosHoy = async (req, res,next) => {
    const page = parseInt(req.body.page) || 1; // Página actual, default 1
    const pageSize = parseInt(req.body.pageSize) || 3; // Tamaño de página, default 3
    const offset = (page - 1) * pageSize; // Calcular el offset
    let connection;
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
            cupones: eventosObtenidos.map(evento => {
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
    }catch(error){
        next(error)
    }finally {
        if (connection){
            connection.release();
        }
    }
}

const getEventoDetalle = async (req, res,next) => {
    let connection;
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
        res.status(200).json(eventoDetallado);
    }catch(error){
        next(error)
    }finally {
        if (connection){
            connection.release();
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
    getCuponesEstado

};