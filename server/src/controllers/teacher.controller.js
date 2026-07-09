const bcrypt = require('bcryptjs');
const db = require('../database/db');

const SALT_ROUNDS = 10;

// Obtener todos los docentes (solo usuarios con role = teacher)
const getAllTeachers = (req, res) => {
  const query = `
    SELECT u.id, u.full_name, u.email, u.status, u.created_at,
           r.name as role_name
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'teacher'
    ORDER BY u.full_name ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error al obtener docentes:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al obtener docentes',
        error: err.message,
      });
    }

    res.json({
      ok: true,
      count: rows.length,
      teachers: rows,
    });
  });
};

// Obtener un docente por ID
const getTeacherById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT u.id, u.full_name, u.email, u.status, u.created_at,
           r.name as role_name
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE u.id = ? AND r.name = 'teacher'
  `;

  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Error al obtener docente:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al obtener docente',
        error: err.message,
      });
    }

    if (!row) {
      return res.status(404).json({
        ok: false,
        message: 'Docente no encontrado',
      });
    }

    res.json({
      ok: true,
      teacher: row,
    });
  });
};

// Crear un nuevo docente (usuario con rol teacher) - recibe password en texto plano
const createTeacher = (req, res) => {
  const { full_name, email, password, status } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({
      ok: false,
      message: 'Los campos full_name, email y password son obligatorios',
    });
  }

  // Validar formato de email básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      ok: false,
      message: 'Formato de email inválido',
    });
  }

  // Validar password mínimo
  if (password.length < 6) {
    return res.status(400).json({
      ok: false,
      message: 'La contraseña debe tener al menos 6 caracteres',
    });
  }

  // Verificar si el email ya existe
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, existingUser) => {
    if (err) {
      console.error('Error al verificar email:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error interno del servidor',
      });
    }

    if (existingUser) {
      return res.status(400).json({
        ok: false,
        message: 'El email ya está registrado',
      });
    }

    // Obtener el role_id para 'teacher'
    db.get(`SELECT id FROM roles WHERE name = 'teacher'`, (err, roleRow) => {
      if (err) {
        console.error('Error al obtener rol teacher:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error interno del servidor',
        });
      }

      if (!roleRow) {
        return res.status(500).json({
          ok: false,
          message: 'Rol teacher no encontrado en la base de datos',
        });
      }

      // Hashear la contraseña
      const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
      const role_id = roleRow.id;
      const statusValue = status || 'active';

      const query = `
        INSERT INTO users (role_id, full_name, email, password_hash, status)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.run(query, [role_id, full_name, email, hashedPassword, statusValue], function (err) {
        if (err) {
          console.error('Error al crear docente:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al crear docente',
            error: err.message,
          });
        }

        res.status(201).json({
          ok: true,
          message: 'Docente creado exitosamente',
          teacherId: this.lastID,
        });
      });
    });
  });
};

// Actualizar un docente
const updateTeacher = (req, res) => {
  const { id } = req.params;
  const { full_name, email, status } = req.body;

  // Verificar que el usuario existe y es docente
  db.get(
    `SELECT u.id FROM users u INNER JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND r.name = 'teacher'`,
    [id],
    (err, teacher) => {
      if (err) {
        console.error('Error al verificar docente:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al actualizar docente',
        });
      }

      if (!teacher) {
        return res.status(404).json({
          ok: false,
          message: 'Docente no encontrado',
        });
      }

      const updates = [];
      const values = [];

      if (full_name !== undefined) {
        updates.push('full_name = ?');
        values.push(full_name);
      }

      if (email !== undefined) {
        // Verificar que el nuevo email no esté en uso por otro usuario
        db.get(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, id],
          (err, existingUser) => {
            if (err) {
              console.error('Error al verificar email:', err.message);
              return res.status(500).json({
                ok: false,
                message: 'Error al actualizar docente',
              });
            }

            if (existingUser) {
              return res.status(400).json({
                ok: false,
                message: 'El email ya está registrado por otro usuario',
              });
            }

            updates.push('email = ?');
            values.push(email);

            // Continuar con la actualización después de verificar email
            proceedWithUpdate();
          },
        );
      } else {
        proceedWithUpdate();
      }

      function proceedWithUpdate() {
        if (status !== undefined) {
          updates.push('status = ?');
          values.push(status);
        }

        if (updates.length === 0) {
          return res.status(400).json({
            ok: false,
            message: 'No hay campos para actualizar',
          });
        }

        // Verificar si la columna updated_at existe antes de usarla
        db.all('PRAGMA table_info(users)', (err, columns) => {
          if (!err && columns && Array.isArray(columns)) {
            const hasUpdatedAt = columns.some((col) => col.name === 'updated_at');
            if (hasUpdatedAt) {
              updates.push('updated_at = CURRENT_TIMESTAMP');
            }
          }

          values.push(id);
          const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

          db.run(query, values, function (err) {
            if (err) {
              console.error('Error al actualizar docente:', err.message);
              return res.status(500).json({
                ok: false,
                message: 'Error al actualizar docente',
                error: err.message,
              });
            }

            res.json({
              ok: true,
              message: 'Docente actualizado exitosamente',
            });
          });
        });
      }
    },
  );
};

// Eliminar docente (borrado lógico o físico)
const deleteTeacher = (req, res) => {
  const { id } = req.params;
  const { hard_delete } = req.query;

  // Primero verificar si el docente tiene clases asignadas
  db.get('SELECT COUNT(*) as count FROM classes WHERE teacher_id = ?', [id], (err, classCount) => {
    if (err) {
      console.error('Error al verificar clases del docente:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al eliminar docente',
        error: err.message,
      });
    }

    if (hard_delete === 'true' && classCount.count > 0) {
      return res.status(400).json({
        ok: false,
        message:
          'No se puede eliminar el docente porque tiene clases asignadas. Primero reasigne o elimine sus clases.',
      });
    }

    db.get(
      `SELECT u.id FROM users u INNER JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND r.name = 'teacher'`,
      [id],
      (err, teacher) => {
        if (err) {
          console.error('Error al verificar docente:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al eliminar docente',
          });
        }

        if (!teacher) {
          return res.status(404).json({
            ok: false,
            message: 'Docente no encontrado',
          });
        }

        if (hard_delete === 'true') {
          // Primero actualizar las clases para que no tengan teacher_id (opcional, depende de la lógica de negocio)
          db.run('UPDATE classes SET teacher_id = NULL WHERE teacher_id = ?', [id], (err) => {
            if (err) {
              console.error('Error al actualizar clases del docente:', err.message);
              return res.status(500).json({
                ok: false,
                message: 'Error al eliminar docente',
                error: err.message,
              });
            }

            // Luego eliminar el usuario
            db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
              if (err) {
                console.error('Error al eliminar docente:', err.message);
                return res.status(500).json({
                  ok: false,
                  message: 'Error al eliminar docente',
                  error: err.message,
                });
              }

              res.json({
                ok: true,
                message: 'Docente eliminado permanentemente',
              });
            });
          });
        } else {
          // Borrado lógico: solo desactivar el usuario
          db.run('UPDATE users SET status = ? WHERE id = ?', ['inactive', id], function (err) {
            if (err) {
              console.error('Error al desactivar docente:', err.message);
              return res.status(500).json({
                ok: false,
                message: 'Error al desactivar docente',
                error: err.message,
              });
            }

            res.json({
              ok: true,
              message: 'Docente desactivado exitosamente',
            });
          });
        }
      },
    );
  });
};

// Cambiar contraseña de un docente
const changeTeacherPassword = (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({
      ok: false,
      message: 'La nueva contraseña es obligatoria',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      ok: false,
      message: 'La contraseña debe tener al menos 6 caracteres',
    });
  }

  // Verificar que el usuario existe y es docente
  db.get(
    `SELECT u.id FROM users u INNER JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND r.name = 'teacher'`,
    [id],
    (err, teacher) => {
      if (err) {
        console.error('Error al verificar docente:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al cambiar contraseña',
        });
      }

      if (!teacher) {
        return res.status(404).json({
          ok: false,
          message: 'Docente no encontrado',
        });
      }

      // Hashear la nueva contraseña
      const hashedPassword = bcrypt.hashSync(newPassword, SALT_ROUNDS);

      // Actualizar la contraseña
      db.run(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, id],
        function (err) {
          if (err) {
            console.error('Error al cambiar contraseña:', err.message);
            return res.status(500).json({
              ok: false,
              message: 'Error al cambiar contraseña',
              error: err.message,
            });
          }

          res.json({
            ok: true,
            message: 'Contraseña actualizada exitosamente',
          });
        },
      );
    },
  );
};

// module.exports
module.exports = {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  changeTeacherPassword,
};
