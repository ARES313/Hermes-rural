const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');
const {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  changeTeacherPassword
} = require('../controllers/teacher.controller');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas de docentes (solo admin puede gestionar docentes)
router.get('/teachers', authorizeRoles('admin'), getAllTeachers);
router.get('/teachers/:id', authorizeRoles('admin'), getTeacherById);
router.post('/teachers', authorizeRoles('admin'), createTeacher);
router.put('/teachers/:id', authorizeRoles('admin'), updateTeacher);
router.delete('/teachers/:id', authorizeRoles('admin'), deleteTeacher);
router.put('/teachers/:id/password', authorizeRoles('admin'), changeTeacherPassword);


module.exports = router;