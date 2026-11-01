// Monta folhas de contato (várias capturas numa imagem só) para revisão rápida.
// Uso: node scripts/folha-contato.mjs <pasta> <saida.png> [colunas] [escala] [inicio] [fim]
import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const [pasta, saida, colunasArg = '4', escalaArg = '0.33', inicioArg = '0', fimArg = '999'] = process.argv.slice(2);
const colunas = Number(colunasArg);
const escala = Number(escalaArg);
const arquivos = (await readdir(pasta))
  .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  .sort()
  .slice(Number(inicioArg), Number(fimArg));

const metas = await Promise.all(arquivos.map((f) => sharp(path.join(pasta, f)).metadata()));
const largura = Math.round(metas[0].width * escala);
const altura = Math.round(metas[0].height * escala);
const gap = 6;
const linhas = Math.ceil(arquivos.length / colunas);

const pecas = await Promise.all(
  arquivos.map(async (f, i) => ({
    input: await sharp(path.join(pasta, f)).resize(largura, altura, { fit: 'cover', position: 'top' }).png().toBuffer(),
    left: (i % colunas) * (largura + gap),
    top: Math.floor(i / colunas) * (altura + gap),
  })),
);

await sharp({
  create: {
    width: colunas * largura + (colunas - 1) * gap,
    height: linhas * altura + (linhas - 1) * gap,
    channels: 3,
    background: '#ff00ff',
  },
})
  .composite(pecas)
  .png()
  .toFile(saida);
console.log('ok', saida, arquivos.length, 'capturas');
