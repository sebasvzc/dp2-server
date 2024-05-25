const qr = require('qrcode');
const db = require('../models');
const multer = require('multer');
const { AWS_ACCESS_KEY, AWS_ACCESS_SECRET, AWS_S3_BUCKET_NAME, AWS_SESSION_TOKEN } = process.env;
const storage = multer.memoryStorage(); // Puedes usar otros tipos de almacenamiento
const upload = multer({ storage: storage });
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

const generateQr = async (req, res) => {
    const { tipo, idReferencia } = req.body;

    try {
        let model;
        switch (tipo) {
            case 'evento':
                model = db.eventos;
                break;
            case 'tienda':
                model = db.locatarios;
                break;
            case 'cupon':
                model = db.cuponXClientes;
                break;
            default:
                return res.status(400).json({ message: 'Tipo no válido' });
        }

        const referencia = await model.findByPk(idReferencia);
        if (!referencia) {
            return res.status(404).json({ message: `${tipo} no encontrado` });
        }

        const qrData = JSON.stringify({ tipo, idReferencia });
        const qrCode = await qr.toDataURL(qrData);

        res.json({ qrCode });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const scanQr = async (req, res) => {
    try {
        const { tipo, idReferencia, idCliente } = req.body;

        // Validar si el tipo es uno de los permitidos
        if (!['evento', 'tienda', 'cupon'].includes(tipo)) {
            return res.status(400).json({ message: 'Tipo no válido' });
        }

        // Obtener el modelo apropiado según el tipo
        let model;
        switch (tipo) {
            case 'evento':
                model = db.eventos;
                break;
            case 'tienda':
                model = db.locatarios;
                break;
            case 'cupon':
                model = db.cuponXClientes;
                break;
        }

        // Buscar la referencia para asegurar que existe y está activa
        const referencia = await model.findOne({
            where: {
                id: idReferencia,
                activo: 1
            }
        });
        if (!referencia) {
            return res.status(404).json({ message: `${tipo} no encontrado o no está activo` });
        }

        // Consultar si ya existe un escaneo previo
        const whereClause = {
            fidClient: idCliente,
            tipo: tipo,
            fidReferencia: idReferencia
        };

        if (tipo === 'tienda') {
            // Añadir verificación de fecha para las tiendas
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            whereClause.ultimoEscaneo = {
                [db.Sequelize.Op.gt]: yesterday
            };
        }

        const existingScan = await db.escaneos.findOne({
            where: whereClause
        });

        // Verificar si el escaneo ya existe según las reglas dadas
        if (existingScan) {
            if (tipo === 'tienda' && existingScan.ultimoEscaneo.toDateString() === new Date().toDateString()) {
                return res.status(400).json({ message: 'Este QR de tienda ya fue escaneado hoy.' ,  puntosOtorgados:-1});
            }
            return res.status(400).json({ message: 'Este QR ya ha sido escaneado.',  puntosOtorgados:-1 });
        }

        // Registrar el nuevo escaneo
        await db.escaneos.create({
            fidClient: idCliente,
            tipo,
            fidReferencia: idReferencia,
            ultimoEscaneo: new Date()  // Registra la fecha actual del escaneo
        });

        // Si el tipo es 'evento', llamar al procedimiento para sumar puntos
        let puntosOtorgados = 0;
        if (tipo === 'evento') {
            const result = await db.sequelize.query('CALL SumarPuntos(:tipo, :idCliente, :idReferencia, @puntosOtorgados)', {
                replacements: { tipo: 1, idCliente: idCliente, idReferencia: idReferencia }
            });

            // Obtener el valor de la variable de salida
            const [[output]] = await db.sequelize.query('SELECT @puntosOtorgados AS puntosOtorgados');
            puntosOtorgados = output.puntosOtorgados;
        }

        res.json({ 
            message: 'QR escaneado con éxito, puntos asignados.',
            puntosOtorgados: puntosOtorgados
        });
    } catch (error) {
        console.error('Error al escanear QR:', error);
        res.status(500).json({ message: error.message,  puntosOtorgados:-1});
    }
}

const insertarMarcoQR = async (req, res) => {
    try{
        console.log(req.body)
        const {codigo}  = req.body; // Leer el código del cuerpo de la solicitud
        console.log("codigo: "+codigo);

        const file = req.body.file; // Usar req.file para acceder al archivo subido
        
        if (!codigo) {
            return res.status(400).send({ message: "Código no encontrado" });
        }

        if (!file) {
            return res.status(400).send({ message: "Archivo no encontrado" });
        }

        
        const marco = await db.marcoQRs.create(codigo);
        if(marco){
            const bucketParams = {
                Bucket: AWS_S3_BUCKET_NAME,
                Key: `marco${marco.id}.jpg`,
                Body: file.buffer,
                ContentType: file.mimetype
            };
            try {
                // Intenta subir el archivo a S3
                const data = await s3Client.send(new PutObjectCommand(bucketParams));
                console.log("Archivo subido con éxito al s3:", data);
            } catch (error) {
                // Captura cualquier error durante la subida del archivo a S3
                console.error("Error al subir el archivo a S3:", error);
                // Aun así, informa que el cupón fue creado pero el archivo no se subió correctamente
                return res.status(200).send({
                    message: "Se encontró un error durante la subida del archivo, pero sí se creó el marco. Edítalo posteriormente."
                });
            }
        }else{
            return res.status(400).send({message:"Invalid request body"});
        }
        

        //send users details
        //broadcast(req.app.locals.clients, 'signup', user);
        return res.status(200).send({message:"Marco "+ marco.id+ " creado correctamente"});
    }catch (error) {
        console.error('Error al cargar marco:', error);
        res.status(500).json({ message: error.message});
    }
}

module.exports = {
    generateQr,
    scanQr,
    insertarMarcoQR
};
