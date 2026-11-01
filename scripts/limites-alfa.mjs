// Mostra a caixa ocupada pelos pixels visíveis de um PNG com transparência,
// em pixels e em porcentagem da imagem. Serve para posicionar recortes.
// Uso: node scripts/limites-alfa.mjs fotos/hero/perola.png [limiar-alfa]
import sharp from 'sharp';

const [arquivo, limiarTexto = '12'] = process.argv.slice(2);
const limiar = Number(limiarTexto);
const { data, info } = await sharp(arquivo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: l, height: a, channels: c } = info;

let x0 = l;
let y0 = a;
let x1 = -1;
let y1 = -1;
for (let y = 0; y < a; y++) {
  for (let x = 0; x < l; x++) {
    if (data[(y * l + x) * c + 3] > limiar) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
}

const pct = (v, total) => `${((v / total) * 100).toFixed(1)}%`;
console.log(`${arquivo}: ${l}×${a}`);
console.log(`x ${x0}–${x1} (${pct(x0, l)}–${pct(x1 + 1, l)}), y ${y0}–${y1} (${pct(y0, a)}–${pct(y1 + 1, a)})`);
console.log(`caixa ${x1 - x0 + 1}×${y1 - y0 + 1} (${pct(x1 - x0 + 1, l)} × ${pct(y1 - y0 + 1, a)})`);
