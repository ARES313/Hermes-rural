const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(':memory:');

// Inicializar esquema y datos de prueba de forma sincrónica
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON;');

  // Roles
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (name IN ('admin', 'teacher', 'student'))
    );
  `);

  // Users
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
      CHECK (status IN ('active', 'inactive'))
    );
  `);

  // Classes (necesario para algunas rutas protegidas)
  db.run(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      teacher_id INTEGER NOT NULL,
      school_year TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT,
      CHECK (status IN ('active', 'inactive'))
    );
  `);

  // Seed roles
  db.run(
    `INSERT OR IGNORE INTO roles (id, name, description) VALUES (1, 'admin', 'Administrador del sistema')`,
  );
  db.run(`INSERT OR IGNORE INTO roles (id, name, description) VALUES (2, 'teacher', 'Docente')`);
  db.run(`INSERT OR IGNORE INTO roles (id, name, description) VALUES (3, 'student', 'Estudiante')`);

  // Seed users con contraseñas conocidas (bcrypt es síncrono aquí)
  const adminHash = bcrypt.hashSync('admin123', 10);
  const teacherHash = bcrypt.hashSync('teacher123', 10);
  const studentHash = bcrypt.hashSync('student123', 10);
  const inactiveHash = bcrypt.hashSync('inactive123', 10);

  db.run(
    `INSERT OR IGNORE INTO users (id, role_id, full_name, email, password_hash, status) VALUES (1, 1, 'Admin User', 'admin@test.com', ?, 'active')`,
    [adminHash],
  );
  db.run(
    `INSERT OR IGNORE INTO users (id, role_id, full_name, email, password_hash, status) VALUES (2, 2, 'Teacher User', 'teacher@test.com', ?, 'active')`,
    [teacherHash],
  );
  db.run(
    `INSERT OR IGNORE INTO users (id, role_id, full_name, email, password_hash, status) VALUES (3, 3, 'Student User', 'student@test.com', ?, 'active')`,
    [studentHash],
  );
  db.run(
    `INSERT OR IGNORE INTO users (id, role_id, full_name, email, password_hash, status) VALUES (4, 3, 'Inactive User', 'inactive@test.com', ?, 'inactive')`,
    [inactiveHash],
  );
});

module.exports = db;
