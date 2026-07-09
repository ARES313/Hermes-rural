const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');
const studentController = require('../controllers/student-learning.controller');

// Todas las rutas requieren autenticación y rol de estudiante
router.use(verifyToken);
router.use(authorizeRoles('student'));

// Clases
router.get('/my-classes', studentController.getMyClasses);

// Contenido
router.get('/classes/:id/content', studentController.getClassContent);
router.get('/classes/:id/content/:fileId/view', studentController.viewContentFile);
router.get('/classes/:id/content/:fileId/download', studentController.downloadContentFile);

// Quizzes
router.get('/classes/:id/quizzes', studentController.getClassQuizzes);
router.get('/quizzes/:id', studentController.getQuizById);
router.post('/quizzes/:id/submit', studentController.submitQuiz);

// Tareas
router.get('/classes/:id/tasks', studentController.getClassTasks);
router.post('/tasks/:id/submit', studentController.submitTask);
router.get('/tasks/:id/submission', studentController.getMySubmission);
router.get('/quizzes/:id/result', studentController.getMyQuizResult);

module.exports = router;
