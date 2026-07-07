const express = require('express');
const router = express.Router();
const { login } = require('../controllers/auth.controller');

router.post('/auth/login', login);

module.exports = router;