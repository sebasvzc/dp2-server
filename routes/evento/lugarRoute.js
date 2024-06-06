const express = require('express');
var lugarController = require('../../controllers/lugarController');
const { getLugares } = lugarController;

var lugarRouter = express.Router();

const authenticateToken = require("../../middlewares/authenticateToken");


lugarRouter.get('/listarLugares', authenticateToken,getLugares);
module.exports = lugarRouter;