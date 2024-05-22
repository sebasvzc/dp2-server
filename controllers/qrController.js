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

        // Buscar la referencia para asegurar que existe
        const referencia = await model.findByPk(idReferencia);
        if (!referencia) {
            return res.status(404).json({ message: `${tipo} no encontrado` });
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
                return res.status(400).json({ message: 'Este QR de tienda ya fue escaneado hoy.' });
            }
            return res.status(400).json({ message: 'Este QR ya ha sido escaneado.' });
        }

        // Registrar el nuevo escaneo
        await db.escaneos.create({
            fidClient: idCliente,
            tipo,
            fidReferencia: idReferencia,
            ultimoEscaneo: new Date()  // Registra la fecha actual del escaneo
        });

        res.json({ message: 'QR escaneado con éxito, puntos asignados.' });
    } catch (error) {
        console.error('Error al escanear QR:', error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    generateQr,
    scanQr
};
