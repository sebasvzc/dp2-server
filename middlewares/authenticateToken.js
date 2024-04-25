const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY } = process.env;
// Middleware de autenticación
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    const refreshToken = req.headers['refresh-token'];
    if (!token || !refreshToken) {
        return res.status(401).send('Access denied. Token missing.');
    }
    const tokenSinBearer = token.substring(7); // Comienza desde el índice 7 para omitir "Bearer "
    const refreshTokenSinBearer = refreshToken.substring(7);


    jwt.verify(tokenSinBearer, ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                console.log('Access denied. Access Token expired.');
                verifyRefreshToken(refreshTokenSinBearer, req, res, next);
            } else {
                return res.status(403).send('Access denied. Invalid token.');
            }
        } else {
            req.user = decoded;
            next();
        }
    });
}

function verifyRefreshToken(refreshToken, req, res, next) {
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                console.log('Access denied. Access Token expired and RefreshTokenExpired.');
                return res.status(403).send('Access denied. Token and RefreshToken expired.');
            } else {
                console.log('Error verifying refreshToken:', err);
                return res.status(403).send('Access denied. Invalid RefreshToken.');
            }
        }

        const newAccessToken = jwt.sign(
            { userName: decoded.userName, email: decoded.email, role: decoded.role },
            ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );

        req.newToken = newAccessToken;
        req.user = decoded;
        next();
    });
}


module.exports = authenticateToken;