const { Client } = require("../models");
const db = require("../models");
const crypto = require("crypto");

const envioCorreo = require('../config/mailConfig');

const forgotPassword = async (req, res) => {
    console.log("intentando controller forgot pasword");
    try {
        const { email } = req.body;

        // Llamar al procedimiento almacenado para generar el código de recuperación de contraseña
        const query = `CALL generarCodigoContraseniaCliente(@id, @codigo, '${email}')`;
        await db.sequelize.query(query);

        // Obtener los valores devueltos por el procedimiento
        const [results] = await db.sequelize.query('SELECT @id, @codigo');
        const id = results[0]['@id'];
        const codigo = results[0]['@codigo'];
        console.log("id: "+id+" codigo: "+codigo);
        

        if(id == 0){
            console.log("cliente no encontrado");
            res.status(400).send({ id, codigo });
        }
        else{
            // Enviar el código de recuperación de contraseña por correo electrónico
            var asunto = 'Recuperación de contraseña - Plaza San Miguel App';
            var texto = `Tu código de recuperación de contraseña es: <b>${codigo}</b>`;
            /*const mailOptions = {
                from: 'noreplay.plazasanmiguel@gmail.com',
                to: email,
                subject: 'Recuperación de contraseña - Plaza San Miguel App',
                text: `Tu código de recuperación de contraseña es: ${codigo}` + '\n\nPlaza San Miguel'
            };
            
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log('Email sent:', info.response);
                }
            });*/

            envioCorreo.enviarCorreo(email, asunto, texto);
            res.status(200).send({ id, codigo });
        }
        


        
    } catch (error) {
        console.log('forgotPassword - [Error]: ', error);
        res.status(500).send("Error al recuperar la contraseña");
    }
};

const changePassword = async (req, res) => {
    //console.log("intentando controller change pasword");
    try {
        const { idCliente } = req.body;
        const { nuevaContrasenia } = req.body;
        const { codigoValidacion } = req.body;

        // Llamar al procedimiento almacenado para cambiar de contraseña
        const query = `CALL solicitudCambioContraseniaCliente('${idCliente}', '${nuevaContrasenia}', '${codigoValidacion}', @estado)`;
        await db.sequelize.query(query);

        // Obtener los valores devueltos por el procedimiento
        const [results] = await db.sequelize.query('SELECT @estado');
        const estado = results[0]['@estado'];
        console.log("estado: " + estado + " | 1: correcto - 0: código incorrecto");

        res.status(200).send({ estado });
    } catch (error) {
        console.log('changePassword - [Error]: ', error);
        res.status(500).send("Error al usar el codigo para cambiar la contraseña");
    }
};

const forgotPasswordWeb = async (req, res) => {
    //console.log("intentando controller forgot pasword");
    try {
        const { email } = req.body;

        // Llamar al procedimiento almacenado para generar el código de recuperación de contraseña
        const query = `CALL generarCodigoContraseniaUsuario(@id, @codigo, '${email}')`;
        await db.sequelize.query(query);

        // Obtener los valores devueltos por el procedimiento
        const [results] = await db.sequelize.query('SELECT @id, @codigo');
        const id = results[0]['@id'];
        const codigo = results[0]['@codigo'];
        console.log("id: "+id+" codigo: "+codigo);
        

        if(id == 0){
            console.log("usuario no encontrado");
            res.status(400).send({ id, codigo });
        }
        else{
            // Enviar el código de recuperación de contraseña por correo electrónico
            var asunto = 'Recuperación de contraseña - Sistema Web Plaza San Miguel';
            var texto = `Tu código de recuperación de contraseña es: <b>${codigo}</b>`;
            envioCorreo.enviarCorreo(email, asunto, texto);
            res.status(200).send({ id, codigo });
        }
        


        
    } catch (error) {
        console.log('forgotPasswordWEB - [Error]: ', error);
        res.status(500).send("Error al recuperar la contraseña");
    }
};

const changePasswordWeb = async (req, res) => {
    //console.log("intentando controller change pasword");
    try {
        const { idCliente } = req.body;
        const { nuevaContrasenia } = req.body;
        const { codigoValidacion } = req.body;
        const hash = crypto.createHash('md5').update(nuevaContrasenia).digest('hex');

        // Llamar al procedimiento almacenado para cambiar de contraseña
        const query = `CALL solicitudCambioContraseniaUsuario('${idCliente}', '${hash}', '${codigoValidacion}', @estado)`;
        await db.sequelize.query(query);

        // Obtener los valores devueltos por el procedimiento
        const [results] = await db.sequelize.query('SELECT @estado');
        const estado = results[0]['@estado'];
        console.log("estado: " + estado + " | 1: correcto - 0: código incorrecto");

        res.status(200).send({ estado });
    } catch (error) {
        console.log('changePasswordWEB - [Error]: ', error);
        res.status(500).send("Error al usar el codigo para cambiar la contraseña");
    }
};


module.exports = {
    forgotPassword, 
    changePassword,
    forgotPasswordWeb,
    changePasswordWeb
};
