const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'Redes.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos SQLite:', dbPath);
    db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
      if (pragmaErr) {
        console.error('❌ Error al activar PRAGMA foreign_keys:', pragmaErr.message);
      } else {
        console.log('🔒 PRAGMA foreign_keys activado correctamente');
      }
    });
  }
});

module.exports = db;
