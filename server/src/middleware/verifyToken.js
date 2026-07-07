const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_redes';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      ok: false,
      message: 'Access denied. No token provided'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      ok: false,
      message: 'Invalid token format. Use: Bearer <token>'
    });
  }

  const token = parts[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          ok: false,
          message: 'Token expired'
        });
      }
      return res.status(401).json({
        ok: false,
        message: 'Invalid token'
      });
    }

    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;