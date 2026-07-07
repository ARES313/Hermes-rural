const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');

const {
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
    getFolders,
    moveContent,
    createFolder,
    deleteFolder,
    viewContentFile,
    downloadContentFile
} = require('../controllers/teacher-class.controller');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = path.join(__dirname, '../../storage/temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain'
];

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no permitido. Tipos aceptados: ${allowedTypes.join(', ')}`));
        }
    }
});

router.use(verifyToken);

// Clases del docente
router.get('/teacher/my-classes', authorizeRoles('teacher', 'admin'), getMyClasses);

// Contenido
router.get('/classes/:id/content', authorizeRoles('teacher', 'admin'), getClassContent);
router.post('/classes/:id/content', authorizeRoles('teacher', 'admin'), upload.single('file'), uploadContent);
router.delete('/classes/:id/content/:fileId', authorizeRoles('teacher', 'admin'), deleteContent);

// Quizzes
router.get('/classes/:id/quizzes', authorizeRoles('teacher', 'admin'), getClassQuizzes);
router.post('/classes/:id/quizzes', authorizeRoles('teacher', 'admin'), createQuiz);
router.get('/quizzes/:id', authorizeRoles('teacher', 'admin'), getQuizById);
router.put('/quizzes/:id/status', authorizeRoles('teacher', 'admin'), updateQuizStatus);
router.get('/quizzes/:id/submissions', authorizeRoles('teacher', 'admin'), getQuizSubmissions);

// Tareas
router.get('/classes/:id/tasks', authorizeRoles('teacher', 'admin'), getClassTasks);
router.post('/classes/:id/tasks', authorizeRoles('teacher', 'admin'), createTask);
router.put('/tasks/:id', authorizeRoles('teacher', 'admin'), updateTask);
router.delete('/tasks/:id', authorizeRoles('teacher', 'admin'), deleteTask);
router.get('/tasks/:id/submissions', authorizeRoles('teacher', 'admin'), getTaskSubmissions);

// Entregas de tareas
router.get('/submissions/:id/view', authorizeRoles('teacher', 'admin'), viewTaskSubmission);
router.get('/submissions/:id/download', authorizeRoles('teacher', 'admin'), downloadTaskSubmission);
router.put('/submissions/:id/grade', authorizeRoles('teacher', 'admin'), gradeSubmission);

// Estudiantes
router.post('/classes/:id/enroll-student', authorizeRoles('teacher', 'admin'), enrollStudentToMyClass);
router.get('/classes/:id/students', authorizeRoles('teacher', 'admin'), getMyClassStudents);

// Carpetas
router.get('/teacher/classes/:id/folders', authorizeRoles('teacher', 'admin'), getFolders);
router.post('/teacher/classes/:id/folders', authorizeRoles('teacher', 'admin'), createFolder);
router.delete('/teacher/classes/:id/folders/:folderId', authorizeRoles('teacher', 'admin'), deleteFolder);

// Mover contenido
router.patch('/teacher/classes/:id/content/:fileId/move', authorizeRoles('teacher', 'admin'), moveContent);

// Contenido - Ver y Descargar (para estudiantes y docentes)
router.get('/classes/:id/content/:fileId/view', authorizeRoles('teacher', 'admin', 'student'), viewContentFile);
router.get('/classes/:id/content/:fileId/download', authorizeRoles('teacher', 'admin', 'student'), downloadContentFile);

module.exports = router;