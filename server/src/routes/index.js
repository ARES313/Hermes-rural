const express = require('express');
const router = express.Router();

// Ruta de prueba
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Backend proyecto-redes funcionando'
  });
});

module.exports = router;