const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByClass,
  assignStudentToClass,
  removeStudentFromClass,
  changeStudentPassword
} = require('../controllers/student.controller');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas de estudiantes (solo admin puede gestionar estudiantes)
router.get('/students', authorizeRoles('admin'), getAllStudents);
router.get('/students/:id', authorizeRoles('admin'), getStudentById);
router.post('/students', authorizeRoles('admin'), createStudent);
router.put('/students/:id', authorizeRoles('admin'), updateStudent);
router.delete('/students/:id', authorizeRoles('admin'), deleteStudent);
router.put('/students/:id/password', authorizeRoles('admin'), changeStudentPassword);

// Rutas de asignación de estudiantes a clases
router.get('/classes/:id/students', authorizeRoles('admin', 'teacher'), getStudentsByClass);
router.post('/classes/:id/students', authorizeRoles('admin', 'teacher'), assignStudentToClass);
router.delete('/classes/:id/students/:studentId', authorizeRoles('admin', 'teacher'), removeStudentFromClass);

module.exports = router;