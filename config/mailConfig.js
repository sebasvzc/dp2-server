require('dotenv').config();
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

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

module.exports = transporter;
