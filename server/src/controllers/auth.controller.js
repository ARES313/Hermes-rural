const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_redes';

const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      message: 'Email and password are required'
    });
  }

  // Usar LIKE para búsqueda case-insensitive en SQLite
  const query = `
    SELECT u.id, u.email, u.password_hash, u.full_name, u.status, 
           u.role_id, r.name as role_name
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE LOWER(u.email) = LOWER(?)
  `;

  db.get(query, [email], async (err, user) => {
    if (err) {
      console.error('Error en login:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Internal server error'
      });
    }

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid email or password'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        ok: false,
        message: 'Account is inactive. Please contact administrator'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      ok: true,
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name
      }
    });
  });
};

module.exports = { login };