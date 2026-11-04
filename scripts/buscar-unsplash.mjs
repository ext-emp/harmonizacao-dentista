// Busca fotos no Unsplash pela página pública (uso interno, para escolher as
// imagens provisórias). Salva miniaturas numa folha de contato e um JSON com
// ID, autor e link de cada foto, para o registro de créditos.
// Uso: node scripts/buscar-unsplash.mjs "linen texture" [quantidade]
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const consulta = process.argv[2] || 'linen texture';
const quantidade = Number(process.argv[3] || 12);
const slug = consulta.replace(/\s+/g, '-');
const pasta = `capturas/unsplash/${slug}`;
await mkdir(pasta, { recursive: true });

const navegador = await chromium.launch({ channel: 'chrome' });
// O Unsplash responde "Something went wrong" ao user-agent do Chrome headless.
const pagina = await navegador.newPage({
  viewport: { width: 1400, height: 1000 },
  locale: 'en-US',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
});
await pagina.goto(`https://unsplash.com/s/photos/${encodeURIComponent(slug)}?license=free`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await pagina.waitForSelector('img[src*="/photo-"]', { timeout: 30000 }).catch(() => {});
await pagina.waitForTimeout(1500);
for (let i = 0; i < 3; i++) {
  await pagina.mouse.wheel(0, 1500);
  await pagina.waitForTimeout(900);
}

// Cada resultado é um link /photos/<slug>-<id> com uma <img> de images.unsplash.com.
const fotos = await pagina.evaluate((max) => {
  const vistos = new Set();
  const lista = [];
  for (const a of document.querySelectorAll('a[href^="/photos/"]')) {
    const img = a.querySelector('img[src*="images.unsplash.com"]');
    if (!img) continue;
    const href = a.getAttribute('href');
    // O ID são os 11 últimos caracteres do slug (e pode ter hífen: "pxOQ-P97sA8").
    const id = href.split('/').pop().slice(-11);
    if (vistos.has(id)) continue;
    vistos.add(id);
    const base = img.src.split('?')[0];
    // Fotos "Unsplash+" (pagas) vêm de plus.unsplash.com; ficam de fora.
    if (base.includes('plus.unsplash.com')) continue;
    lista.push({ id, pagina: `https://unsplash.com${href}`, base, alt: img.alt || '' });
    if (lista.length >= max) break;
  }
  return lista;
}, quantidade);

// Autor de cada foto (página da foto).
for (const foto of fotos) {
  try {
    await pagina.goto(foto.pagina, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await pagina.waitForTimeout(1500);
    foto.autor = await pagina.evaluate(() => {
      const meta = document.querySelector('meta[property="og:title"]')?.content || document.title;
      const m = meta.match(/(?:photo|Photo) by (.+?) on Unsplash/);
      return m ? m[1] : meta;
    });
  } catch {
    foto.autor = '?';
  }
}
await navegador.close();

// Miniaturas numeradas numa folha.
const lado = 260;
const pecas = [];
for (const [i, foto] of fotos.entries()) {
  const resposta = await fetch(`${foto.base}?w=400&q=70&fm=jpg`);
  const buffer = Buffer.from(await resposta.arrayBuffer());
  const miniatura = await sharp(buffer).resize(lado, lado, { fit: 'cover' }).jpeg().toBuffer();
  const rotulo = Buffer.from(
    `<svg width="${lado}" height="28"><rect width="44" height="28" fill="#000"/><text x="8" y="20" font-size="18" fill="#fff" font-family="Arial">${i}</text></svg>`,
  );
  pecas.push({ input: miniatura, left: (i % 6) * (lado + 6), top: Math.floor(i / 6) * (lado + 6) });
  pecas.push({ input: rotulo, left: (i % 6) * (lado + 6), top: Math.floor(i / 6) * (lado + 6) });
}
const linhas = Math.max(1, Math.ceil(fotos.length / 6));
await sharp({ create: { width: 6 * (lado + 6), height: linhas * (lado + 6), channels: 3, background: '#888' } })
  .composite(pecas)
  .jpeg()
  .toFile(`${pasta}/folha.jpg`);
await writeFile(`${pasta}/fotos.json`, JSON.stringify(fotos, null, 2));
console.log(`${fotos.length} fotos -> ${pasta}/folha.jpg`);
fotos.forEach((f, i) => console.log(i, f.id, '|', f.autor, '|', f.alt.slice(0, 70)));
