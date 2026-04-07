// fix-password.js  — correlo con: node fix-password.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql  = require('mysql2/promise');

(async () => {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vetvida_db',
  });

  const hash = await bcrypt.hash('VetVida2025!', 10);
  console.log('Hash generado:', hash);

  const emails = [
    'dueno@vetvida.com',
    'admin@vetvida.com',
    'vet@vetvida.com',
    'empleado@vetvida.com',
  ];

  for (const email of emails) {
    const [r] = await pool.query(
      'UPDATE usuarios SET password_hash = ? WHERE email = ?',
      [hash, email]
    );
    console.log(`${email} → ${r.affectedRows} fila(s) actualizada(s)`);
  }

  await pool.end();
  console.log('Listo ✅');
})();