
const AWS = require("aws-sdk");

var s3

if (process.env.NODE_ENV === 'production') {
    s3 = new AWS.S3({
        region: "us-east-1"
    });
}
else{
    s3 = new AWS.S3({
        region: "us-east-1",
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_ACCESS_SECRET,
            sessionToken: process.env.AWS_SESSION_TOKEN
        }
    });
}


const getSignUrlForFile = (key, defaultValue) => {
    return new Promise((resolve, reject) => {
        try {
            const headParams = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: key
            };

            const signedUrlParams = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: key,
                Expires: 30 * 60 // Tiempo de expiración de la URL firmada en segundos
            };

            s3.headObject(headParams, (err, metadata) => {
                if (err && err.code === 'NotFound') {
                    // El archivo no existe, usar la imagen predeterminada
                    const defaultParams = {
                        ...signedUrlParams,
                        Key: defaultValue
                    };
                    const defaultSignedUrl = s3.getSignedUrl('getObject', defaultParams);
                    return resolve(defaultSignedUrl);
                } else if (err) {
                    // Otro error, rechazar la promesa
                    return resolve(null);
                } else {
                    // El archivo existe, devolver la URL firmada
                    const signedUrl = s3.getSignedUrl('getObject', signedUrlParams);
                    return resolve(signedUrl);
                }
            });
        } catch (err) {
            return resolve(null);
        }
    });
};
const deleteObject = (key) => {
    return new Promise((resolve, reject) => {
        try {
            var deleteParam = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Delete: {
                    Objects: [
                        { Key: key },
                    ]
                }
            };
            s3.deleteObjects(deleteParam, function (err, data) {
                if (err) console.log(err, err.stack);
                else console.log('delete', data);
            });
        } catch (err) {
            return reject(err);
        }
    });
}

module.exports = { deleteObject, getSignUrlForFile };