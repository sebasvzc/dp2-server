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
        const { nombre, email, apellidoPaterno, apellidoMaterno, telefono,contrasenia } = req.body;
        const data = {
            nombre,
            email,
            apellidoPaterno,
            apellidoMaterno,
            telefono,
            contrasenia
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
    const { idCliente } = req.body
    const misCupones = await db.cuponXClientes.findAll({
        where: {fidCliente: idCliente}
    });
    res.json(misCupones);
}

module.exports = {
    login,
    signup,
    getUser,
    updateUser,
    deleteUser,
    getMisCupones
};