const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');
const {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
} = require('../controllers/class.controller');

router.use(verifyToken);

router.get('/classes', getAllClasses);
router.get('/classes/:id', getClassById);
router.post('/classes', authorizeRoles('admin', 'teacher'), createClass);
router.put('/classes/:id', authorizeRoles('admin', 'teacher'), updateClass);
router.delete('/classes/:id', authorizeRoles('admin', 'teacher'), deleteClass);

module.exports = router;