// ---------------------------------------------------------------------------
// Gera as imagens do site a partir dos originais em fotos/.
//
//   fotos/<pasta>/<nome>.jpg  ->  public/img/<pasta>/<nome>-<largura>.avif e .webp
//
// Também escreve public/img/manifesto.json (larguras, proporção e cor média),
// que o build usa para montar o <picture> com srcset.
//
// Uso:  npm run imagens            (só refaz o que mudou)
//       npm run imagens -- --forcar (refaz tudo)
// ---------------------------------------------------------------------------
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ORIGEM = 'fotos';
const DESTINO = path.join('public', 'img');
const FORCAR = process.argv.includes('--forcar');
const EXTENSOES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);

// Regras por pasta: larguras geradas e recorte (largura / altura).
// proporcao: null mantém o enquadramento original.
const REGRAS = {
  hero: { larguras: [480, 800, 1200, 1600], proporcao: null },
  casos: { larguras: [480, 720, 1080], proporcao: 1 },
  tratamentos: { larguras: [480, 800, 1200, 1600], proporcao: 4 / 5 },
  procedimentos: { larguras: [320, 640], proporcao: 4 / 5 },
  sobre: { larguras: [480, 800, 1200, 1600], proporcao: 4 / 5 },
  // O espaço: cada foto mantém a proporção dela (horizontais e verticais se
  // alternam na galeria). A última vira fundo de tela cheia: 2880 px.
  espaco: { larguras: [640, 1024, 1600, 2400, 2880], proporcao: null },
  atendimento: { larguras: [320, 640, 960], proporcao: 4 / 5 },
};
const REGRA_PADRAO = { larguras: [480, 800, 1200, 1600], proporcao: null };

const QUALIDADE = {
  avif: { quality: 52, effort: 4 },
  webp: { quality: 78, effort: 5 },
};

const hex = ({ r, g, b }) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

async function listarOriginais() {
  if (!existsSync(ORIGEM)) return [];
  const lista = [];
  for (const pasta of await readdir(ORIGEM, { withFileTypes: true })) {
    if (!pasta.isDirectory()) continue;
    for (const arquivo of await readdir(path.join(ORIGEM, pasta.name))) {
      if (EXTENSOES.has(path.extname(arquivo).toLowerCase())) lista.push({ pasta: pasta.name, arquivo });
    }
  }
  return lista;
}

async function precisaRefazer(origem, saidas) {
  if (FORCAR) return true;
  const tempoOrigem = (await stat(origem)).mtimeMs;
  for (const saida of saidas) {
    if (!existsSync(saida) || (await stat(saida)).mtimeMs < tempoOrigem) return true;
  }
  return false;
}

async function processar({ pasta, arquivo }) {
  const regra = REGRAS[pasta] || REGRA_PADRAO;
  const nome = path.parse(arquivo).name;
  const origem = path.join(ORIGEM, pasta, arquivo);
  const meta = await sharp(origem).rotate().metadata();
  // Depois do rotate(), a orientação EXIF 5 a 8 troca largura e altura.
  const girada = meta.orientation >= 5;
  const larguraOriginal = girada ? meta.height : meta.width;
  const alturaOriginal = girada ? meta.width : meta.height;
  const proporcao = regra.proporcao ?? larguraOriginal / alturaOriginal;

  // Nunca amplia: só larguras até o tamanho do original (e pelo menos uma).
  const limite = Math.min(larguraOriginal, Math.round(alturaOriginal * proporcao));
  let larguras = regra.larguras.filter((w) => w <= limite);
  if (!larguras.length) larguras = [limite];

  const dirSaida = path.join(DESTINO, pasta);
  await mkdir(dirSaida, { recursive: true });
  const saidas = larguras.flatMap((w) => ['avif', 'webp'].map((f) => path.join(dirSaida, `${nome}-${w}.${f}`)));

  if (await precisaRefazer(origem, saidas)) {
    for (const w of larguras) {
      const h = Math.round(w / proporcao);
      const base = sharp(origem).rotate().resize({ width: w, height: h, fit: 'cover', position: 'centre' });
      await base.clone().avif(QUALIDADE.avif).toFile(path.join(dirSaida, `${nome}-${w}.avif`));
      await base.clone().webp(QUALIDADE.webp).toFile(path.join(dirSaida, `${nome}-${w}.webp`));
    }
    console.log(`  gerada   ${pasta}/${nome} (${larguras.join(', ')})`);
  } else {
    console.log(`  igual    ${pasta}/${nome}`);
  }

  const maior = larguras.at(-1);
  // Cor média para o fundo enquanto a imagem carrega (sem sentido se há transparência).
  const cor = meta.hasAlpha ? 'transparent' : hex((await sharp(origem).stats()).dominant);
  return [
    `${pasta}/${nome}`,
    { largura: maior, altura: Math.round(maior / proporcao), larguras, formatos: ['avif', 'webp'], cor },
  ];
}

// Apaga de public/img as versões que não saem mais de nenhum original (foto
// trocada de nome ou removida, ou largura que deixou de existir). Sem isso,
// elas iriam junto para o dist/. Só mexe em arquivos no padrão <nome>-<largura>.<formato>.
async function limparSobras(manifesto) {
  if (!existsSync(DESTINO)) return;
  for (const pasta of await readdir(DESTINO, { withFileTypes: true })) {
    if (!pasta.isDirectory()) continue;
    for (const arquivo of await readdir(path.join(DESTINO, pasta.name))) {
      const partes = arquivo.match(/^(.+)-(\d+)\.(avif|webp)$/);
      if (!partes) continue;
      const info = manifesto[`${pasta.name}/${partes[1]}`];
      if (info && info.larguras.includes(Number(partes[2]))) continue;
      await rm(path.join(DESTINO, pasta.name, arquivo));
      console.log(`  apagada  ${pasta.name}/${arquivo} (sem original)`);
    }
  }
}

const originais = await listarOriginais();
console.log(`Otimizando ${originais.length} imagens de ${ORIGEM}/`);
const entradas = [];
for (const item of originais) entradas.push(await processar(item));
entradas.sort(([a], [b]) => a.localeCompare(b));
const manifesto = Object.fromEntries(entradas);
await limparSobras(manifesto);
await mkdir(DESTINO, { recursive: true });
await writeFile(path.join(DESTINO, 'manifesto.json'), JSON.stringify(manifesto, null, 2) + '\n');
console.log(`Manifesto: ${path.join(DESTINO, 'manifesto.json')}`);
