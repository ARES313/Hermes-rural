const fs = require('fs');
const path = require('path');
const db = require('../database/db');

// Helper: generar slug del nombre de la clase
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[áäàâ]/g, 'a')
    .replace(/[éëèê]/g, 'e')
    .replace(/[íïìî]/g, 'i')
    .replace(/[óöòô]/g, 'o')
    .replace(/[úüùû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// Helper: verificar que el docente es dueño de la clase
const verifyTeacherOwnership = (classId, teacherId, callback) => {
  db.get(
    'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
    [classId, teacherId],
    (err, row) => {
      if (err) return callback(err);
      if (!row)
        return callback({ status: 403, message: 'No tienes permiso para acceder a esta clase' });
      callback(null, true);
    },
  );
};

// Helper: construir path con slugs
const buildFolderPath = (parentId, slug, callback) => {
  if (!parentId) {
    callback(null, `/${slug}`);
    return;
  }

  db.get('SELECT path FROM class_folders WHERE id = ?', [parentId], (err, parent) => {
    if (err || !parent) {
      callback(err || new Error('Carpeta padre no encontrada'));
      return;
    }
    callback(null, `${parent.path}/${slug}`);
  });
};

// Obtener mis clases (docente autenticado)
const getMyClasses = (req, res) => {
  const teacherId = req.user.id;

  const query = `
        SELECT c.*, u.full_name as teacher_name 
        FROM classes c
        INNER JOIN users u ON c.teacher_id = u.id
        WHERE c.teacher_id = ?
        ORDER BY c.created_at DESC
    `;

  db.all(query, [teacherId], (err, rows) => {
    if (err) {
      console.error('Error al obtener mis clases:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al obtener las clases',
        error: err.message,
      });
    }

    res.json({
      ok: true,
      count: rows.length,
      classes: rows,
    });
  });
};

// ==================== CONTENIDO ====================

// Listar contenido de una clase
const getClassContent = (req, res) => {
  const { id: classId } = req.params;
  const { folder_id } = req.query;
  const userId = req.user.id;
  const userRole = req.user.role_name;

  // Validar y normalizar folder_id
  let normalizedFolderId = null;
  if (
    folder_id !== undefined &&
    folder_id !== null &&
    folder_id !== '' &&
    folder_id !== 'null' &&
    folder_id !== 'undefined'
  ) {
    const parsedId = parseInt(folder_id, 10);
    if (Number.isNaN(parsedId)) {
      return res.status(400).json({
        ok: false,
        message: 'folder_id inválido',
      });
    }
    normalizedFolderId = parsedId;
  }

  // Verificar permisos
  const checkQuery =
    userRole === 'admin'
      ? 'SELECT id, name FROM classes WHERE id = ?'
      : 'SELECT id, name FROM classes WHERE id = ? AND teacher_id = ?';

  const params = userRole === 'admin' ? [classId] : [classId, userId];

  db.get(checkQuery, params, (err, classRow) => {
    if (err) {
      console.error('Error al verificar clase:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al obtener contenido',
        error: err.message,
      });
    }

    if (!classRow) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permiso para ver esta clase',
      });
    }

    // Obtener información de la carpeta actual (si aplica)
    let folderInfo = null;
    const getFolderInfo = (callback) => {
      if (!normalizedFolderId) {
        callback(null);
        return;
      }

      db.get(
        `
                SELECT f.*, u.full_name as created_by_name,
                       (SELECT COUNT(*) FROM class_folders WHERE parent_id = f.id) as child_count
                FROM class_folders f
                LEFT JOIN users u ON f.created_by = u.id
                WHERE f.id = ? AND f.class_id = ?
            `,
        [normalizedFolderId, classId],
        (err, folder) => {
          if (err) {
            callback(err);
          } else if (folder) {
            folderInfo = folder;
            callback(null);
          } else {
            callback(new Error('Carpeta no encontrada'));
          }
        },
      );
    };

    getFolderInfo((err) => {
      if (err) {
        console.error('Error al obtener carpeta:', err.message);
        return res.status(404).json({
          ok: false,
          message:
            err.message === 'Carpeta no encontrada'
              ? 'La carpeta especificada no existe'
              : 'Error al obtener información de la carpeta',
        });
      }

      // Construir query según folder_id
      let contentQuery;
      let queryParams;

      if (normalizedFolderId) {
        contentQuery = `
                    SELECT cc.*, u.full_name as uploaded_by_name
                    FROM class_content cc
                    INNER JOIN users u ON cc.uploaded_by = u.id
                    WHERE cc.class_id = ? AND cc.folder_id = ?
                    ORDER BY cc.uploaded_at DESC
                `;
        queryParams = [classId, normalizedFolderId];
      } else {
        // Raíz: folder_id IS NULL
        contentQuery = `
                    SELECT cc.*, u.full_name as uploaded_by_name
                    FROM class_content cc
                    INNER JOIN users u ON cc.uploaded_by = u.id
                    WHERE cc.class_id = ? AND cc.folder_id IS NULL
                    ORDER BY cc.uploaded_at DESC
                `;
        queryParams = [classId];
      }

      db.all(contentQuery, queryParams, (err, rows) => {
        if (err) {
          console.error('Error al obtener contenido:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al obtener contenido',
            error: err.message,
          });
        }

        // Filtrar archivos que existen físicamente
        const validContent = (rows || []).filter((file) => {
          const slug = generateSlug(classRow.name);
          const exists = contentFileExists(slug, file.folder_path, file.filename);
          if (!exists) {
            console.warn(`Archivo huérfano omitido: ${file.filename} (id: ${file.id})`);
          }
          return exists;
        });

        res.json({
          ok: true,
          count: validContent.length,
          folder: folderInfo,
          content: validContent,
        });
      });
    });
  });
};

// Subir contenido a una clase
const uploadContent = (req, res) => {
  const { id: classId } = req.params;
  const { folder_id, description } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role_name;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      ok: false,
      message: 'No se ha subido ningún archivo',
    });
  }

  // Validar y normalizar folder_id
  let normalizedFolderId = null;
  if (
    folder_id !== undefined &&
    folder_id !== null &&
    folder_id !== '' &&
    folder_id !== 'null' &&
    folder_id !== 'undefined'
  ) {
    const parsedId = parseInt(folder_id, 10);
    if (Number.isNaN(parsedId)) {
      return res.status(400).json({
        ok: false,
        message: 'folder_id inválido',
      });
    }
    normalizedFolderId = parsedId;
  }

  // Verificar permisos
  const checkQuery =
    userRole === 'admin'
      ? 'SELECT id, name FROM classes WHERE id = ?'
      : 'SELECT id, name FROM classes WHERE id = ? AND teacher_id = ?';

  const params = userRole === 'admin' ? [classId] : [classId, userId];

  db.get(checkQuery, params, (err, classRow) => {
    if (err) {
      console.error('Error al verificar clase:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al subir archivo',
        error: err.message,
      });
    }

    if (!classRow) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permiso para subir contenido a esta clase',
      });
    }

    const slug = generateSlug(classRow.name);

    // Función para procesar después de verificar carpeta
    const processUpload = (folderPathSegments = '') => {
      let uploadDir = path.join(__dirname, '../../storage/clases', slug, 'contenido');

      if (folderPathSegments) {
        uploadDir = path.join(uploadDir, folderPathSegments);
      }

      // Crear directorio si no existe
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const targetPath = path.join(uploadDir, file.filename);

      // Mover archivo
      try {
        fs.renameSync(file.path, targetPath);
      } catch (moveErr) {
        console.error('Error al mover archivo:', moveErr.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al mover el archivo',
          error: moveErr.message,
        });
      }

      // Guardar en base de datos
      const insertQuery = `
                INSERT INTO class_content (class_id, folder_id, filename, original_name, file_type, file_size, uploaded_by, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

      db.run(
        insertQuery,
        [
          classId,
          normalizedFolderId,
          file.filename,
          file.originalname,
          file.mimetype,
          file.size,
          userId,
          description || null,
        ],
        function (err) {
          if (err) {
            console.error('Error al guardar contenido:', err.message);
            // Si falla la BD, intentar eliminar el archivo huérfano
            try {
              if (fs.existsSync(targetPath)) {
                fs.unlinkSync(targetPath);
                console.log('Archivo huérfano eliminado:', targetPath);
              }
            } catch (cleanupErr) {
              console.error('Error al limpiar archivo huérfano:', cleanupErr.message);
            }
            return res.status(500).json({
              ok: false,
              message: 'Error al guardar el archivo',
              error: err.message,
            });
          }

          res.status(201).json({
            ok: true,
            message: 'Archivo subido exitosamente',
            contentId: this.lastID,
            folder_id: normalizedFolderId,
            file: {
              filename: file.filename,
              original_name: file.originalname,
              size: file.size,
              type: file.mimetype,
            },
          });
        },
      );
    };

    // Si hay folder_id, verificar que existe
    if (normalizedFolderId) {
      const folderQuery = `
                SELECT f.*, c.name as class_name 
                FROM class_folders f
                INNER JOIN classes c ON f.class_id = c.id
                WHERE f.id = ? AND f.class_id = ?
            `;

      db.get(folderQuery, [normalizedFolderId, classId], (err, folder) => {
        if (err) {
          console.error('Error al verificar carpeta:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al verificar la carpeta',
            error: err.message,
          });
        }

        if (!folder) {
          return res.status(404).json({
            ok: false,
            message: 'La carpeta especificada no existe en esta clase',
          });
        }

        // Construir path relativo (sin el slash inicial)
        const relativePath = folder.path.startsWith('/') ? folder.path.substring(1) : folder.path;
        processUpload(relativePath);
      });
    } else {
      // Subir a raíz
      processUpload('');
    }
  });
};

// Eliminar contenido de una clase
const deleteContent = (req, res) => {
  const { id: classId, fileId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role_name;

  // Obtener información del archivo con datos de la carpeta y clase
  const contentQuery = `
        SELECT cc.*, c.name as class_name, cf.path as folder_path
        FROM class_content cc
        INNER JOIN classes c ON cc.class_id = c.id
        LEFT JOIN class_folders cf ON cc.folder_id = cf.id
        WHERE cc.id = ? AND cc.class_id = ?
    `;

  db.get(contentQuery, [fileId, classId], (err, content) => {
    if (err) {
      console.error('Error al obtener contenido:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al eliminar archivo',
        error: err.message,
      });
    }

    if (!content) {
      return res.status(404).json({
        ok: false,
        message: 'Archivo no encontrado',
      });
    }

    // Verificar permisos
    if (userRole !== 'admin' && content.uploaded_by !== userId) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permiso para eliminar este archivo',
      });
    }

    // Construir ruta física del archivo
    const slug = generateSlug(content.class_name);
    let filePath = path.join(__dirname, '../../storage/clases', slug, 'contenido');

    if (content.folder_path) {
      // Quitar slash inicial si existe
      const relativePath = content.folder_path.startsWith('/')
        ? content.folder_path.substring(1)
        : content.folder_path;
      filePath = path.join(filePath, relativePath, content.filename);
    } else {
      filePath = path.join(filePath, content.filename);
    }

    // Eliminar de base de datos primero
    db.run('DELETE FROM class_content WHERE id = ?', [fileId], function (err) {
      if (err) {
        console.error('Error al eliminar contenido:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al eliminar archivo de la base de datos',
          error: err.message,
        });
      }

      // Si la BD se eliminó correctamente, intentar eliminar el archivo físico
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.error('Error al eliminar archivo físico:', unlinkErr.message);
          // No fallamos la respuesta porque la BD ya está limpia
        }
      }

      res.json({
        ok: true,
        message: 'Archivo eliminado exitosamente',
      });
    });
  });
};

// ==================== QUIZZES ====================

// Listar quizzes de una clase
const getClassQuizzes = (req, res) => {
  const { id: classId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role_name;

  const checkQuery =
    userRole === 'admin'
      ? 'SELECT id FROM classes WHERE id = ?'
      : 'SELECT id FROM classes WHERE id = ? AND teacher_id = ?';

  const params = userRole === 'admin' ? [classId] : [classId, userId];

  db.get(checkQuery, params, (err, classRow) => {
    if (err) {
      console.error('Error al verificar clase:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al obtener quizzes',
        error: err.message,
      });
    }

    if (!classRow) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permiso para ver esta clase',
      });
    }

    const query = `
            SELECT q.*, u.full_name as teacher_name
            FROM quizzes q
            INNER JOIN users u ON q.teacher_id = u.id
            WHERE q.class_id = ?
            ORDER BY q.created_at DESC
        `;

    db.all(query, [classId], (err, rows) => {
      if (err) {
        console.error('Error al obtener quizzes:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al obtener quizzes',
          error: err.message,
        });
      }

      res.json({
        ok: true,
        count: rows.length,
        quizzes: rows,
      });
    });
  });
};

// Crear quiz con preguntas
const createQuiz = (req, res) => {
  const { id: classId } = req.params;
  const userId = req.user.id;
  const { title, description, questions } = req.body;

  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({
      ok: false,
      message: 'Título y preguntas son obligatorios',
    });
  }

  // Verificar que el docente es dueño de la clase
  verifyTeacherOwnership(classId, userId, (err) => {
    if (err) {
      return res.status(err.status || 500).json({
        ok: false,
        message: err.message || 'Error al verificar permisos',
      });
    }

    // Crear quiz
    db.run(
      'INSERT INTO quizzes (class_id, teacher_id, title, description, status) VALUES (?, ?, ?, ?, ?)',
      [classId, userId, title, description || null, 'draft'],
      function (err) {
        if (err) {
          console.error('Error al crear quiz:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al crear el quiz',
            error: err.message,
          });
        }

        const quizId = this.lastID;

        // Insertar preguntas
        let questionsInserted = 0;
        const insertQuestion = (question, index) => {
          db.run(
            `INSERT INTO quiz_questions 
                        (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, order_index)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              quizId,
              question.question_text,
              question.option_a,
              question.option_b,
              question.option_c,
              question.option_d,
              question.correct_answer,
              index,
            ],
            (err) => {
              if (err) {
                console.error('Error al insertar pregunta:', err.message);
                return;
              }
              questionsInserted++;
              if (questionsInserted === questions.length) {
                res.status(201).json({
                  ok: true,
                  message: 'Quiz creado exitosamente',
                  quizId: quizId,
                });
              }
            },
          );
        };

        questions.forEach((q, idx) => insertQuestion(q, idx));
      },
    );
  });
};

// Obtener quiz con preguntas
const getQuizById = (req, res) => {
  const { id: quizId } = req.params;

  db.get('SELECT * FROM quizzes WHERE id = ?', [quizId], (err, quiz) => {
    if (err) {
      console.error('Error al obtener quiz:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al obtener el quiz',
        error: err.message,
      });
    }

    if (!quiz) {
      return res.status(404).json({
        ok: false,
        message: 'Quiz no encontrado',
      });
    }

    db.all(
      'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index ASC',
      [quizId],
      (err, questions) => {
        if (err) {
          console.error('Error al obtener preguntas:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al obtener las preguntas',
            error: err.message,
          });
        }

        res.json({
          ok: true,
          quiz: {
            ...quiz,
            questions: questions,
          },
        });
      },
    );
  });
};

// Cambiar estado del quiz
const updateQuizStatus = (req, res) => {
  const { id: quizId } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  if (!['draft', 'active', 'closed'].includes(status)) {
    return res.status(400).json({
      ok: false,
      message: 'Estado inválido. Debe ser draft, active o closed',
    });
  }

  // Verificar que el docente es dueño del quiz
  db.get(
    'SELECT q.*, c.teacher_id FROM quizzes q INNER JOIN classes c ON q.class_id = c.id WHERE q.id = ?',
    [quizId],
    (err, quiz) => {
      if (err) {
        console.error('Error al verificar quiz:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al actualizar el quiz',
          error: err.message,
        });
      }

      if (!quiz) {
        return res.status(404).json({
          ok: false,
          message: 'Quiz no encontrado',
        });
      }

      if (quiz.teacher_id !== userId && req.user.role_name !== 'admin') {
        return res.status(403).json({
          ok: false,
          message: 'No tienes permiso para modificar este quiz',
        });
      }

      db.run('UPDATE quizzes SET status = ? WHERE id = ?', [status, quizId], function (err) {
        if (err) {
          console.error('Error al actualizar estado:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al actualizar el estado',
            error: err.message,
          });
        }

        res.json({
          ok: true,
          message: `Quiz ${status === 'active' ? 'publicado' : status === 'closed' ? 'cerrado' : 'guardado como borrador'} exitosamente`,
        });
      });
    },
  );
};

// ==================== TAREAS ====================

// Listar tareas de una clase
const getClassTasks = (req, res) => {
  const { id: classId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role_name;

  const checkQuery =
    userRole === 'admin'
      ? 'SELECT id FROM classes WHERE id = ?'
      : 'SELECT id FROM classes WHERE id = ? AND teacher_id = ?';

  const params = userRole === 'admin' ? [classId] : [classId, userId];

  db.get(checkQuery, params, (err, classRow) => {
    if (err) {
      console.error('Error al verificar clase:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al obtener tareas',
        error: err.message,
      });
    }

    if (!classRow) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permiso para ver esta clase',
      });
    }

    const query = `
            SELECT t.*, u.full_name as teacher_name
            FROM tasks t
            INNER JOIN users u ON t.teacher_id = u.id
            WHERE t.class_id = ?
            ORDER BY t.created_at DESC
        `;

    db.all(query, [classId], (err, rows) => {
      if (err) {
        console.error('Error al obtener tareas:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al obtener tareas',
          error: err.message,
        });
      }

      res.json({
        ok: true,
        count: rows.length,
        tasks: rows,
      });
    });
  });
};

// Crear tarea
const createTask = (req, res) => {
  const { id: classId } = req.params;
  const userId = req.user.id;
  const { title, description, due_date } = req.body;

  if (!title) {
    return res.status(400).json({
      ok: false,
      message: 'El título es obligatorio',
    });
  }

  verifyTeacherOwnership(classId, userId, (err) => {
    if (err) {
      return res.status(err.status || 500).json({
        ok: false,
        message: err.message || 'Error al verificar permisos',
      });
    }

    db.run(
      `INSERT INTO tasks (class_id, teacher_id, title, description, due_date, status)
                VALUES (?, ?, ?, ?, ?, 'active')`,
      [classId, userId, title, description || null, due_date || null],
      function (err) {
        if (err) {
          console.error('Error al crear tarea:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al crear la tarea',
            error: err.message,
          });
        }

        res.status(201).json({
          ok: true,
          message: 'Tarea creada exitosamente',
          taskId: this.lastID,
        });
      },
    );
  });
};

// Editar tarea
const updateTask = (req, res) => {
  const { id: taskId } = req.params;
  const userId = req.user.id;
  const { title, description, due_date, status } = req.body;

  db.get(
    'SELECT t.*, c.teacher_id FROM tasks t INNER JOIN classes c ON t.class_id = c.id WHERE t.id = ?',
    [taskId],
    (err, task) => {
      if (err) {
        console.error('Error al verificar tarea:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al actualizar la tarea',
          error: err.message,
        });
      }

      if (!task) {
        return res.status(404).json({
          ok: false,
          message: 'Tarea no encontrada',
        });
      }

      if (task.teacher_id !== userId && req.user.role_name !== 'admin') {
        return res.status(403).json({
          ok: false,
          message: 'No tienes permiso para modificar esta tarea',
        });
      }

      const updates = [];
      const values = [];

      if (title !== undefined) {
        updates.push('title = ?');
        values.push(title);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }
      if (due_date !== undefined) {
        updates.push('due_date = ?');
        values.push(due_date);
      }
      if (status !== undefined && ['active', 'closed'].includes(status)) {
        updates.push('status = ?');
        values.push(status);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          ok: false,
          message: 'No hay campos para actualizar',
        });
      }

      values.push(taskId);
      const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;

      db.run(query, values, function (err) {
        if (err) {
          console.error('Error al actualizar tarea:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al actualizar la tarea',
            error: err.message,
          });
        }

        res.json({
          ok: true,
          message: 'Tarea actualizada exitosamente',
        });
      });
    },
  );
};

// Eliminar tarea
const deleteTask = (req, res) => {
  const { id: taskId } = req.params;
  const userId = req.user.id;

  db.get(
    'SELECT t.*, c.teacher_id FROM tasks t INNER JOIN classes c ON t.class_id = c.id WHERE t.id = ?',
    [taskId],
    (err, task) => {
      if (err) {
        console.error('Error al verificar tarea:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al eliminar la tarea',
          error: err.message,
        });
      }

      if (!task) {
        return res.status(404).json({
          ok: false,
          message: 'Tarea no encontrada',
        });
      }

      if (task.teacher_id !== userId && req.user.role_name !== 'admin') {
        return res.status(403).json({
          ok: false,
          message: 'No tienes permiso para eliminar esta tarea',
        });
      }

      db.run('DELETE FROM tasks WHERE id = ?', [taskId], function (err) {
        if (err) {
          console.error('Error al eliminar tarea:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al eliminar la tarea',
            error: err.message,
          });
        }

        res.json({
          ok: true,
          message: 'Tarea eliminada exitosamente',
        });
      });
    },
  );
};

// ==================== ENTREGAS DE TAREAS (DOCENTE) ====================

// Ver todas las entregas de una tarea
const getTaskSubmissions = (req, res) => {
  const { id: taskId } = req.params;
  const userId = req.user.id;

  db.get(
    `SELECT t.*, c.teacher_id FROM tasks t 
            INNER JOIN classes c ON t.class_id = c.id 
            WHERE t.id = ?`,
    [taskId],
    (err, task) => {
      if (err || !task) {
        return res.status(404).json({ ok: false, message: 'Tarea no encontrada' });
      }
      if (task.teacher_id !== userId && req.user.role_name !== 'admin') {
        return res.status(403).json({ ok: false, message: 'Sin permiso' });
      }

      const query = `
            SELECT ts.*, u.full_name as student_name, u.email as student_email
            FROM task_submissions ts
            INNER JOIN users u ON ts.student_id = u.id
            WHERE ts.task_id = ?
            ORDER BY ts.submitted_at DESC
        `;
      db.all(query, [taskId], (err, rows) => {
        if (err) return res.status(500).json({ ok: false, message: 'Error al obtener entregas' });
        res.json({ ok: true, submissions: rows });
      });
    },
  );
};

const viewTaskSubmission = (req, res) => {
  const submissionId = req.params.id;
  const userId = req.user.id;

  const query = `
        SELECT
            ts.*,
            t.class_id,
            c.name AS class_name,
            c.teacher_id
        FROM task_submissions ts
        INNER JOIN tasks t ON ts.task_id = t.id
        INNER JOIN classes c ON t.class_id = c.id
        WHERE ts.id = ?
    `;

  db.get(query, [submissionId], (err, submission) => {
    if (err) {
      console.error('Error al obtener entrega:', err.message);
      return res.status(500).json({ ok: false, message: 'Error al obtener entrega' });
    }

    if (!submission) {
      return res.status(404).json({ ok: false, message: 'Entrega no encontrada' });
    }

    if (submission.teacher_id !== userId && req.user.role_name !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Sin permiso' });
    }

    const classSlug = generateSlug(submission.class_name);
    const filePath = path.join(
      __dirname,
      '../../storage/clases',
      classSlug,
      'entregas',
      String(submission.student_id),
      submission.filename,
    );

    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ ok: false, message: 'Archivo no existe en el servidor', filePath });
    }

    if (submission.file_type) {
      res.setHeader('Content-Type', submission.file_type);
    }

    return res.sendFile(filePath);
  });
};

const downloadTaskSubmission = (req, res) => {
  const submissionId = req.params.id;
  const userId = req.user.id;

  const query = `
        SELECT
            ts.*,
            t.class_id,
            c.name AS class_name,
            c.teacher_id
        FROM task_submissions ts
        INNER JOIN tasks t ON ts.task_id = t.id
        INNER JOIN classes c ON t.class_id = c.id
        WHERE ts.id = ?
    `;

  db.get(query, [submissionId], (err, submission) => {
    if (err) {
      console.error('Error al obtener entrega:', err.message);
      return res.status(500).json({ ok: false, message: 'Error al obtener entrega' });
    }

    if (!submission) {
      return res.status(404).json({ ok: false, message: 'Entrega no encontrada' });
    }

    if (submission.teacher_id !== userId && req.user.role_name !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Sin permiso' });
    }

    const classSlug = generateSlug(submission.class_name);
    const filePath = path.join(
      __dirname,
      '../../storage/clases',
      classSlug,
      'entregas',
      String(submission.student_id),
      submission.filename,
    );

    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ ok: false, message: 'Archivo no existe en el servidor', filePath });
    }

    return res.download(filePath, submission.original_name || submission.filename);
  });
};

// Calificar una entrega
const gradeSubmission = (req, res) => {
  const { id: submissionId } = req.params; // ← CAMBIADO: usa 'id' en lugar de 'submissionId'
  const userId = req.user.id;
  const { grade, feedback } = req.body;

  console.log('📝 Calificando submission ID:', submissionId); // ← Agrega log para depurar
  console.log('📝 Grade:', grade);
  console.log('📝 Feedback:', feedback);

  if (grade === undefined || grade === null) {
    return res.status(400).json({ ok: false, message: 'La nota es obligatoria' });
  }
  if (grade < 0 || grade > 100) {
    return res.status(400).json({ ok: false, message: 'La nota debe estar entre 0 y 100' });
  }

  db.get(
    `SELECT ts.*, t.class_id, c.teacher_id 
            FROM task_submissions ts
            INNER JOIN tasks t ON ts.task_id = t.id
            INNER JOIN classes c ON t.class_id = c.id
            WHERE ts.id = ?`,
    [submissionId],
    (err, submission) => {
      if (err) {
        console.error('Error al buscar entrega:', err.message);
        return res.status(500).json({ ok: false, message: 'Error al calificar' });
      }
      if (!submission) {
        console.log('❌ Entrega no encontrada para ID:', submissionId);
        return res.status(404).json({ ok: false, message: 'Entrega no encontrada' });
      }
      if (submission.teacher_id !== userId && req.user.role_name !== 'admin') {
        return res.status(403).json({ ok: false, message: 'Sin permiso' });
      }

      db.run(
        `UPDATE task_submissions SET grade = ?, feedback = ?, graded_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [grade, feedback || null, submissionId],
        function (err) {
          if (err) {
            console.error('Error al actualizar calificación:', err.message);
            return res.status(500).json({ ok: false, message: 'Error al calificar' });
          }
          res.json({ ok: true, message: 'Entrega calificada exitosamente' });
        },
      );
    },
  );
};

// Ver resultado de quiz (docente ve todas las submissions de un quiz)
const getQuizSubmissions = (req, res) => {
  const { id: quizId } = req.params;
  const userId = req.user.id;

  db.get(
    `
        SELECT q.*, c.teacher_id
        FROM quizzes q
        INNER JOIN classes c ON q.class_id = c.id
        WHERE q.id = ?
    `,
    [quizId],
    (err, quiz) => {
      if (err) {
        console.error('Error al verificar quiz:', err.message);
        return res.status(500).json({ ok: false, message: 'Error al obtener resultados' });
      }

      if (!quiz) {
        return res.status(404).json({ ok: false, message: 'Quiz no encontrado' });
      }

      if (quiz.teacher_id !== userId && req.user.role_name !== 'admin') {
        return res.status(403).json({ ok: false, message: 'Sin permiso' });
      }

      const query = `
            SELECT
                qs.id,
                qs.quiz_id,
                qs.student_id,
                qs.score,
                qs.submitted_at AS finished_at,
                'submitted' AS status,
                u.full_name AS student_name,
                u.email AS student_email
            FROM quiz_submissions qs
            INNER JOIN users u ON qs.student_id = u.id
            WHERE qs.quiz_id = ?
            ORDER BY qs.score DESC, qs.submitted_at DESC
        `;

      db.all(query, [quizId], (err, rows) => {
        if (err) {
          console.error('Error al obtener resultados:', err.message);
          return res.status(500).json({ ok: false, message: 'Error al obtener resultados' });
        }

        return res.json({
          ok: true,
          submissions: rows || [],
        });
      });
    },
  );
};

// Docente asigna estudiante a su propia clase
const enrollStudentToMyClass = (req, res) => {
  const { id: classId } = req.params;
  const { studentId } = req.body;
  const teacherId = req.user.id;

  if (!studentId) {
    return res.status(400).json({ ok: false, message: 'studentId es requerido' });
  }

  db.get(
    'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
    [classId, teacherId],
    (err, classRow) => {
      if (err || !classRow) {
        return res.status(403).json({ ok: false, message: 'No tienes permiso sobre esta clase' });
      }

      db.get(
        'SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ?',
        [classId, studentId],
        (err, existing) => {
          if (existing) {
            return res
              .status(400)
              .json({ ok: false, message: 'El estudiante ya está matriculado' });
          }

          db.run(
            `INSERT INTO class_enrollments (class_id, student_id, status) VALUES (?, ?, 'active')`,
            [classId, studentId],
            function (err) {
              if (err)
                return res
                  .status(500)
                  .json({ ok: false, message: 'Error al matricular estudiante' });
              res.json({ ok: true, message: 'Estudiante matriculado exitosamente' });
            },
          );
        },
      );
    },
  );
};

// Docente ve estudiantes de su clase
const getMyClassStudents = (req, res) => {
  const { id: classId } = req.params;
  const teacherId = req.user.id;

  db.get(
    'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
    [classId, teacherId],
    (err, classRow) => {
      if (err || !classRow) {
        return res.status(403).json({ ok: false, message: 'No tienes permiso sobre esta clase' });
      }

      const query = `
            SELECT u.id, u.full_name, u.email, u.status, ce.status as enrollment_status, ce.enrolled_at
            FROM users u
            INNER JOIN class_enrollments ce ON u.id = ce.student_id
            WHERE ce.class_id = ? AND ce.status = 'active'
            ORDER BY u.full_name ASC
        `;
      db.all(query, [classId], (err, rows) => {
        if (err)
          return res.status(500).json({ ok: false, message: 'Error al obtener estudiantes' });
        res.json({ ok: true, students: rows });
      });
    },
  );
};

const getFolders = (req, res) => {
  const { id: classId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role_name;

  const checkQuery =
    userRole === 'admin'
      ? 'SELECT id FROM classes WHERE id = ?'
      : 'SELECT id FROM classes WHERE id = ? AND teacher_id = ?';

  const params = userRole === 'admin' ? [classId] : [classId, userId];

  db.get(checkQuery, params, (err, classRow) => {
    if (err) {
      console.error('Error al verificar clase:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al obtener carpetas',
        error: err.message,
      });
    }

    if (!classRow) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permiso para ver esta clase',
      });
    }

    const query = `
            SELECT f.*, u.full_name as created_by_name,
                   (SELECT COUNT(*) FROM class_content WHERE folder_id = f.id) as file_count,
                   (SELECT COUNT(*) FROM class_folders WHERE parent_id = f.id) as child_count
            FROM class_folders f
            INNER JOIN users u ON f.created_by = u.id
            WHERE f.class_id = ?
            ORDER BY f.path ASC
        `;

    db.all(query, [classId], (err, folders) => {
      if (err) {
        console.error('Error al obtener carpetas:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al obtener carpetas',
          error: err.message,
        });
      }

      const folderMap = new Map();
      const rootFolders = [];

      folders.forEach((folder) => {
        folder.children = [];
        folderMap.set(folder.id, folder);
      });

      folders.forEach((folder) => {
        if (folder.parent_id && folderMap.has(folder.parent_id)) {
          folderMap.get(folder.parent_id).children.push(folder);
        } else {
          rootFolders.push(folder);
        }
      });

      res.json({
        ok: true,
        folders: rootFolders,
        flat_folders: folders,
      });
    });
  });
};

const createFolder = (req, res) => {
  const { id: classId } = req.params;
  const { name, parent_id } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role_name;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      ok: false,
      message: 'El nombre de la carpeta es obligatorio',
    });
  }

  const sanitizedName = name
    .trim()
    .substring(0, 100)
    .replace(/[<>:"|?*]/g, '');
  if (sanitizedName.length === 0) {
    return res.status(400).json({
      ok: false,
      message: 'El nombre de la carpeta contiene caracteres inválidos',
    });
  }

  const slug = generateSlug(sanitizedName);
  if (slug.length === 0) {
    return res.status(400).json({
      ok: false,
      message: 'No se pudo generar un slug válido',
    });
  }

  let normalizedParentId = parent_id;
  if (parent_id === undefined || parent_id === null || parent_id === '' || parent_id === 0) {
    normalizedParentId = null;
  } else {
    normalizedParentId = parseInt(parent_id, 10);
    if (Number.isNaN(normalizedParentId)) {
      return res.status(400).json({
        ok: false,
        message: 'parent_id inválido',
      });
    }
  }

  const checkQuery =
    userRole === 'admin'
      ? 'SELECT id FROM classes WHERE id = ?'
      : 'SELECT id FROM classes WHERE id = ? AND teacher_id = ?';

  const params = userRole === 'admin' ? [classId] : [classId, userId];

  db.get(checkQuery, params, (err, classRow) => {
    if (err) {
      console.error('Error al verificar clase:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al crear carpeta',
        error: err.message,
      });
    }

    if (!classRow) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permiso para crear carpetas',
      });
    }

    if (normalizedParentId) {
      db.get(
        'SELECT id FROM class_folders WHERE id = ? AND class_id = ?',
        [normalizedParentId, classId],
        (err, parentFolder) => {
          if (err) {
            console.error('Error al verificar carpeta padre:', err.message);
            return res.status(500).json({
              ok: false,
              message: 'Error al crear carpeta',
              error: err.message,
            });
          }

          if (!parentFolder) {
            return res.status(400).json({
              ok: false,
              message: 'La carpeta padre no existe',
            });
          }

          proceedWithCreation();
        },
      );
    } else {
      proceedWithCreation();
    }

    function proceedWithCreation() {
      buildFolderPath(normalizedParentId, slug, (err, folderPath) => {
        if (err) {
          console.error('Error al construir path:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al crear carpeta',
            error: err.message,
          });
        }

        const insertQuery = `
                    INSERT INTO class_folders (class_id, name, slug, parent_id, path, created_by)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;

        db.run(
          insertQuery,
          [classId, sanitizedName, slug, normalizedParentId, folderPath, userId],
          function (err) {
            if (err) {
              console.error('Error al insertar carpeta:', err.message);
              if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({
                  ok: false,
                  message: `Ya existe una carpeta con el nombre "${sanitizedName}" en esta ubicación`,
                });
              }
              return res.status(500).json({
                ok: false,
                message: 'Error al crear carpeta',
                error: err.message,
              });
            }

            res.status(201).json({
              ok: true,
              message: 'Carpeta creada exitosamente',
              folder: {
                id: this.lastID,
                name: sanitizedName,
                slug,
                parent_id: normalizedParentId,
                path: folderPath,
              },
            });
          },
        );
      });
    }
  });
};

const deleteFolder = (req, res) => {
  const { id: classId, folderId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role_name;

  const checkQuery =
    userRole === 'admin'
      ? 'SELECT id FROM classes WHERE id = ?'
      : 'SELECT id FROM classes WHERE id = ? AND teacher_id = ?';

  const params = userRole === 'admin' ? [classId] : [classId, userId];

  db.get(checkQuery, params, (err, classRow) => {
    if (err) {
      console.error('Error al verificar clase:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al eliminar carpeta',
        error: err.message,
      });
    }

    if (!classRow) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permiso para eliminar carpetas',
      });
    }

    db.get(
      'SELECT * FROM class_folders WHERE id = ? AND class_id = ?',
      [folderId, classId],
      (err, folder) => {
        if (err) {
          console.error('Error al buscar carpeta:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al eliminar carpeta',
            error: err.message,
          });
        }

        if (!folder) {
          return res.status(404).json({
            ok: false,
            message: 'Carpeta no encontrada',
          });
        }

        db.get(
          'SELECT COUNT(*) as count FROM class_content WHERE folder_id = ?',
          [folderId],
          (err, fileCount) => {
            if (err) {
              console.error('Error al verificar archivos:', err.message);
              return res.status(500).json({
                ok: false,
                message: 'Error al eliminar carpeta',
                error: err.message,
              });
            }

            if (fileCount.count > 0) {
              return res.status(400).json({
                ok: false,
                message: `No se puede eliminar: contiene ${fileCount.count} archivo(s)`,
              });
            }

            db.get(
              'SELECT COUNT(*) as count FROM class_folders WHERE parent_id = ?',
              [folderId],
              (err, subfolderCount) => {
                if (err) {
                  console.error('Error al verificar subcarpetas:', err.message);
                  return res.status(500).json({
                    ok: false,
                    message: 'Error al eliminar carpeta',
                    error: err.message,
                  });
                }

                if (subfolderCount.count > 0) {
                  return res.status(400).json({
                    ok: false,
                    message: `No se puede eliminar: contiene ${subfolderCount.count} subcarpeta(s)`,
                  });
                }

                db.run('DELETE FROM class_folders WHERE id = ?', [folderId], function (err) {
                  if (err) {
                    console.error('Error al eliminar carpeta:', err.message);
                    return res.status(500).json({
                      ok: false,
                      message: 'Error al eliminar carpeta',
                      error: err.message,
                    });
                  }

                  res.json({
                    ok: true,
                    message: 'Carpeta eliminada exitosamente',
                  });
                });
              },
            );
          },
        );
      },
    );
  });
};

// Mover un archivo a otra carpeta o a raíz
const moveContent = (req, res) => {
  const { id: classId, fileId } = req.params;
  const { folder_id } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role_name;

  // Validar y normalizar folder_id destino
  let targetFolderId = null;
  if (
    folder_id !== undefined &&
    folder_id !== null &&
    folder_id !== '' &&
    folder_id !== 'null' &&
    folder_id !== 'undefined'
  ) {
    const parsedId = parseInt(folder_id, 10);
    if (Number.isNaN(parsedId)) {
      return res.status(400).json({
        ok: false,
        message: 'folder_id inválido',
      });
    }
    targetFolderId = parsedId;
  }

  // Verificar permisos sobre la clase
  const checkQuery =
    userRole === 'admin'
      ? 'SELECT id, name FROM classes WHERE id = ?'
      : 'SELECT id, name FROM classes WHERE id = ? AND teacher_id = ?';

  const params = userRole === 'admin' ? [classId] : [classId, userId];

  db.get(checkQuery, params, (err, classRow) => {
    if (err) {
      console.error('Error al verificar clase:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al mover archivo',
        error: err.message,
      });
    }

    if (!classRow) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permiso para mover archivos en esta clase',
      });
    }

    const className = classRow.name;
    const slug = generateSlug(className);

    // Obtener información del archivo con su carpeta actual
    const fileQuery = `
            SELECT cc.*, c.name as class_name, 
                   cf.path as source_folder_path,
                   cf.id as source_folder_id
            FROM class_content cc
            INNER JOIN classes c ON cc.class_id = c.id
            LEFT JOIN class_folders cf ON cc.folder_id = cf.id
            WHERE cc.id = ? AND cc.class_id = ?
        `;

    db.get(fileQuery, [fileId, classId], (err, file) => {
      if (err) {
        console.error('Error al obtener archivo:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al mover archivo',
          error: err.message,
        });
      }

      if (!file) {
        return res.status(404).json({
          ok: false,
          message: 'Archivo no encontrado',
        });
      }

      // Si la carpeta destino es la misma que la actual, no hacer nada
      const currentFolderId = file.source_folder_id || null;
      if (currentFolderId === targetFolderId) {
        return res.status(400).json({
          ok: false,
          message: 'El archivo ya está en la carpeta especificada',
        });
      }

      // Verificar que la carpeta destino existe (si no es null)
      const verifyTargetFolder = (callback) => {
        if (targetFolderId === null) {
          callback(null, null);
          return;
        }

        const folderQuery = `
                    SELECT f.*, c.name as class_name
                    FROM class_folders f
                    INNER JOIN classes c ON f.class_id = c.id
                    WHERE f.id = ? AND f.class_id = ?
                `;

        db.get(folderQuery, [targetFolderId, classId], (err, folder) => {
          if (err) {
            callback(err);
          } else if (!folder) {
            callback(new Error('La carpeta destino no existe en esta clase'));
          } else {
            callback(null, folder);
          }
        });
      };

      verifyTargetFolder((err, targetFolder) => {
        if (err) {
          console.error('Error al verificar carpeta destino:', err.message);
          const status = err.message === 'La carpeta destino no existe en esta clase' ? 404 : 500;
          return res.status(status).json({
            ok: false,
            message: err.message,
          });
        }

        // Construir rutas físicas
        const baseDir = path.join(__dirname, '../../storage/clases', slug, 'contenido');

        // Ruta origen
        let sourcePath = baseDir;
        if (file.source_folder_path) {
          const relativeSourcePath = file.source_folder_path.startsWith('/')
            ? file.source_folder_path.substring(1)
            : file.source_folder_path;
          sourcePath = path.join(sourcePath, relativeSourcePath, file.filename);
        } else {
          sourcePath = path.join(sourcePath, file.filename);
        }

        // Ruta destino
        let targetPath = baseDir;
        if (targetFolderId !== null && targetFolder) {
          const relativePath = targetFolder.path.startsWith('/')
            ? targetFolder.path.substring(1)
            : targetFolder.path;
          targetPath = path.join(targetPath, relativePath);

          // Crear directorio destino si no existe
          if (!fs.existsSync(targetPath)) {
            try {
              fs.mkdirSync(targetPath, { recursive: true });
            } catch (mkdirErr) {
              console.error('Error al crear directorio destino:', mkdirErr.message);
              return res.status(500).json({
                ok: false,
                message: 'Error al crear directorio destino',
                error: mkdirErr.message,
              });
            }
          }
          targetPath = path.join(targetPath, file.filename);
        } else {
          targetPath = path.join(targetPath, file.filename);
        }

        // Verificar que el archivo origen existe
        if (!fs.existsSync(sourcePath)) {
          return res.status(404).json({
            ok: false,
            message: 'El archivo físico no existe en el servidor',
          });
        }

        // Verificar que no exista un archivo con el mismo nombre en destino
        if (fs.existsSync(targetPath)) {
          return res.status(409).json({
            ok: false,
            message: 'Ya existe un archivo con el mismo nombre en la carpeta destino',
          });
        }

        // Mover archivo físicamente
        try {
          fs.renameSync(sourcePath, targetPath);
        } catch (moveErr) {
          console.error('Error al mover archivo físicamente:', moveErr.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al mover el archivo físicamente',
            error: moveErr.message,
          });
        }

        // Actualizar BD
        const updateQuery = `
                    UPDATE class_content 
                    SET folder_id = ? 
                    WHERE id = ? AND class_id = ?
                `;

        db.run(updateQuery, [targetFolderId, fileId, classId], function (err) {
          if (err) {
            console.error('Error al actualizar BD:', err.message);
            // Intentar revertir el movimiento físico
            try {
              fs.renameSync(targetPath, sourcePath);
              console.log('Movimiento revertido físicamente');
            } catch (revertErr) {
              console.error('Error crítico al revertir movimiento:', revertErr.message);
            }
            return res.status(500).json({
              ok: false,
              message: 'Error al actualizar la base de datos',
              error: err.message,
            });
          }

          res.json({
            ok: true,
            message: 'Archivo movido exitosamente',
            file: {
              id: fileId,
              original_name: file.original_name,
              from_folder_id: currentFolderId,
              to_folder_id: targetFolderId,
            },
          });
        });
      });
    });
  });
};

// Helper: verificar si un archivo de contenido existe físicamente
const contentFileExists = (classSlug, folderPath, filename) => {
  let filePath = path.join(__dirname, '../../storage/clases', classSlug, 'contenido');
  if (folderPath) {
    const relativePath = folderPath.startsWith('/') ? folderPath.substring(1) : folderPath;
    filePath = path.join(filePath, relativePath);
  }
  filePath = path.join(filePath, filename);
  return fs.existsSync(filePath);
};

// ==================== VER Y DESCARGAR CONTENIDO ====================

const viewContentFile = (req, res) => {
  const { id: classId, fileId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role_name;

  const query = `
            SELECT cc.*, c.name as class_name, cf.path as folder_path
            FROM class_content cc
            INNER JOIN classes c ON cc.class_id = c.id
            LEFT JOIN class_folders cf ON cc.folder_id = cf.id
            WHERE cc.id = ? AND cc.class_id = ?
        `;

  db.get(query, [fileId, classId], (err, content) => {
    if (err || !content) {
      console.error('Error al obtener contenido:', err?.message);
      return res.status(404).json({ ok: false, message: 'Archivo no encontrado' });
    }

    // Verificar permisos para estudiantes
    if (userRole === 'student') {
      db.get(
        'SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ? AND status = "active"',
        [classId, userId],
        (err, enrollment) => {
          if (err || !enrollment) {
            return res.status(403).json({ ok: false, message: 'No tienes acceso a este archivo' });
          }
          sendFile();
        },
      );
    } else {
      sendFile();
    }

    function sendFile() {
      const slug = generateSlug(content.class_name);
      let filePath = path.join(__dirname, '../../storage/clases', slug, 'contenido');

      if (content.folder_path) {
        const relativePath = content.folder_path.startsWith('/')
          ? content.folder_path.substring(1)
          : content.folder_path;
        filePath = path.join(filePath, relativePath, content.filename);
      } else {
        filePath = path.join(filePath, content.filename);
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ ok: false, message: 'Archivo no existe en el servidor' });
      }

      if (content.file_type) {
        res.setHeader('Content-Type', content.file_type);
      }

      return res.sendFile(filePath);
    }
  });
};

// Descargar contenido
const downloadContentFile = (req, res) => {
  const { id: classId, fileId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role_name;

  const query = `
            SELECT cc.*, c.name as class_name, cf.path as folder_path
            FROM class_content cc
            INNER JOIN classes c ON cc.class_id = c.id
            LEFT JOIN class_folders cf ON cc.folder_id = cf.id
            WHERE cc.id = ? AND cc.class_id = ?
        `;

  db.get(query, [fileId, classId], (err, content) => {
    if (err || !content) {
      console.error('Error al obtener contenido:', err?.message);
      return res.status(404).json({ ok: false, message: 'Archivo no encontrado' });
    }

    if (userRole === 'student') {
      db.get(
        'SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ? AND status = "active"',
        [classId, userId],
        (err, enrollment) => {
          if (err || !enrollment) {
            return res.status(403).json({ ok: false, message: 'No tienes acceso a este archivo' });
          }
          sendFile();
        },
      );
    } else {
      sendFile();
    }

    function sendFile() {
      const slug = generateSlug(content.class_name);
      let filePath = path.join(__dirname, '../../storage/clases', slug, 'contenido');

      if (content.folder_path) {
        const relativePath = content.folder_path.startsWith('/')
          ? content.folder_path.substring(1)
          : content.folder_path;
        filePath = path.join(filePath, relativePath, content.filename);
      } else {
        filePath = path.join(filePath, content.filename);
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ ok: false, message: 'Archivo no existe en el servidor' });
      }

      return res.download(filePath, content.original_name);
    }
  });
};

module.exports = {
  getMyClasses,
  getClassContent,
  uploadContent,
  deleteContent,
  getClassQuizzes,
  createQuiz,
  getQuizById,
  updateQuizStatus,
  getClassTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskSubmissions,
  viewTaskSubmission,

  downloadTaskSubmission,
  gradeSubmission,
  getQuizSubmissions,
  enrollStudentToMyClass,
  getMyClassStudents,
  moveContent,
  getFolders,
  createFolder,
  deleteFolder,
  viewContentFile,
  downloadContentFile,
};
