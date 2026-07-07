const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

router.get('/private/me', verifyToken, (req, res) => {
  res.json({
    ok: true,
    message: 'Protected route accessed successfully',
    user: req.user
  });
});

module.exports = router;