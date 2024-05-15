//importing modules
const jwt = require("jsonwebtoken");
const db = require("../models");
require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const WebSocket = require("ws");
const crypto = require("crypto");

const { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY } = process.env;

// Assigning users to the variable User
const User = db.users;
const UserInv = db.usersInv;
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
    console.log("user-login")
    try {
        const { email, password } = req.body;
        //find a user by their email
        const user = await User.findOne({ where: { email: email } });
        console.log(user)
        //if user email is found, compare password
        if (user) {
            console.log("si encontre uysuario")
            if(user.activo===1){
                console.log("usuario activo")
                const isSame =  crypto.createHash('md5').update(password).digest('hex') === user.contrasenia;
                if (isSame) {
                    console.log("si es igual")
                    const accessToken = jwt.sign(
                        { id:user.id,userName: user.userName, email: user.email, role: user.role },
                        ACCESS_TOKEN_SECRET,
                        { expiresIn: ACCESS_TOKEN_EXPIRY }
                    );
                    const refreshToken = jwt.sign(
                        { id:user.id,userName: user.userName, email: user.email, role: user.role },
                        REFRESH_TOKEN_SECRET,
                        { expiresIn: REFRESH_TOKEN_EXPIRY }
                    );
                    res.status(200).send({
                        token: accessToken,
                        refreshToken: refreshToken
                    });
                } else {
                    return res.status(401).send("Authentication failed");
                }
            }else{
                console.log("usuario se encuentra deshabilitado")
                return res.status(401).send({code:"2",message:"usuario se encuentra deshabilitado"});
            }

        } else {
            return res.status(401).send("Authentication failed");
        }
    } catch (error) {
        console.log('login - [Error]: ', error);
    }
}


//signing a user up
//hashing users password before its saved to the database
const signup = async (req, res) => {

    try {
        console.log("entre a registrar nuevo usuariop")
        const { tokenReg} = req.body;

        jwt.verify(tokenReg, 'secretKey', async (err, decoded) => {

            if (err) {
                console.log(err)
                if (err.name === 'TokenExpiredError') {
                    console.log('Access denied. Token expired.');
                } else {
                    console.log('Access denied. Invalid token.')
                    return res.status(403).send('Access denied. Invalid token.');
                }
            } else {
                const now = Date.now();
                if (now > decoded.expiresIn) {
                    console.log('Access denied. Token expired.');
                    return res.status(403).send('Access denied. Token expired.');
                } else {

                    const { nombre, email,apellido, password, rol } = req.body;
                    const emailcheck = await UserInv.findOne({
                        where: {
                            email: email,
                        },
                    });
                    if(!emailcheck){
                        return res.status(401).send('No esta ese email en los invitados');
                    }
                    if(emailcheck.active===1){
                        const data = {
                            nombre,
                            email,
                            apellido,
                            contrasenia: crypto.createHash('md5').update(password).digest('hex'),
                            rol: "Empleado",
                            activo:1
                        };
                        //saving the user
                        const user = await User.create(data);
                        //if user details is captured
                        //generate token with the user's id and the secretKey in the env file
                        // set cookie with the token generated
                        if (user) {

                            console.log("user", JSON.stringify(user, null, 2));
                            await UserInv.update(
                                {
                                    active: 0
                                },
                                {
                                    where: { email: email }
                                }
                            );
                            //send users details
                            //broadcast(req.app.locals.clients, 'signup', user);
                            return res.status(200).send(user);
                        }
                        else {
                            return res.status(400).send("Invalid request body");
                        }
                        } else {
                            return res.status(400).send("Ya has creado un usuario con ese email");
                        }
                }
            }
        });


    } catch (error) {
        console.log('signup - [Error]: ', error);
    }
}
const comprobarTokenRegistroUsuario = async (req, res) => {

    try {
        console.log("entre a comprobar")

        
        const { tokenReg} = req.body;

        jwt.verify(tokenReg, 'secretKey', async (err, decoded) => {

            if (err) {
                console.log(err)
                if (err.name === 'TokenExpiredError') {
                    console.log('Access denied. Token expired.');
                } else {
                    console.log('Access denied. Invalid token.')
                    return res.status(403).send('Access denied. Invalid token.');
                }
            } else {
                const now = Date.now();
                if (now > decoded.expiresIn) {
                    console.log('Access denied. Token expired.');
                    return res.status(403).send('Access denied. Token expired.');
                } else {
                    const emailcheck = await UserInv.findOne({
                        where: {
                            email: decoded.email
                        },
                    });
                    console.log(emailcheck)
                    if(!emailcheck){
                        return res.status(401).send('No esta ese email en los invitados');
                    }
                    if(emailcheck.active===1){
                        console.log(decoded.email);
                    }else{
                        return res.status(401).send('No esta ese email en los invitados');
                    }

                }
            }
        });
    } catch (error) {
        console.log( error);
    }
}
const getUserData = async (req, res) => {
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
            const findUser = await User.findOne({
                where: {
                    id: decoded.id,

                },
                attributes: {exclude: ['contrasenia']}
            });
            if(findUser){
                if(findUser.activo===1){
                    return res.status(200).send({ findUser, newToken: req.newToken});
                }else{
                    console.log('Access denied. User not active in db.');
                    return res.status(403).send('Access denied. User not active in db.');
                }

            }else{
                console.log('Access denied. User not found in db.');
                return res.status(403).send('Access denied. User not found in db.');

            }
        }
    });

}
const getUser = async (req, res) => {
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
    try {
        if (queryType === 'all') {
            const usersAndCount = await Promise.all([
                User.findAll({
                    attributes: { exclude: ['password'] },
                    where: {
                        rol: {[Op.not]: 'admin'}

                    },
                    offset: offset,
                    limit: pageSize
                }),
                User.count({
                    where: {
                        rol: {[Op.not]: 'admin'}
                    }
                })
            ]);
            const [users, totalCount] = usersAndCount;
            if (users) {
                return res.status(200).json({ users, newToken: req.newToken,totalUsers:totalCount });
            } else {
                return res.status(400).send("Invalid request body");
            }
        } else {
            console.log("Estoy viendo algo que no es all")

            const usersAndCount = await Promise.all([
                User.findAll({
                    attributes: { exclude: ['password'] },
                    where: {
                        rol: {[Op.not]: 'admin'},
                        [Op.or]: [
                            { email: { [Op.like]: `%${queryType}%` } },
                            { nombre: { [Op.like]: `%${queryType}%` } } // Asumiendo que el campo se llama 'name'
                        ]
                    },
                    offset: offset,
                    limit: pageSize
                }),
                User.count({
                    where: {
                        rol: {[Op.not]: 'admin'},
                        [Op.or]: [
                            { email: { [Op.like]: `%${queryType}%` } },
                            { nombre: { [Op.like]: `%${queryType}%` } } // Asumiendo que el campo se llama 'name'
                        ]
                    }
                })
            ]);
            const [users, totalCount] = usersAndCount;
            if (users) {
                // console.log(users)
                // console.log(users)
                return res.status(200).json({ users, newToken: req.newToken,totalUsers:totalCount });
            } else {
                return res.status(200).send("Email no encontrado");
            }
        }
    } catch (error) {
        console.log('getUser - queryType:', queryType, ' - [Error]: ', error);
    }
}

const habilitar = async (req, res) => {


    try {

        console.log('updateUser - updateItem: ', req.body.selected);
        for (let i = 0; i < req.body.selected.length; i++) {
            const selectedItem = req.body.selected[i];
            console.log('Item seleccionado:', selectedItem);
            const user = await User.findOne({
                where: {
                    id: selectedItem
                }
            });
            if (!user) {
                return res.status(409).send("El id de usuario "+selectedItem+" no se encontro en la bd");
            }
            await User.update(
                {
                    activo: 1
                },
                {
                    where: { id: selectedItem }
                }
            );
        }
        return res.status(200).send({message:"Usuarios habilitados correctamente", code:0});
    } catch (error) {
        console.log('updateUser - updateItem:', updateItem, ' - [Error]: ', error)
    }
}
const deshabilitar = async (req, res) => {


    try {

        console.log('updateUser - updateItem: ', req.body.selected);
        for (let i = 0; i < req.body.selected.length; i++) {
            const selectedItem = req.body.selected[i];
            console.log('Item seleccionado:', selectedItem);
            const user = await User.findOne({
                where: {
                    id: selectedItem
                }
            });
            if (!user) {
                return res.status(409).send("El id de usuario "+selectedItem+" no se encontro en la bd");
            }
            await User.update(
                {
                    activo: 0
                },
                {
                    where: { id: selectedItem }
                }
            );
        }
        return res.status(200).send({message:"Usuarios deshabilitados correctamente", code:0});
    } catch (error) {
        console.log('updateUser - updateItem:', updateItem, ' - [Error]: ', error)
    }
}

const modificar = async (req, res) => {
    var updateItem = req.body.editedUser;
    console.log('updateUser - updateItem: ', updateItem);
    const {id, nombre, apellido, email, password,activo,rol } = req.body.editedUser;
    try {
        const user = await User.findOne({
            where: {
                id: id
            }
        });
        if (!user) {
            console.log("Requested "+updateItem+" wasn't found!")
            return res.status(409).send("Requested "+updateItem+" wasn't found!");
        }
        const checkSameUser = await User.findOne({
            where: {
                email: email
            }
        });
        if (checkSameUser && id!== checkSameUser.id) {
            console.log("Requested "+email+" esta duplicado, por favor no colocar un email ya existente")
            return res.status(403).send("Requested "+email+" esta duplicado, por favor no colocar un email ya existente");
        }
        await User.update(
            {
                nombre: nombre,
                apellido: apellido,
                email: email,
                activo: activo,
                rol: rol
            },
            {
                where: { id: id }
            }
        );
        return res.status(200).send({message:"Usuario modificado correctametne"});
    } catch (error) {
        console.log('updateUser - updateItem:', updateItem, ' - [Error]: ', error)
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

module.exports = {
    login,
    signup,
    getUser,
    updateUser,
    deleteUser,
    comprobarTokenRegistroUsuario,
    deshabilitar,
    habilitar,
    modificar,getUserData
};