const rateLimit = require('express-rate-limit');

/**
 * Desactiva el rate limiting cuando NODE_ENV=test para no bloquear los tests.
 */
const skipInTest = () => process.env.NODE_ENV === 'test';

/**
 * Limitador global — 100 peticiones cada 15 minutos por IP.
 * Se aplica a TODAS las rutas /api/*.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    ok: false,
    message: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.',
  },
});

/**
 * Limitador estricto para login — 5 intentos por minuto por IP.
 * Previene ataques de fuerza bruta contra /api/auth/login.
 */
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    ok: false,
    message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 1 minuto.',
  },
});

/**
 * Limitador para rutas de IA — 20 peticiones por minuto por IP.
 * Previene abuso del chat con IA local.
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    ok: false,
    message: 'Demasiadas peticiones a la IA. Intenta de nuevo en 1 minuto.',
  },
});

module.exports = { globalLimiter, loginLimiter, aiLimiter };
