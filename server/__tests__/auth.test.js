// Setear variables de entorno ANTES de cargar cualquier módulo
process.env.JWT_SECRET = 'test_jwt_secret_para_tests';

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Manual mock: busca en src/database/__mocks__/db.js
jest.mock('../src/database/db');

const app = require('../src/app');

const JWT_SECRET = process.env.JWT_SECRET;

describe('POST /api/auth/login', () => {
  test('Admin login exitoso → 200 + token + datos de usuario', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.full_name).toBe('Admin User');
    expect(res.body.user.email).toBe('admin@test.com');
    expect(res.body.user.role_name).toBe('admin');

    const decoded = jwt.verify(res.body.token, JWT_SECRET);
    expect(decoded.id).toBe(1);
    expect(decoded.email).toBe('admin@test.com');
    expect(decoded.role_name).toBe('admin');
  });

  test('Teacher login exitoso → 200 + role=teacher', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@test.com', password: 'teacher123' })
      .expect(200);
    expect(res.body.user.role_name).toBe('teacher');
  });

  test('Student login exitoso → 200 + role=student', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@test.com', password: 'student123' })
      .expect(200);
    expect(res.body.user.role_name).toBe('student');
  });

  test('Contraseña incorrecta → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpassword' })
      .expect(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('Email inexistente → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@test.com', password: 'admin123' })
      .expect(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('Usuario inactivo → 403', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inactive@test.com', password: 'inactive123' })
      .expect(403);
    expect(res.body.message).toBe('Account is inactive. Please contact administrator');
  });

  test('Email faltante → 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'admin123' })
      .expect(400);
    expect(res.body.message).toBe('Email and password are required');
  });

  test('Password faltante → 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com' })
      .expect(400);
    expect(res.body.message).toBe('Email and password are required');
  });

  test('Campos vacíos → 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '', password: '' })
      .expect(400);
    expect(res.body.ok).toBe(false);
  });

  test('Email case-insensitive → funciona con mayúsculas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ADMIN@TEST.COM', password: 'admin123' })
      .expect(200);
    expect(res.body.user.email).toBe('admin@test.com');
  });
});

describe('JWT Token payload validation', () => {
  let tokens = {};

  beforeAll(async () => {
    const admin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    const teacher = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@test.com', password: 'teacher123' });
    const student = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@test.com', password: 'student123' });
    tokens = { admin: admin.body.token, teacher: teacher.body.token, student: student.body.token };
  });

  test('Admin token → role_name=admin, role_id=1', () => {
    const decoded = jwt.verify(tokens.admin, JWT_SECRET);
    expect(decoded.role_name).toBe('admin');
    expect(decoded.role_id).toBe(1);
  });

  test('Teacher token → role_name=teacher, role_id=2', () => {
    const decoded = jwt.verify(tokens.teacher, JWT_SECRET);
    expect(decoded.role_name).toBe('teacher');
    expect(decoded.role_id).toBe(2);
  });

  test('Student token → role_name=student, role_id=3', () => {
    const decoded = jwt.verify(tokens.student, JWT_SECRET);
    expect(decoded.role_name).toBe('student');
    expect(decoded.role_id).toBe(3);
  });

  test('Token expira en 8h (28800 segundos)', () => {
    const decoded = jwt.verify(tokens.admin, JWT_SECRET);
    const expiresIn = decoded.exp - decoded.iat;
    expect(expiresIn).toBeCloseTo(28800, -1);
  });
});

describe('verifyToken middleware', () => {
  test('Sin token → 401', async () => {
    const res = await request(app).get('/api/private/me').expect(401);
    expect(res.body.message).toBe('Access denied. No token provided');
  });

  test('Formato inválido → 401', async () => {
    const res = await request(app)
      .get('/api/private/me')
      .set('Authorization', 'InvalidFormat')
      .expect(401);
    expect(res.body.message).toBe('Invalid token format. Use: Bearer <token>');
  });

  test('Token inválido → 401', async () => {
    const res = await request(app)
      .get('/api/private/me')
      .set('Authorization', 'Bearer token_invalido_123')
      .expect(401);
    expect(res.body.message).toBe('Invalid token');
  });

  test('Token válido → 200 + datos del JWT (email, role_name)', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    const res = await request(app)
      .get('/api/private/me')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);
    expect(res.body.user.email).toBe('admin@test.com');
    expect(res.body.user.role_name).toBe('admin');
    expect(res.body.user.id).toBe(1);
  });

  test('/me devuelve datos correctos para teacher', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@test.com', password: 'teacher123' });
    const res = await request(app)
      .get('/api/private/me')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);
    expect(res.body.user.role_name).toBe('teacher');
    expect(res.body.user.email).toBe('teacher@test.com');
  });
});

describe('authorizeRoles middleware', () => {
  let adminToken, teacherToken, studentToken;

  beforeAll(async () => {
    adminToken = (
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'admin123' })
    ).body.token;
    teacherToken = (
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'teacher@test.com', password: 'teacher123' })
    ).body.token;
    studentToken = (
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'student@test.com', password: 'student123' })
    ).body.token;
  });

  test('Admin puede acceder a GET /api/classes (200)', async () => {
    const res = await request(app).get('/api/classes').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('Teacher NO puede acceder a GET /api/students (solo admin) → 403', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Access denied. Insufficient permissions');
    expect(res.body.required_roles).toContain('admin');
  });

  test('Student NO puede acceder a GET /api/students (solo admin) → 403', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Access denied. Insufficient permissions');
  });

  test('Sin token en ruta protegida → 401 (antes de authorizeRoles)', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Access denied. No token provided');
  });
});
