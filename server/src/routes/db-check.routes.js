const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/db-check', (req, res) => {
  const query = `SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;`;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error al verificar base de datos:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error checking database',
        error: err.message
      });
    }
    
    const tables = rows.map(row => row.name);
    
    res.json({
      ok: true,
      tables: tables
    });
  });
});

module.exports = router;