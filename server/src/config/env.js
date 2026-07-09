const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ ERROR CRÍTICO: JWT_SECRET no está definido en las variables de entorno.');
  console.error('   Crea un archivo server/.env con:');
  console.error('   JWT_SECRET=tu_clave_secreta_aqui');
  process.exit(1);
}

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET,
};
