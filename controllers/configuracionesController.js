const { AWS_ACCESS_KEY, AWS_ACCESS_SECRET, AWS_S3_BUCKET_NAME, AWS_SESSION_TOKEN } = process.env;
const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand
} = require("@aws-sdk/client-s3");
const {getSignUrlForFile} = require("../config/s3");

var s3Config;
s3Config = {
    region: "us-east-1",
    credentials: {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_ACCESS_SECRET,
        sessionToken: AWS_SESSION_TOKEN
    },
};
const s3Client = new S3Client(s3Config);

// USADO PARA LEER LO QUE SE ENCUENTRA DENTRO DEL S3
const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_ACCESS_SECRET,
    sessionToken: AWS_SESSION_TOKEN,
    region: 'us-east-1' // La región donde está tu bucket
  });

const s3 = new AWS.S3();

const subirImagenPorDefecto = async (req, res) => {
    try {
        const file = req.files[0];

        // Validar que el archivo está presente
        if (!file) {
            return res.status(400).json({ message: 'Archivo no encontrado' });
        }

        const key = 'defecto.jpg';
        const bucketParams = {
            Bucket: AWS_S3_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        };

        // Subir el archivo a S3
        await s3Client.send(new PutObjectCommand(bucketParams));
        console.log("Imagen por defecto subida con éxito a S3:", key);

        res.status(200).json({ message: 'Imagen por defecto subida correctamente' });
    } catch (error) {
        console.error('Error al subir la imagen por defecto:', error);
        res.status(500).json({ message: 'Error al subir la imagen por defecto' });
    }
};

const getSignedUrl = async (key) => {
    const command = new GetObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: key
    });
    try {
        await s3Client.send(command);
        return s3Client.getSignedUrl(command, { Expires: 3600 }); // 1 hora de expiración
    } catch (error) {
        if (error.name === 'NoSuchKey' || error.$metadata.httpStatusCode === 404) {
            // Retornar URL de imagen por defecto
            const defaultKey = 'default.jpg';
            const defaultCommand = new GetObjectCommand({
                Bucket: AWS_S3_BUCKET_NAME,
                Key: defaultKey
            });
            return s3Client.getSignedUrl(defaultCommand, { Expires: 3600 });
        }
        throw error;
    }
};

module.exports = {
    subirImagenPorDefecto,
    getSignedUrl
};