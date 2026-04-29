import { Chamado } from '../models/index.js';

export async function gerarProtocolo() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

  let tentativas = 0;
  while (tentativas < 100) {
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    const letra = letras[Math.floor(Math.random() * letras.length)];
    const protocolo = `TK${dateStr}${seq}${letra}`;
    const existe = await Chamado.findOne({ where: { protocolo } });
    if (!existe) return protocolo;
    tentativas++;
  }
  throw new Error('Não foi possível gerar protocolo único');
}
