const express = require('express');
const router = express.Router();

console.log('ARCHIVO ai.routes.js CARGADO');

// Ruta POST /api/ai/access
router.post('/access', (req, res) => {
  const rawCode = req.body.code;
  const code = typeof rawCode === 'string' ? rawCode.trim() : '';
  const AI_ACCESS_CODE = process.env.AI_ACCESS_CODE;

  console.log('==============================');
  console.log('DEBUG AI ACCESS');
  console.log('req.body =', req.body);
  console.log('code recibido =', JSON.stringify(code));
  console.log('AI_ACCESS_CODE =', JSON.stringify(AI_ACCESS_CODE));
  console.log('coinciden =', code === AI_ACCESS_CODE);
  console.log('==============================');

  if (!AI_ACCESS_CODE) {
    return res.status(500).json({
      success: false,
      message: 'AI_ACCESS_CODE no está definida en el servidor.',
    });
  }

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Debes ingresar una clave.',
    });
  }

  if (code !== AI_ACCESS_CODE) {
    return res.status(401).json({
      success: false,
      message: 'Clave de acceso incorrecta.',
    });
  }

  return res.json({ success: true });
});

// Ruta POST /api/ai/chat
router.post('/chat', async (req, res) => {
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2-math:latest';

  const rawMessage = req.body.message;
  const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Mensaje no proporcionado.',
    });
  }

  const systemPrompt = `
Eres un asistente educativo para estudiantes.
Responde solo en español.
Responde de forma clara, breve y correcta.
No inventes datos.
No mezcles idiomas.
Si no estás seguro de algo, dilo claramente.
Si la pregunta no es de matemáticas, igual responde de forma útil y ordenada.
Usa máximo 6 oraciones.
`;

  try {
    console.log('Modelo usado en Ollama:', OLLAMA_MODEL);
    console.log('Mensaje enviado:', message);

    const ollamaResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error(`Error de Ollama: ${ollamaResponse.status} - ${errorText}`);
      return res.status(500).json({
        success: false,
        message: 'Error al comunicarse con Ollama.',
      });
    }

    const data = await ollamaResponse.json();
    console.log('Respuesta completa de Ollama:', data);

    const reply = data?.message?.content?.trim() || '';

    if (!reply) {
      return res.status(500).json({
        success: false,
        message: 'Sin respuesta del modelo.',
      });
    }

    return res.json({ success: true, reply });
  } catch (error) {
    console.error('Error al llamar a Ollama:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar la solicitud de chat.',
    });
  }
});

module.exports = router;
