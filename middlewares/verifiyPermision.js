const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.users;


async function verifyPermission(req, res, next) {
    try {

        let permiso;
        // Extract permission based on request method
        if (req.method === 'POST') {
            permiso = req.body.permission;
        } else if (req.method === 'GET') {
            permiso = req.query.permission.replace(/%/g, ' ');
        }
        const user = await User.findOne({
            where: {
                id: req.user.id
            },
        });

        const userPerm = await db.rolePermission.findOne({
            where: {
                fidRol: user.fidRol
            },
            include:{
                model: db.permission,
                as: 'permission',
                where:{
                    nombre: permiso
                }
            }
        });
        if (user && userPerm) {
            next();
        } else {
            console.log('Access denied. No esta permitido.');
            return res.status(403).send('Access denied. No esta permitido.');
        }
    }
    catch (error) {
        console.log('verifityuPerrmission - [Error]: ', error);
    }
}


module.exports = verifyPermission;