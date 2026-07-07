const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../database/db');
// Función para obtener slug de una clase


const getClassSlug = (name) => {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// Verificar matrícula activa
const checkEnrollment = (classId, studentId, callback) => {
    const query = `SELECT id FROM class_enrollments WHERE class_id = ? AND student_id = ? AND status = 'active'`;
    db.get(query, [classId, studentId], (err, row) => {
        if (err) return callback(err);
        callback(null, !!row);
    });
};

// Configurar almacenamiento para entregas de estudiantes
const storageDir = path.join(__dirname, '../../storage');
if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
}

const configureStudentStorage = (classSlug, studentId) => {
    const studentDir = path.join(storageDir, 'clases', classSlug, 'entregas', String(studentId));
    if (!fs.existsSync(studentDir)) {
        fs.mkdirSync(studentDir, { recursive: true });
    }
    return studentDir;
};

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const taskId = req.params.id;

            db.get(`
                SELECT c.name AS class_name
                FROM tasks t
                INNER JOIN classes c ON t.class_id = c.id
                WHERE t.id = ?
            `, [taskId], (err, row) => {
                if (err || !row) {
                    return cb(new Error('Clase no encontrada'));
                }

                const classSlug = getClassSlug(row.class_name);
                const studentId = req.user.id;
                const studentDir = configureStudentStorage(classSlug, studentId);
                cb(null, studentDir);
            });
        },
        filename: (req, file, cb) => {
            const timestamp = Date.now();
            const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
            cb(null, `${timestamp}_${sanitizedName}`);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'text/plain'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'), false);
        }
    }
});

// 1. Ver mis clases matriculadas
const getMyClasses = (req, res) => {
    const studentId = req.user.id;
    
    const query = `
        SELECT c.*, u.full_name as teacher_name 
        FROM classes c
        INNER JOIN class_enrollments ce ON c.id = ce.class_id
        INNER JOIN users u ON c.teacher_id = u.id
        WHERE ce.student_id = ? AND ce.status = 'active'
        ORDER BY c.created_at DESC
    `;
    
    db.all(query, [studentId], (err, rows) => {
        if (err) {
            console.error('Error al obtener mis clases:', err.message);
            return res.status(500).json({
                ok: false,
                message: 'Error al obtener tus clases',
                error: err.message
            });
        }
        
        res.json({
            ok: true,
            count: rows.length,
            classes: rows
        });
    });
};

// 2. Ver contenido de una clase
const getClassContent = (req, res) => {
    const classId = req.params.id;
    const studentId = req.user.id;

    checkEnrollment(classId, studentId, (err, isEnrolled) => {
        if (err) {
            return res.status(500).json({ ok: false, message: 'Error al verificar matrícula' });
        }

        if (!isEnrolled) {
            return res.status(403).json({ ok: false, message: 'No estás matriculado en esta clase' });
        }

        const foldersQuery = `
            SELECT
                f.id,
                f.class_id,
                f.name,
                f.slug,
                f.parent_id,
                f.path,
                f.created_by
            FROM class_folders f
            WHERE f.class_id = ?
            ORDER BY f.path ASC
        `;

        const contentQuery = `
            SELECT
                cc.*,
                c.name AS class_name
            FROM class_content cc
            INNER JOIN classes c ON cc.class_id = c.id
            WHERE cc.class_id = ?
            ORDER BY cc.uploaded_at DESC
        `;

        db.all(foldersQuery, [classId], (foldersErr, folders) => {
            if (foldersErr) {
                console.error('Error al obtener carpetas:', foldersErr.message);
                return res.status(500).json({ ok: false, message: 'Error al obtener carpetas' });
            }

            db.all(contentQuery, [classId], (contentErr, rows) => {
                if (contentErr) {
                    console.error('Error al obtener contenido:', contentErr.message);
                    return res.status(500).json({ ok: false, message: 'Error al obtener contenido' });
                }

                res.json({
                    ok: true,
                    folders: folders || [],
                    content: rows || []
                });
            });
        });
    });
};

// 3. Ver archivo de contenido (inline)


const viewContentFile = (req, res) => {
    const { id: classId, fileId } = req.params;
    const studentId = req.user.id;

    checkEnrollment(classId, studentId, (err, isEnrolled) => {
        if (err) {
            return res.status(500).json({ ok: false, message: 'Error al verificar matrícula' });
        }

        if (!isEnrolled) {
            return res.status(403).json({ ok: false, message: 'No estás matriculado en esta clase' });
        }

        const query = `
            SELECT
                cc.*,
                c.name AS class_name,
                cf.path AS folder_path
            FROM class_content cc
            INNER JOIN classes c ON cc.class_id = c.id
            LEFT JOIN class_folders cf ON cc.folder_id = cf.id
            WHERE cc.id = ? AND cc.class_id = ?
        `;

        db.get(query, [fileId, classId], (dbErr, content) => {
            if (dbErr) {
                console.error('Error al obtener archivo:', dbErr.message);
                return res.status(500).json({ ok: false, message: 'Error al obtener archivo' });
            }

            if (!content) {
                return res.status(404).json({ ok: false, message: 'Archivo no encontrado' });
            }

            const classSlug = getClassSlug(content.class_name);
            let filePath = path.join(__dirname, '../../storage/clases', classSlug, 'contenido');

            if (content.folder_path) {
                const relativeFolderPath = content.folder_path.startsWith('/')
                    ? content.folder_path.substring(1)
                    : content.folder_path;

                filePath = path.join(filePath, relativeFolderPath);
            }

            filePath = path.join(filePath, content.filename);

            console.log('[VIEW] final path:', filePath);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    ok: false,
                    message: 'Archivo no existe en el servidor',
                    filePath
                });
            }

            if (content.file_type) {
                res.setHeader('Content-Type', content.file_type);
            }

            return res.sendFile(filePath);
        });
    });
};
// 4. Descargar archivo de contenido
const downloadContentFile = (req, res) => {
    const { id: classId, fileId } = req.params;
    const studentId = req.user.id;

    checkEnrollment(classId, studentId, (err, isEnrolled) => {
        if (err) {
            return res.status(500).json({ ok: false, message: 'Error al verificar matrícula' });
        }

        if (!isEnrolled) {
            return res.status(403).json({ ok: false, message: 'No estás matriculado en esta clase' });
        }

        const query = `
            SELECT
                cc.*,
                c.name AS class_name,
                cf.path AS folder_path
            FROM class_content cc
            INNER JOIN classes c ON cc.class_id = c.id
            LEFT JOIN class_folders cf ON cc.folder_id = cf.id
            WHERE cc.id = ? AND cc.class_id = ?
        `;

        db.get(query, [fileId, classId], (dbErr, content) => {
            if (dbErr) {
                console.error('Error al obtener archivo:', dbErr.message);
                return res.status(500).json({ ok: false, message: 'Error al obtener archivo' });
            }
            if (!content) {
                return res.status(404).json({ ok: false, message: 'Archivo no encontrado' });
            }

            const classSlug = getClassSlug(content.class_name);
            let filePath = path.join(__dirname, '../../storage/clases', classSlug, 'contenido');

            if (content.folder_path) {
                const relativeFolderPath = content.folder_path.startsWith('/')
                    ? content.folder_path.substring(1)
                    : content.folder_path;

                filePath = path.join(filePath, relativeFolderPath);
            }

            filePath = path.join(filePath, content.filename);

            console.log('[DOWNLOAD] final path:', filePath);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    ok: false,
                    message: 'Archivo no existe en el servidor',
                    filePath
                });
            }

            return res.download(filePath, content.original_name || content.filename);
        });
    });
};

// 5. Ver quizzes disponibles de una clase
const getClassQuizzes = (req, res) => {
    const classId = req.params.id;
    const studentId = req.user.id;
    
    checkEnrollment(classId, studentId, (err, isEnrolled) => {
        if (err || !isEnrolled) {
            return res.status(403).json({ ok: false, message: 'Acceso denegado' });
        }
        
        const query = `
            SELECT q.*, 
                   (SELECT COUNT(*) FROM quiz_submissions WHERE quiz_id = q.id AND student_id = ?) as has_submitted
            FROM quizzes q
            WHERE q.class_id = ? AND q.status = 'active'
            ORDER BY q.created_at DESC
        `;
        
        db.all(query, [studentId, classId], (err, rows) => {
            if (err) {
                console.error('Error al obtener quizzes:', err.message);
                return res.status(500).json({ ok: false, message: 'Error al obtener quizzes' });
            }
            res.json({ ok: true, quizzes: rows });
        });
    });
};

// 6. Ver un quiz específico (sin respuestas correctas)
const getQuizById = (req, res) => {
    const quizId = req.params.id;
    const studentId = req.user.id;
    
    const query = `
        SELECT q.*, c.id as class_id, c.name as class_name
        FROM quizzes q
        INNER JOIN classes c ON q.class_id = c.id
        WHERE q.id = ?
    `;
    
    db.get(query, [quizId], (err, quiz) => {
        if (err || !quiz) {
            return res.status(404).json({ ok: false, message: 'Quiz no encontrado' });
        }
        
        checkEnrollment(quiz.class_id, studentId, (err2, isEnrolled) => {
            if (err2 || !isEnrolled) {
                return res.status(403).json({ ok: false, message: 'No tienes acceso a este quiz' });
            }
            
            if (quiz.status !== 'active') {
                return res.status(403).json({ ok: false, message: 'Este quiz no está disponible' });
            }
            
            // Obtener preguntas (sin correct_answer)
            const questionsQuery = `
                SELECT id, question_text, option_a, option_b, option_c, option_d, order_index 
                FROM quiz_questions 
                WHERE quiz_id = ? 
                ORDER BY order_index ASC
            `;
            
            db.all(questionsQuery, [quizId], (err3, questions) => {
                if (err3) {
                    return res.status(500).json({ ok: false, message: 'Error al obtener preguntas' });
                }
                
                // Ocultar correct_answer
                const safeQuestions = questions.map(q => {
                    const { ...rest } = q;
                    return rest;
                });
                
                res.json({ ok: true, quiz: { ...quiz, questions: safeQuestions } });
            });
        });
    });
};

// 7. Responder quiz
const submitQuiz = (req, res) => {
    const quizId = req.params.id;
    const studentId = req.user.id;
    const { answers } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ ok: false, message: 'Se requiere un array de respuestas' });
    }
    
    // [QUIZ_DEBUG] Respuestas recibidas del frontend
    console.log('[QUIZ_DEBUG] Respuestas recibidas:', JSON.stringify(answers, null, 2));
    
    // Verificar acceso al quiz
    const quizQuery = `
        SELECT q.*, c.id as class_id 
        FROM quizzes q
        INNER JOIN classes c ON q.class_id = c.id
        WHERE q.id = ? AND q.status = 'active'
    `;
    
    db.get(quizQuery, [quizId], (err, quiz) => {
        if (err || !quiz) {
            return res.status(404).json({ ok: false, message: 'Quiz no encontrado o no disponible' });
        }
        
        checkEnrollment(quiz.class_id, studentId, (err2, isEnrolled) => {
            if (err2 || !isEnrolled) {
                return res.status(403).json({ ok: false, message: 'No tienes acceso' });
            }
            
            // Verificar si ya envió este quiz
            db.get(`SELECT id FROM quiz_submissions WHERE quiz_id = ? AND student_id = ?`, [quizId, studentId], (err3, existing) => {
                if (existing) {
                    return res.status(400).json({ ok: false, message: 'Ya enviaste este quiz' });
                }
                
                // Obtener todas las preguntas con sus respuestas correctas
                db.all(`SELECT id, correct_answer FROM quiz_questions WHERE quiz_id = ?`, [quizId], (err4, questions) => {
                    if (err4) {
                        return res.status(500).json({ ok: false, message: 'Error al procesar quiz' });
                    }
                    
                    // [QUIZ_DEBUG] Preguntas en BD
                    console.log('[QUIZ_DEBUG] Preguntas de BD:', JSON.stringify(questions, null, 2));
                    
                    let correctCount = 0;
                    const answerRecords = [];
                    
                    for (const answer of answers) {
                        const question = questions.find(q => Number(q.id) === Number(answer.question_id));
                        if (!question) continue;
                        
                        const isCorrect =
                          String(question.correct_answer).trim().toLowerCase() ===
                          String(answer.selected_answer).trim().toLowerCase();
                        
                        // [QUIZ_DEBUG] Comparación por pregunta
                        console.log(`[QUIZ_DEBUG] Q${answer.question_id}: correct="${question.correct_answer}" vs selected="${answer.selected_answer}" => isCorrect=${isCorrect}`);
                        
                        if (isCorrect) correctCount++;
                        
                        answerRecords.push({
                            question_id: question.id,
                            selected_answer: answer.selected_answer,
                            is_correct: isCorrect ? 1 : 0
                        });
                    }
                    
                    const totalQuestions = questions.length;
                    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
                    
                    // [QUIZ_DEBUG] Resumen final
                    console.log(`[QUIZ_DEBUG] RESUMEN: totalQuestions=${totalQuestions}, correctCount=${correctCount}, score=${score}%`);
                    
                    // Insertar submission
                    db.run(`INSERT INTO quiz_submissions (quiz_id, student_id, score, total_questions) VALUES (?, ?, ?, ?)`,
                        [quizId, studentId, score, totalQuestions],
                        function(err5) {
                            if (err5) {
                                console.error('Error al guardar submission:', err5);
                                return res.status(500).json({ ok: false, message: 'Error al guardar el quiz' });
                            }
                            
                            const submissionId = this.lastID;
                            
                            // Insertar respuestas una por una
                            let answersInserted = 0;
                            for (const answer of answerRecords) {
                                db.run(`INSERT INTO quiz_answers (submission_id, question_id, selected_answer, is_correct) VALUES (?, ?, ?, ?)`,
                                    [submissionId, answer.question_id, answer.selected_answer, answer.is_correct],
                                    (err6) => {
                                        if (err6) console.error('Error al guardar respuesta:', err6);
                                        answersInserted++;
                                    });
                            }
                            
                            res.json({
                                ok: true,
                                message: 'Quiz enviado exitosamente',
                                score: Math.round(score * 100) / 100,
                                correct_answers: correctCount,
                                total_questions: totalQuestions
                            });
                        });
                });
            });
        });
    });
};

// 8. Ver tareas disponibles de una clase
const getClassTasks = (req, res) => {
    const classId = req.params.id;
    const studentId = req.user.id;
    
    checkEnrollment(classId, studentId, (err, isEnrolled) => {
        if (err || !isEnrolled) {
            return res.status(403).json({ ok: false, message: 'Acceso denegado' });
        }
        
        const query = `
            SELECT t.*, 
                   (SELECT id FROM task_submissions WHERE task_id = t.id AND student_id = ?) as has_submitted
            FROM tasks t
            WHERE t.class_id = ? AND t.status = 'active'
            ORDER BY t.due_date ASC
        `;
        
        db.all(query, [studentId, classId], (err2, rows) => {
            if (err2) {
                console.error('Error al obtener tareas:', err2.message);
                return res.status(500).json({ ok: false, message: 'Error al obtener tareas' });
            }
            res.json({ ok: true, tasks: rows });
        });
    });
};

// 9. Subir entrega de tarea
const submitTask = (req, res) => {
    upload.single('file')(req, res, (err) => {
        console.log('>>> content-type:', req.headers['content-type']);
        console.log('>>> body:', req.body);
        console.log('>>> file:', req.file);
        console.log('>>> multer err:', err);

        if (err) {
            console.error('Error en upload:', err);
            return res.status(400).json({
                ok: false,
                message: err.message || 'Error al subir archivo'
            });
        }

        const taskId = req.params.id;
        const studentId = req.user.id;
        const { notes } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                ok: false,
                message: 'Archivo requerido'
            });
        }

        const taskQuery = `
            SELECT t.*, c.id as class_id, c.name as class_name
            FROM tasks t
            INNER JOIN classes c ON t.class_id = c.id
            WHERE t.id = ? AND t.status = 'active'
        `;

        db.get(taskQuery, [taskId], (err, task) => {
            if (err || !task) {
                return res.status(404).json({ ok: false, message: 'Tarea no encontrada o no disponible' });
            }

            checkEnrollment(task.class_id, studentId, (err2, isEnrolled) => {
                if (err2 || !isEnrolled) {
                    return res.status(403).json({ ok: false, message: 'No tienes acceso a esta tarea' });
                }

                db.get(
                    `SELECT id FROM task_submissions WHERE task_id = ? AND student_id = ?`,
                    [taskId, studentId],
                    (err3, existing) => {
                        if (existing) {
                            return res.status(400).json({ ok: false, message: 'Ya entregaste esta tarea' });
                        }

                        db.run(
                            `INSERT INTO task_submissions (task_id, student_id, filename, original_name, file_type, file_size, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [taskId, studentId, file.filename, file.originalname, file.mimetype, file.size, notes || null],
                            function (err4) {
                                if (err4) {
                                    console.error('Error guardando entrega:', err4);
                                    return res.status(500).json({ ok: false, message: 'Error al guardar entrega' });
                                }

                                res.json({
                                    ok: true,
                                    message: 'Tarea entregada exitosamente',
                                    submissionId: this.lastID
                                });
                            }
                        );
                    }
                );
            });
        });
    });
};

// 10. Ver mi entrega de una tarea
const getMySubmission = (req, res) => {
    const taskId = req.params.id;
    const studentId = req.user.id;
    
    const query = `
        SELECT ts.*, t.title as task_title, t.description as task_description
        FROM task_submissions ts
        INNER JOIN tasks t ON ts.task_id = t.id
        WHERE ts.task_id = ? AND ts.student_id = ?
        ORDER BY ts.submitted_at DESC LIMIT 1
    `;
    
    db.get(query, [taskId, studentId], (err, submission) => {
        if (err) {
            console.error('Error al obtener entrega:', err.message);
            return res.status(500).json({ ok: false, message: 'Error al obtener entrega' });
        }
        if (!submission) {
            return res.status(404).json({ ok: false, message: 'No has entregado esta tarea' });
        }
        res.json({ ok: true, submission });
    });
};

// Ver resultado de mi quiz
// Obtener resultado de un quiz ya respondido (formato para frontend)
const getMyQuizResult = (req, res) => {
  const quizId = req.params.id;
  const studentId = req.user.id;

  const query = `
    SELECT qs.score, qs.total_questions, qs.submitted_at,
           (SELECT COUNT(*) FROM quiz_answers WHERE submission_id = qs.id AND is_correct = 1) as correct_answers
    FROM quiz_submissions qs
    WHERE qs.quiz_id = ? AND qs.student_id = ?
    ORDER BY qs.submitted_at DESC LIMIT 1
  `;

  db.get(query, [quizId, studentId], (err, result) => {
    if (err) {
      console.error('Error al obtener resultado del quiz:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al obtener el resultado'
      });
    }

    if (!result) {
      return res.status(404).json({
        ok: false,
        message: 'No has respondido este quiz'
      });
    }

    // Devolver en el formato que espera el frontend
    res.json({
      ok: true,
      score: result.score ?? 0,
      total_questions: result.total_questions ?? 0,
      correct_answers: result.correct_answers ?? 0,
      submitted_at: result.submitted_at
    });
  });
};

module.exports = {
    getMyClasses,
    getClassContent,
    viewContentFile,
    downloadContentFile,
    getClassQuizzes,
    getQuizById,
    submitQuiz,
    getClassTasks,
    submitTask,
    getMySubmission,
    getMyQuizResult
};