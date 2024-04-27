require('dotenv').config();
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

/*

COMO ENVIAR CORREOS:
const correo = require('esta ruta')

correo.enviarCorreo(destino, asunto, texto)

NOTA: La función le agrega una firma al final del texto

*/

const oauth2Client = new OAuth2Client(
    process.env.CLIENT_ID_NM,
    process.env.CLIENT_SECRET_NM,
    'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN_NM
});

const accessToken = async () => {
    const { token } = await oauth2Client.getAccessToken();
    return token;
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER_NM,
        clientId: process.env.CLIENT_ID_NM,
        clientSecret: process.env.CLIENT_SECRET_NM,
        refreshToken: process.env.REFRESH_TOKEN_NM,
        accessToken: accessToken()
    }
});

///////////////////////////////////////////////////////////////////////


exports.enviarCorreo = async (destino, asunto, texto) => {
    try {
        // Obteniendo el token de acceso
        const token = await accessToken();
        //var txt =  texto + '\n\nPlaza San Miguel'
        // Detalles del correo
        const mailOptions = {
            from: 'noreplay.plazasanmiguel@gmail.com',
            to: destino,
            subject: asunto,
            html: texto + '<br><br>Plaza San Miguel'
        };

        // Envío del correo
        const info = await transporter.sendMail({
            ...mailOptions,
            auth: {
                accessToken: token
            }
        });
        console.log('Correo enviado NuevoNodemailer:', info.response);
    } catch (error) {
        console.log('Error al enviar el correo NuevoNodemailer:', error);
    }
}

//module.exports = transporter;
