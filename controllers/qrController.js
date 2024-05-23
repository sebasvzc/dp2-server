const qr = require('qrcode');
const db = require('../models');

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

module.exports = {
    generateQr,
    scanQr
};
