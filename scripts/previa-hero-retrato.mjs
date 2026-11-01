// Prévia rápida da composição pérola + retrato recortado (uso na calibragem).
// Uso: node scripts/previa-hero-retrato.mjs <retrato.png> <saida.png>
import sharp from 'sharp';

const [retrato = 'fotos/hero/doutor-capa.png', saida = 'capturas/hero-retrato-previa.png'] = process.argv.slice(2);
const pessoa = await sharp(retrato).resize(560, 700).png().toBuffer();
const perola = await sharp('fotos/hero/perola.png').resize(520, 520).png().toBuffer();
await sharp({ create: { width: 900, height: 760, channels: 3, background: '#f3efe8' } })
  .composite([
    { input: perola, left: 210, top: 40 },
    { input: pessoa, left: 300, top: 60 },
    { input: { create: { width: 900, height: 2, channels: 3, background: '#161513' } }, left: 0, top: 758 },
  ])
  .png()
  .toFile(saida);
console.log('ok', saida);
