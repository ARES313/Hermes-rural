const bcrypt = require('bcryptjs');
const db = require('../database/db');

const SALT_ROUNDS = 10;

// Obtener todos los estudiantes (solo usuarios con role = student)
const getAllStudents = (req, res) => {
  const query = `
    SELECT u.id, u.full_name, u.email, u.status, u.created_at,
           r.name as role_name
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'student'
    ORDER BY u.full_name ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error al obtener estudiantes:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al obtener estudiantes',
        error: err.message,
      });
    }

    res.json({
      ok: true,
      count: rows.length,
      students: rows,
    });
  });
};

// Obtener un estudiante por ID
const getStudentById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT u.id, u.full_name, u.email, u.status, u.created_at,
           r.name as role_name
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE u.id = ? AND r.name = 'student'
  `;

  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Error al obtener estudiante:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al obtener estudiante',
        error: err.message,
      });
    }

    if (!row) {
      return res.status(404).json({
        ok: false,
        message: 'Estudiante no encontrado',
      });
    }

    res.json({
      ok: true,
      student: row,
    });
  });
};

// Crear un nuevo estudiante (usuario con rol student) - recibe password en texto plano
const createStudent = (req, res) => {
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

    // Obtener el role_id para 'student'
    db.get(`SELECT id FROM roles WHERE name = 'student'`, (err, roleRow) => {
      if (err) {
        console.error('Error al obtener rol student:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error interno del servidor',
        });
      }

      if (!roleRow) {
        return res.status(500).json({
          ok: false,
          message: 'Rol student no encontrado en la base de datos',
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
          console.error('Error al crear estudiante:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al crear estudiante',
            error: err.message,
          });
        }

        res.status(201).json({
          ok: true,
          message: 'Estudiante creado exitosamente',
          studentId: this.lastID,
        });
      });
    });
  });
};

// Actualizar un estudiante
const updateStudent = (req, res) => {
  const { id } = req.params;
  const { full_name, email, status } = req.body;

  // Verificar que el usuario existe y es estudiante
  db.get(
    `SELECT u.id FROM users u INNER JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND r.name = 'student'`,
    [id],
    (err, student) => {
      if (err) {
        console.error('Error al verificar estudiante:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al actualizar estudiante',
        });
      }

      if (!student) {
        return res.status(404).json({
          ok: false,
          message: 'Estudiante no encontrado',
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
                message: 'Error al actualizar estudiante',
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
              console.error('Error al actualizar estudiante:', err.message);
              return res.status(500).json({
                ok: false,
                message: 'Error al actualizar estudiante',
                error: err.message,
              });
            }

            res.json({
              ok: true,
              message: 'Estudiante actualizado exitosamente',
            });
          });
        });
      }
    },
  );
};

// Eliminar estudiante (borrado lógico o físico)
const deleteStudent = (req, res) => {
  const { id } = req.params;
  const { hard_delete } = req.query;

  // Primero verificar si el estudiante tiene matrículas activas
  db.get(
    'SELECT COUNT(*) as count FROM class_enrollments WHERE student_id = ? AND status = "active"',
    [id],
    (err, enrollmentCount) => {
      if (err) {
        console.error('Error al verificar matrículas:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al eliminar estudiante',
          error: err.message,
        });
      }

      if (hard_delete === 'true' && enrollmentCount.count > 0) {
        return res.status(400).json({
          ok: false,
          message:
            'No se puede eliminar el estudiante porque tiene matrículas activas. Primero retire al estudiante de todas las clases.',
        });
      }

      db.get(
        `SELECT u.id FROM users u INNER JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND r.name = 'student'`,
        [id],
        (err, student) => {
          if (err) {
            console.error('Error al verificar estudiante:', err.message);
            return res.status(500).json({
              ok: false,
              message: 'Error al eliminar estudiante',
            });
          }

          if (!student) {
            return res.status(404).json({
              ok: false,
              message: 'Estudiante no encontrado',
            });
          }

          if (hard_delete === 'true') {
            // Primero eliminar las matrículas (borrado físico)
            db.run('DELETE FROM class_enrollments WHERE student_id = ?', [id], (err) => {
              if (err) {
                console.error('Error al eliminar matrículas:', err.message);
                return res.status(500).json({
                  ok: false,
                  message: 'Error al eliminar estudiante',
                  error: err.message,
                });
              }

              // Luego eliminar el usuario
              db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
                if (err) {
                  console.error('Error al eliminar estudiante:', err.message);
                  return res.status(500).json({
                    ok: false,
                    message: 'Error al eliminar estudiante',
                    error: err.message,
                  });
                }

                res.json({
                  ok: true,
                  message: 'Estudiante eliminado permanentemente',
                });
              });
            });
          } else {
            // Borrado lógico: solo desactivar el usuario (las matrículas quedan pero con status 'removed' si se quiere)
            db.run('UPDATE users SET status = ? WHERE id = ?', ['inactive', id], function (err) {
              if (err) {
                console.error('Error al desactivar estudiante:', err.message);
                return res.status(500).json({
                  ok: false,
                  message: 'Error al desactivar estudiante',
                  error: err.message,
                });
              }

              res.json({
                ok: true,
                message: 'Estudiante desactivado exitosamente',
              });
            });
          }
        },
      );
    },
  );
};

// Obtener estudiantes de una clase específica (solo matrículas activas)
const getStudentsByClass = (req, res) => {
  const { id: classId } = req.params;

  // Verificar que la clase existe
  db.get('SELECT id FROM classes WHERE id = ?', [classId], (err, classExists) => {
    if (err) {
      console.error('Error al verificar clase:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al obtener estudiantes de la clase',
      });
    }

    if (!classExists) {
      return res.status(404).json({
        ok: false,
        message: 'Clase no encontrada',
      });
    }

    const query = `
      SELECT u.id, u.full_name, u.email, ce.enrolled_at, ce.status as enrollment_status
      FROM users u
      INNER JOIN class_enrollments ce ON u.id = ce.student_id
      INNER JOIN roles r ON u.role_id = r.id
      WHERE ce.class_id = ? AND r.name = 'student' AND ce.status = 'active'
      ORDER BY u.full_name ASC
    `;

    db.all(query, [classId], (err, rows) => {
      if (err) {
        console.error('Error al obtener estudiantes de la clase:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al obtener estudiantes de la clase',
          error: err.message,
        });
      }

      res.json({
        ok: true,
        count: rows.length,
        classId: parseInt(classId),
        students: rows,
      });
    });
  });
};

// Asignar estudiante a una clase (con verificación previa)
const assignStudentToClass = (req, res) => {
  const { id: classId } = req.params;
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({
      ok: false,
      message: 'studentId es requerido',
    });
  }

  // Verificar que la clase existe
  db.get('SELECT id FROM classes WHERE id = ?', [classId], (err, classExists) => {
    if (err) {
      console.error('Error al verificar clase:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al asignar estudiante',
      });
    }

    if (!classExists) {
      return res.status(404).json({
        ok: false,
        message: 'Clase no encontrada',
      });
    }

    // Verificar que el estudiante existe y es estudiante
    db.get(
      `SELECT u.id FROM users u INNER JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND r.name = 'student'`,
      [studentId],
      (err, studentExists) => {
        if (err) {
          console.error('Error al verificar estudiante:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al asignar estudiante',
          });
        }

        if (!studentExists) {
          return res.status(404).json({
            ok: false,
            message: 'Estudiante no encontrado',
          });
        }

        // Verificar si ya existe la matrícula
        db.get(
          'SELECT id, status FROM class_enrollments WHERE class_id = ? AND student_id = ?',
          [classId, studentId],
          (err, existing) => {
            if (err) {
              console.error('Error al verificar matrícula existente:', err.message);
              return res.status(500).json({
                ok: false,
                message: 'Error al asignar estudiante a la clase',
              });
            }

            if (existing) {
              if (existing.status === 'active') {
                return res.status(400).json({
                  ok: false,
                  message: 'El estudiante ya está asignado a esta clase',
                });
              } else {
                // Reactivar matrícula existente pero inactiva
                db.run(
                  'UPDATE class_enrollments SET status = ?, enrolled_at = CURRENT_TIMESTAMP WHERE class_id = ? AND student_id = ?',
                  ['active', classId, studentId],
                  function (err) {
                    if (err) {
                      console.error('Error al reactivar matrícula:', err.message);
                      return res.status(500).json({
                        ok: false,
                        message: 'Error al reactivar matrícula',
                        error: err.message,
                      });
                    }

                    res.status(200).json({
                      ok: true,
                      message: 'Matrícula reactivada exitosamente',
                    });
                  },
                );
                return;
              }
            }

            // Insertar nueva matrícula
            const query = `
          INSERT INTO class_enrollments (class_id, student_id, status)
          VALUES (?, ?, 'active')
        `;

            db.run(query, [classId, studentId], function (err) {
              if (err) {
                console.error('Error al asignar estudiante a clase:', err.message);
                return res.status(500).json({
                  ok: false,
                  message: 'Error al asignar estudiante a la clase',
                  error: err.message,
                });
              }

              res.status(201).json({
                ok: true,
                message: 'Estudiante asignado a la clase exitosamente',
              });
            });
          },
        );
      },
    );
  });
};

// Quitar estudiante de una clase
const removeStudentFromClass = (req, res) => {
  const { id: classId, studentId } = req.params;
  const { hard_delete } = req.query;

  // Verificar que la asignación existe
  db.get(
    'SELECT status FROM class_enrollments WHERE class_id = ? AND student_id = ?',
    [classId, studentId],
    (err, enrollment) => {
      if (err) {
        console.error('Error al verificar asignación:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al quitar estudiante de la clase',
        });
      }

      if (!enrollment) {
        return res.status(404).json({
          ok: false,
          message: 'El estudiante no está asignado a esta clase',
        });
      }

      if (hard_delete === 'true') {
        db.run(
          'DELETE FROM class_enrollments WHERE class_id = ? AND student_id = ?',
          [classId, studentId],
          function (err) {
            if (err) {
              console.error('Error al eliminar asignación:', err.message);
              return res.status(500).json({
                ok: false,
                message: 'Error al quitar estudiante de la clase',
                error: err.message,
              });
            }

            res.json({
              ok: true,
              message: 'Estudiante removido de la clase permanentemente',
            });
          },
        );
      } else {
        db.run(
          'UPDATE class_enrollments SET status = ? WHERE class_id = ? AND student_id = ?',
          ['removed', classId, studentId],
          function (err) {
            if (err) {
              console.error('Error al desactivar asignación:', err.message);
              return res.status(500).json({
                ok: false,
                message: 'Error al quitar estudiante de la clase',
                error: err.message,
              });
            }

            res.json({
              ok: true,
              message: 'Estudiante removido de la clase (desactivado)',
            });
          },
        );
      }
    },
  );
};

// Cambiar contraseña de un estudiante
const changeStudentPassword = (req, res) => {
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

  // Verificar que el usuario existe y es estudiante
  db.get(
    `SELECT u.id FROM users u INNER JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND r.name = 'student'`,
    [id],
    (err, student) => {
      if (err) {
        console.error('Error al verificar estudiante:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al cambiar contraseña',
        });
      }

      if (!student) {
        return res.status(404).json({
          ok: false,
          message: 'Estudiante no encontrado',
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

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByClass,
  assignStudentToClass,
  removeStudentFromClass,
  changeStudentPassword,
};
