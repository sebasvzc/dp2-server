const { Client } = require("../models");
const db = require("../models");
const crypto = require("crypto");

const forgotPassword = async (req, res) => {
    console.log("intentando controller forgot pasword");
    try {
        const { email } = req.body;
        const client = await Client.findOne({ where: { email: email } });

        if (!client) {
            return res.status(404).send("Cliente no encontrado");
        }

        // Llamar al procedimiento almacenado para generar el código de recuperación de contraseña
        const query = `CALL generarCodigoContraseniaCliente(@id, @codigo, '${email}')`;
        await db.sequelize.query(query);

        // Obtener los valores devueltos por el procedimiento
        const [results] = await db.sequelize.query('SELECT @id, @codigo');
        const id = results[0]['@id'];
        const codigo = results[0]['@codigo'];
        console.log("id: "+id+" codigo: "+codigo);
        // Enviar el código de recuperación de contraseña por correo electrónico
        /*const mailOptions = {
            from: 'testerjohhnydp2@gmail.com',
            to: email,
            subject: 'Recuperación de contraseña',
            text: `Tu código de recuperación de contraseña es: ${codigo}`
        };

        await transporter.sendMail(mailOptions);*/

        res.status(200).send({ id, codigo });
    } catch (error) {
        console.log('forgotPassword - [Error]: ', error);
        res.status(500).send("Error al recuperar la contraseña");
    }
};

module.exports = {
    forgotPassword
};
