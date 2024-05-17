
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


const getSignUrlForFile = (key) => {
    return new Promise((resolve, reject) => {
        try {
            const path = require('path');
            const fileName = path.basename(key);

            var params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: key,
                Expires: 30 * 60
            };

            const signedUrl = s3.getSignedUrl('getObject', params);

            if (signedUrl) {
                return resolve(signedUrl);
            }
            else {
                return resolve(false);
            }
        }
        catch (err) {
            return resolve(false);
        }
    });
}

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