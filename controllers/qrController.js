const qr = require('qrcode');
const db = require('../models');
const { AWS_ACCESS_KEY, AWS_ACCESS_SECRET, AWS_S3_BUCKET_NAME, AWS_SESSION_TOKEN, CRYPTO_JS_KEY } = process.env;
const sharp = require('sharp');
const fetch = require('node-fetch');
const { Op } = require('sequelize');
const crypto = require('crypto-js');
const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand
} = require("@aws-sdk/client-s3");
const {getSignUrlForFile} = require("../config/s3");
const configuraciones = require('./configuracionesController')

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
    const { tipo, idReferencia, monto = 100 } = req.body;

    try {
        let model;
        switch (tipo) {
            case 'evento':
                model = db.eventos;
                break;
            case 'tienda':
                model = db.locatarios;
                break;
            case 'compra':
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
        
        // Si el tipo es 'compra', agregar monto y momento
        //if (tipo === 'compra') {
        const momento = new Date().toISOString(); // Formato ISO para JSON
        qrData.monto = monto;
        qrData.momento = momento;
        //}

        // Cifrar los datos
        
        const encryptedData = crypto.AES.encrypt(qrData, CRYPTO_JS_KEY).toString();

        // Generar el QR con los datos cifrados
        const qrCode = await qr.toDataURL(encryptedData);

        res.json({ qrCode });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const usarCuponQR = async (req, res) => {
    try {
        const { dataEncriptada, idCliente } = req.body;

        // Desencriptar los datos
        let decryptedData;
        try {
            const bytes = crypto.AES.decrypt(dataEncriptada, CRYPTO_JS_KEY);
            decryptedData = JSON.parse(bytes.toString(crypto.enc.Utf8));
        } catch (error) {
            return res.status(400).json({ message: 'Datos encriptados inválidos' });
        }

        const { tipo, idReferencia, monto, momento } = decryptedData;
        console.log("tipo: " + tipo + " - id: " + idReferencia + " - monto: " + monto + " - momento: " + momento);

        // Validar si el tipo es uno de los permitidos
        if (tipo !== 'cupon') {
            return res.status(400).json({ message: 'Tipo no válido' });
        }

        const cuponXCliente = db.cuponXClientes;
        const cuponTabla = db.cupones;

        // Buscar el cupon en la tabla cuponXClientes
        const cuponCliente = await cuponXCliente.findOne({
            where: {
                fidCupon: idReferencia,
                fidCliente: idCliente,
                cantidad: { [Op.gt]: 0 } // Validar que la cantidad sea mayor a 0
            }
        });

        if (!cuponCliente) {
            return res.status(400).json({ message: 'Cupón no válido o ya usado' });
        }

        // Buscar el cupon en la tabla cupons
        const cupon = await cuponTabla.findOne({
            where: {
                id: idReferencia,
                fechaExpiracion: { [Op.gt]: new Date() } // Validar que no haya expirado
            }
        });

        if (!cupon) {
            return res.status(400).json({ message: 'Cupón no válido o expirado' });
        }

        // Generar URL firmada para la foto del cupon
        const idCupon = cupon.id;
        const idLocatario = cupon.fidLocatario;
        const urlFotoCupon = s3.getSignedUrl('getObject', {
            Bucket: 'appdp2',
            Key: `cupon${idCupon}.jpg`,
            Expires: 8600 // Tiempo de expiración en segundos
        });

        // Generar URL firmada para la imagen del locatario
        const urlFotoLocatario = s3.getSignedUrl('getObject', {
            Bucket: 'appdp2',
            Key: `tienda${idLocatario}.jpg`,
            Expires: 8600 // Tiempo de expiración en segundos
        });

        // Marcar el cupon como usado y reducir la cantidad
        cuponCliente.cantidad -= 1;
        await cuponCliente.save();

        // Responder con éxito y las URLs firmadas
        res.status(200).json({
            message: 'Cupón canjeado con éxito',
            urlFotoCupon,
            urlFotoLocatario
        });

    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'VALIMOS QUESO' });
    }
};



const scanQr = async (req, res) => {
    try {
        const { dataEncriptada, idCliente } = req.body;

        // Desencriptar los datos
        let decryptedData;
        try {
            const bytes = crypto.AES.decrypt(dataEncriptada, CRYPTO_JS_KEY);
            decryptedData = JSON.parse(bytes.toString(crypto.enc.Utf8));
        } catch (error) {
            return res.status(400).json({ message: 'Datos encriptados inválidos' });
        }

        const { tipo, idReferencia, monto, momento } = decryptedData;
        console.log("tipo: "+tipo+" - id: "+idReferencia +" - monto: "+monto+" - momento: "+momento);

        // Validar si el tipo es uno de los permitidos
        if (!['evento', 'tienda', 'cupon', 'compra', 'juego'].includes(tipo)) {
            return res.status(400).json({ message: 'Tipo no válido' });
        }

        if(tipo=='cupon'){
            //la logica:
            console.log("LOGICA DE TIPO CUPON")

            const cuponXCliente = db.cuponXClientes;
        const cuponTabla = db.cupones;

        // Buscar el cupon en la tabla cuponXClientes
        const cuponCliente = await cuponXCliente.findOne({
            where: {
                fidCupon: idReferencia,
                fidCliente: idCliente,
                cantidad: { [Op.gt]: 0 } // Validar que la cantidad sea mayor a 0
            }
        });

        if (!cuponCliente) {
            return res.status(400).json({ message: 'Cupón no válido o ya usado' });
        }

        // Buscar el cupon en la tabla cupons
        const cupon = await cuponTabla.findOne({
            where: {
                id: idReferencia,
                fechaExpiracion: { [Op.gt]: new Date() } // Validar que no haya expirado
            }
        });

        if (!cupon) {
            return res.status(400).json({ message: 'Cupón no válido o expirado' });
        }

        // Generar URL firmada para la foto del cupon
        const idCupon = cupon.id;
        const idLocatario = cupon.fidLocatario;
        const urlFotoCupon = s3.getSignedUrl('getObject', {
            Bucket: 'appdp2',
            Key: `cupon${idCupon}.jpg`,
            Expires: 8600 // Tiempo de expiración en segundos
        });

        // Generar URL firmada para la imagen del locatario
        const urlFotoLocatario = s3.getSignedUrl('getObject', {
            Bucket: 'appdp2',
            Key: `tienda${idLocatario}.jpg`,
            Expires: 8600 // Tiempo de expiración en segundos
        });

        // Marcar el cupon como usado y reducir la cantidad
        cuponCliente.cantidad -= 1;
        if(cuponCliente.cantidad==0){
            cuponCliente.usado = 1;
        }
        await cuponCliente.save();

        const locatario = await db.locatarios.findOne({

            where: {
                id: idLocatario,
            }
        });

        const nombreLocatario = locatario.nombre
        console.log("responder")
        // Responder con éxito y las URLs firmadas
        res.status(200).json({
            message: 'Cupón canjeado con éxito',
            nombre: nombreLocatario,
            //urlFotoCupon,
            urlFoto: urlFotoLocatario,
            tipo: "cupon"
        });
        
        }else{
            
            // Obtener el modelo apropiado según el tipo
            let model;
            switch (tipo) {
                case 'evento':
                    model = db.eventos;
                    break;
                case 'tienda':
                    model = db.locatarios;
                    break;
                case 'compra':
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
                return res.status(404).json({ message: `${tipo} no encontrado o no está activo` ,  puntosOtorgados:-1});
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


            // Si el tipo es 'evento' o 'tienda', obtener información adicional y sumar puntos
            let puntosOtorgados = 0;
            let nombre = '';
            let rutaFoto = '';
            let urlFoto = '';

            if (tipo === 'evento') {
                const result = await db.sequelize.query('CALL SumarPuntos(:tipo, :idCliente, :idReferencia, @puntosOtorgados)', {
                    replacements: { tipo: 1, idCliente: idCliente, idReferencia: idReferencia }
                });

                // Obtener el valor de la variable de salida
                const [[output]] = await db.sequelize.query('SELECT @puntosOtorgados AS puntosOtorgados');
                puntosOtorgados = output.puntosOtorgados;

                // Obtener nombre y rutaFoto del evento
                nombre = referencia.nombre;
                rutaFoto = referencia.rutaFoto;

                // Generar URL firmada para la imagen del evento
                const key = `evento${idReferencia}.jpg`;
                urlFoto = s3.getSignedUrl('getObject', {
                    Bucket: 'appdp2',
                    Key: key,
                    Expires: 8600 // Tiempo de expiración en segundos
                });
            } else if (tipo === 'tienda') {
                const result = await db.sequelize.query('CALL SumarPuntos(:tipo, :idCliente, :idReferencia, @puntosOtorgados)', {
                    replacements: { tipo: 2, idCliente: idCliente, idReferencia: idReferencia }
                });

                // Obtener el valor de la variable de salida
                const [[output]] = await db.sequelize.query('SELECT @puntosOtorgados AS puntosOtorgados');
                puntosOtorgados = output.puntosOtorgados;

                // Obtener nombre y rutaFoto del locatario
                nombre = referencia.nombre;
                rutaFoto = referencia.rutaFoto;

                // Generar URL firmada para la imagen del locatario
                const key = `tienda${idReferencia}.jpg`;
                urlFoto = s3.getSignedUrl('getObject', {
                    Bucket: 'appdp2',
                    Key: key,
                    Expires: 8600 // Tiempo de expiración en segundos
                });
            }

            // Registrar el nuevo escaneo
            //esto debe de ser al final
            //cuando ya tenga mis puntos otorgados
            await db.escaneos.create({
                fidClient: idCliente,
                tipo,
                fidReferencia: idReferencia,
                ultimoEscaneo: new Date(),  // Registra la fecha actual del escaneo
                puntosOtorgados:puntosOtorgados 
            });

            res.json({
                message: 'QR escaneado con éxito, puntos asignados.',
                puntosOtorgados: puntosOtorgados,
                nombre: nombre,
                urlFoto: urlFoto,
                tipo: tipo
            });
        }

    } catch (error) {
        console.error('Error al escanear QR:', error);
        res.status(500).json({ message: error.message,  puntosOtorgados:-1});
    }
}

const insertarMarcoQR = async (req, res) => {
    try {
        const { codigo, tipo } = req.body; // Leer el código y el tipo del cuerpo de la solicitud
        const file = req.files[0]; // Usar req.file para acceder al archivo subido

        const tiposAceptables = ['evento', 'tienda', 'otros'];

        if (!codigo || !tipo) {
            return res.status(400).send({ message: "Código y tipo son requeridos" });
        }

        if (!tiposAceptables.includes(tipo)) {
            return res.status(400).send({ message: "Tipo no válido. Los valores aceptables son: 'evento', 'tienda', 'otros'" });
        }

        if (!file) {
            return res.status(400).send({ message: "Archivo no encontrado" });
        }

        const data = {
            codigo,
            tipo,
            activo: 1
        };

        const marco = await db.marcoQRs.create(data);
        if (marco) {
            const bucketParams = {
                Bucket: AWS_S3_BUCKET_NAME,
                Key: `marco${marco.id}.jpg`,
                Body: file.buffer,
                ContentType: file.mimetype
            };
            try {
                // Intenta subir el archivo a S3
                const uploadData = await s3Client.send(new PutObjectCommand(bucketParams));
                console.log("Archivo subido con éxito al s3:", uploadData);
            } catch (error) {
                // Captura cualquier error durante la subida del archivo a S3
                console.error("Error al subir el archivo a S3:", error);
                // Aun así, informa que el marco fue creado pero el archivo no se subió correctamente
                return res.status(200).send({
                    message: "Se encontró un error durante la subida del archivo, pero sí se creó el marco. Edítalo posteriormente."
                });
            }
        } else {
            return res.status(400).send({ message: "Invalid request body" });
        }

        return res.status(200).send({ message: "Marco " + marco.id + " creado correctamente" });
    } catch (error) {
        console.error('Error al cargar marco:', error);
        res.status(500).json({ message: error.message });
    }
};

const generateQrInFrame = async (req, res) => {
    const { tipo, idReferencia, marcoId } = req.body;

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


        // Cifrar los datos
        const qrData = JSON.stringify({ tipo, idReferencia });
        const encryptedData = crypto.AES.encrypt(qrData, CRYPTO_JS_KEY).toString();

        // Generar el QR con los datos cifrados
        const qrCodeBuffer = await qr.toBuffer(encryptedData);

        //const qrData = JSON.stringify({ tipo, idReferencia });
        //const qrCodeBuffer = await qr.toBuffer(qrData);

        let finalImageBuffer;

        const marco = await db.marcoQRs.findOne({ where: { id: marcoId, activo: true } });

        if (!marco) {
            finalImageBuffer = qrCodeBuffer;
        } else {
            const key = `marco${marcoId}.jpg`;
            console.log(key);
            try {
                const url = s3.getSignedUrl('getObject', {
                    Bucket: AWS_S3_BUCKET_NAME,
                    Key: key,
                    Expires: 8600
                });
                console.log("URL firmada:", url);

                const response = await fetch(url);
                if (!response.ok) {
                    console.error('Error al obtener el marco:', response.statusText);
                    return res.status(404).json({ message: 'Marco no encontrado' });
                }

                const frameBuffer = await response.buffer();
                console.log("Buffer de respuesta obtenido");

                const image = sharp(frameBuffer);
                const { width, height } = await image.metadata();

                // Calcular el tamaño y posición del QR
                const qrSize = Math.floor(0.6 * width);
                const qrX = Math.floor((width - qrSize) / 2);
                const qrY = Math.floor((height - qrSize) / 2);

                const qrResizedBuffer = await sharp(qrCodeBuffer)
                    .resize(qrSize, qrSize)
                    .toBuffer();

                finalImageBuffer = await sharp(frameBuffer)
                    .composite([{ input: qrResizedBuffer, left: qrX, top: qrY }])
                    .toBuffer();
            } catch (error) {
                console.error("Error al procesar el marco:", error);
                return res.status(404).json({ message: 'Marco no encontrado o error al obtener el marco.' });
            }
        }

        const finalBase64 = finalImageBuffer.toString('base64');
        const finalUrl = `data:image/jpeg;base64,${finalBase64}`;

        res.json({ qrCode: finalUrl });
    } catch (error) {
        console.error("Error en generateQrInFrame:", error);
        res.status(500).json({ message: error.message });
    }
};

const listarMarcos = async (req, res) => {
    try {
        const { tipo, activo } = req.body;
        const { page = 1, size = 10 } = req.query;

        // Validar que ambos campos están presentes
        if (tipo === undefined || activo === undefined) {
            return res.status(400).json({ message: 'Campos "tipo" y "activo" son requeridos' });
        }

        // Construir condiciones de búsqueda dinámicamente
        const condiciones = {};
        if (tipo !== "") {
            condiciones.tipo = tipo;
        }
        if (activo !== "") {
            condiciones.activo = activo;
        }

        // Calcular el offset para la paginación
        const limit = parseInt(size);
        const offset = (parseInt(page) - 1) * limit;

        const { count, rows: marcos } = await db.marcoQRs.findAndCountAll({
            where: condiciones,
            offset,
            limit
        });

        const marcosConUrl = await Promise.all(marcos.map(async (marco) => {
            const key = `marco${marco.id}.jpg`;
            //console.log("id marco: "+marco.id)
            const url = await configuraciones.getSignedUrl(key);
            //console.log("URL firmada:", url);
            return {
                id: marco.id,
                codigo: marco.codigo,
                tipo: marco.tipo,
                activo: marco.activo,
                url
            };
        }));

        res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            marcos: marcosConUrl
        });
    } catch (error) {
        console.error('Error al listar marcos:', error);
        res.status(500).json({ message: error.message });
    }
};

const habilitarMarcos = async (req, res) => {
    try {
        const { ids } = req.body;

        // Validar que el campo ids está presente y es un array
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'El campo "ids" es requerido y debe ser un array no vacío' });
        }

        // Actualizar los marcos para habilitarlos
        const result = await db.marcoQRs.update(
            { activo: true },
            {
                where: {
                    id: ids
                }
            }
        );

        res.status(200).json({ message: `${result[0]} marcos habilitados correctamente` });
    } catch (error) {
        console.error('Error al habilitar marcos:', error);
        res.status(500).json({ message: error.message });
    }
};

const deshabilitarMarcos = async (req, res) => {
    try {
        const { ids } = req.body;

        // Validar que el campo ids está presente y es un array
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'El campo "ids" es requerido y debe ser un array no vacío' });
        }

        // Actualizar los marcos para deshabilitarlos
        const result = await db.marcoQRs.update(
            { activo: false },
            {
                where: {
                    id: ids
                }
            }
        );

        res.status(200).json({ message: `${result[0]} marcos deshabilitados correctamente` });
    } catch (error) {
        console.error('Error al deshabilitar marcos:', error);
        res.status(500).json({ message: error.message });
    }
};

const modificarMarco = async (req, res) => {
    try {
        const { id, codigo, tipo, activo } = req.body;
        const file = req.files[0];

        // Validar que el campo id está presente
        if (!id) {
            return res.status(400).json({ message: 'El campo "id" es requerido' });
        }

        // Validar que el campo tipo tenga un valor permitido
        const tiposPermitidos = ['evento', 'otros', 'tienda'];
        if (tipo && !tiposPermitidos.includes(tipo)) {
            return res.status(400).json({ message: 'El campo "tipo" debe ser uno de los siguientes valores: evento, otros, tienda' });
        }

        // Buscar el marco por id
        const marco = await db.marcoQRs.findByPk(id);
        if (!marco) {
            return res.status(404).json({ message: 'Marco no encontrado' });
        }

        // Actualizar el marco
        if (codigo) marco.codigo = codigo;
        if (activo !== undefined) marco.activo = activo;
        if (tipo) marco.tipo = tipo;

        await marco.save();

        // Si se proporciona un archivo, actualizar la imagen en S3
        if (file) {
            const key = `marco${id}.jpg`;
            const bucketParams = {
                Bucket: AWS_S3_BUCKET_NAME,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype
            };
            try {
                await s3Client.send(new PutObjectCommand(bucketParams));
                console.log("Imagen actualizada con éxito en S3:", key);
            } catch (error) {
                console.error("Error al actualizar la imagen en S3:", error);
                return res.status(500).json({ message: 'Error al actualizar la imagen en S3' });
            }
        }

        res.status(200).json({ message: 'Marco actualizado correctamente', marco });
    } catch (error) {
        console.error('Error al modificar el marco:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    generateQr,
    scanQr,
    insertarMarcoQR,
    generateQrInFrame,
    listarMarcos,
    habilitarMarcos,
    deshabilitarMarcos,
    modificarMarco,
    usarCuponQR

};
