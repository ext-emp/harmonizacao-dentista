// Prévia rápida da pérola sobre porcelana e grafite (uso durante a calibragem).
import sharp from 'sharp';

const perola = await sharp('fotos/hero/perola.png').resize(700, 700).png().toBuffer();
await sharp({ create: { width: 1550, height: 800, channels: 3, background: '#f3efe8' } })
  .composite([
    { input: { create: { width: 775, height: 800, channels: 3, background: '#161513' } }, left: 775, top: 0 },
    { input: perola, left: 50, top: 50 },
    { input: perola, left: 825, top: 50 },
  ])
  .png()
  .toFile(process.argv[2] || 'capturas/perola-teste.png');
console.log('ok');
