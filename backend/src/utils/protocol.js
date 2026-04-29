const { pool } = require('../db');

async function generateProtocol() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

  let attempts = 0;
  while (attempts < 10) {
    const seq = Math.floor(100 + Math.random() * 900);
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const protocolo = `TK${dateStr}${seq}${letter}`;

    const result = await pool.query('SELECT id FROM chamado WHERE protocolo = $1', [protocolo]);
    if (result.rows.length === 0) return protocolo;
    attempts++;
  }
  throw new Error('Não foi possível gerar protocolo único');
}

module.exports = { generateProtocol };
