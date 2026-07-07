const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const dbCheckRoutes = require('./routes/db-check.routes');
const authRoutes = require('./routes/auth.routes');
const privateRoutes = require('./routes/private.routes');
const classRoutes = require('./routes/class.routes');
const studentRoutes = require('./routes/student.routes');
const teacherRoutes = require('./routes/teacher.routes');
const teacherClassRoutes = require('./routes/teacher-class.routes');
const studentLearningRoutes = require('./routes/student-learning.routes');
const aiRoutes = require('./routes/ai.routes');
const db = require('./database/db');

const app = express();
console.log('ARCHIVO app.js CARGADO');
console.log('ENV PATH:', path.resolve(__dirname, '../.env'));
console.log('AI_ACCESS_CODE cargado?:', !!process.env.AI_ACCESS_CODE);

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log('Request body:', req.body);
  next();
});

// Rutas públicas / generales
app.use('/api/ai', aiRoutes);
app.use('/api', routes);
app.use('/api', dbCheckRoutes);
app.use('/api', authRoutes);

// Rutas protegidas o específicas
app.use('/api', privateRoutes);
app.use('/api', classRoutes);
app.use('/api', studentRoutes);
app.use('/api', teacherRoutes);
app.use('/api', teacherClassRoutes);
app.use('/api/student', studentLearningRoutes);

// Error handling
app.use(errorHandler);

const PORT = env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`Protected endpoint: http://localhost:${PORT}/api/private/me`);
  console.log(`Classes endpoint: http://localhost:${PORT}/api/classes`);
  console.log(`Students endpoint: http://localhost:${PORT}/api/students`);
});

module.exports = app;