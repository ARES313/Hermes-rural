const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  PORT: process.env.PORT || 3000,
  // Configuraciones adicionales se agregarán aquí
};