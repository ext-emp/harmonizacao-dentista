// ---------------------------------------------------------------------------
// Plugin do Vite que monta o index.html (no dev e no build).
//
//   <!-- @incluir secoes/hero.html -->   insere o arquivo src/secoes/hero.html
//   <!-- @gerar horarios -->             insere o HTML gerado em vite/geradores.js
//   {{ whatsapp.link }}                  troca pelo valor (escapado) do contexto
//   <x-img src="hero/perola" ...></x-img> vira <picture> com AVIF/WebP e srcset
//
// O resultado é HTML estático completo: o conteúdo funciona sem JavaScript.
// O plugin também serve (no dev) e grava (no build) o robots.txt e o
// sitemap.xml (vite/arquivos-raiz.js).
// ---------------------------------------------------------------------------
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { montarContexto } from './contexto.js';
import * as geradores from './geradores.js';
import { robotsTxt, sitemapXml } from './arquivos-raiz.js';
import { escapar } from './util.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(RAIZ, 'src');
const MANIFESTO = path.join(RAIZ, 'public', 'img', 'manifesto.json');
const PREFIXO = '[montar-html]';

// Importa o módulo de novo a cada chamada, para o dev pegar as edições na hora.
async function importarSemCache(arquivo) {
  return import(`${pathToFileURL(arquivo).href}?v=${Date.now()}`);
}

async function carregarDados() {
  const { doutor } = await importarSemCache(path.join(SRC, 'dados', 'doutor.js'));
  const arquivoCasos = path.join(SRC, 'dados', 'casos.js');
  const casos = existsSync(arquivoCasos) ? (await importarSemCache(arquivoCasos)).casos : [];
  return { ...montarContexto(doutor), casos };
}

function incluir(html, nivel = 0) {
  return html.replace(/<!--\s*@incluir\s+([\w./-]+)\s*-->/g, (_, relativo) => {
    if (nivel > 6) throw new Error(`${PREFIXO} inclusões aninhadas demais em ${relativo}`);
    const arquivo = path.join(SRC, relativo);
    if (!existsSync(arquivo)) throw new Error(`${PREFIXO} arquivo incluído não existe: src/${relativo}`);
    return incluir(readFileSync(arquivo, 'utf8'), nivel + 1);
  });
}

function gerar(html, contexto) {
  return html.replace(/<!--\s*@gerar\s+([\w-]+)\s*-->/g, (_, nome) => {
    const gerador = geradores[nome];
    if (typeof gerador !== 'function') throw new Error(`${PREFIXO} gerador desconhecido: ${nome}`);
    return gerador(contexto);
  });
}

function substituir(html, contexto) {
  return html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, caminho) => {
    const valor = caminho.split('.').reduce((obj, chave) => (obj == null ? undefined : obj[chave]), contexto);
    if (valor == null || typeof valor === 'object') {
      throw new Error(`${PREFIXO} valor não encontrado no contexto: {{ ${caminho} }}`);
    }
    return escapar(valor);
  });
}

// Perguntas e respostas do FAQ, lidas do próprio HTML (o texto fica num
// lugar só), para os dados estruturados (FAQPage).
function lerFaq(html) {
  const texto = (trecho = '') =>
    trecho
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
  return [...html.matchAll(/<details class="faq__item"[\s\S]*?<\/details>/g)]
    .map(([item]) => ({
      pergunta: texto(/class="faq__pergunta-texto">([\s\S]*?)<\/span>/.exec(item)?.[1]),
      resposta: texto(/class="faq__resposta">([\s\S]*?)<\/div>/.exec(item)?.[1]),
    }))
    .filter((f) => f.pergunta && f.resposta);
}

function lerManifesto() {
  if (!existsSync(MANIFESTO)) return {};
  return JSON.parse(readFileSync(MANIFESTO, 'utf8'));
}

function lerAtributos(texto) {
  const atributos = {};
  for (const m of texto.matchAll(/([\w:-]+)(?:\s*=\s*"([^"]*)")?/g)) atributos[m[1]] = m[2] ?? '';
  return atributos;
}

// Atributos do <x-img> que viram parte do <picture>/<img> de forma especial.
const ESPECIAIS = new Set(['src', 'alt', 'sizes', 'class', 'classe-picture', 'loading', 'decoding']);

function montarPicture(a, manifesto) {
  const chave = a.src;
  const info = manifesto[chave];
  if (!info) throw new Error(`${PREFIXO} imagem "${chave}" não está no manifesto. Rode: npm run imagens`);
  if (a.alt === undefined) throw new Error(`${PREFIXO} <x-img src="${chave}"> precisa de alt (use alt="" se for decorativa)`);

  const base = `/img/${chave}`;
  const sizes = a.sizes || '100vw';
  const srcset = (formato) => info.larguras.map((w) => `${base}-${w}.${formato} ${w}w`).join(', ');
  const padrao = info.larguras.find((w) => w >= 800) ?? info.larguras.at(-1);
  const extras = Object.entries(a)
    .filter(([nome]) => !ESPECIAIS.has(nome))
    .map(([nome, valor]) => (valor === '' ? ` ${nome}` : ` ${nome}="${valor}"`))
    .join('');
  const classePicture = a['classe-picture'] ? ` class="${a['classe-picture']}"` : '';
  const classeImg = a.class ? ` class="${a.class}"` : '';
  const fontes = info.formatos
    .filter((f) => f !== 'webp')
    .map((f) => `<source type="image/${f}" srcset="${srcset(f)}" sizes="${sizes}">`)
    .join('');

  return (
    `<picture${classePicture} style="--cor-media:${info.cor}">${fontes}` +
    `<img src="${base}-${padrao}.webp" srcset="${srcset('webp')}" sizes="${sizes}"` +
    ` width="${info.largura}" height="${info.altura}" alt="${a.alt}"${classeImg}` +
    ` loading="${a.loading || 'lazy'}" decoding="${a.decoding || 'async'}"${extras}>` +
    `</picture>`
  );
}

function imagens(html) {
  const manifesto = lerManifesto();
  return html.replace(/<x-img\b([^>]*)>\s*<\/x-img>/g, (_, atributos) => montarPicture(lerAtributos(atributos), manifesto));
}

export default function montarHtml() {
  return {
    name: 'montar-html',
    transformIndexHtml: {
      // Roda antes do processamento do Vite, para ele enxergar o HTML final.
      order: 'pre',
      async handler(html) {
        const contexto = await carregarDados();
        let saida = incluir(html);
        // Os {{ }} antes dos geradores: assim o FAQ já chega com os dados.
        // (O HTML gerado não tem {{ }}.)
        saida = substituir(saida, contexto);
        contexto.faq = lerFaq(saida);
        saida = gerar(saida, contexto);
        saida = imagens(saida);
        return saida;
      },
    },
    // robots.txt e sitemap.xml: no dev, servidos direto; no build, gravados em dist/.
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const caminho = req.url?.split('?')[0];
        if (caminho !== '/robots.txt' && caminho !== '/sitemap.xml') return next();
        const contexto = await carregarDados();
        const robots = caminho === '/robots.txt';
        const corpo = robots ? robotsTxt(contexto) : sitemapXml(contexto);
        res.statusCode = corpo == null ? 404 : 200;
        res.setHeader('Content-Type', robots ? 'text/plain; charset=utf-8' : 'application/xml; charset=utf-8');
        res.end(corpo ?? '');
      });
    },
    async generateBundle() {
      const contexto = await carregarDados();
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(contexto) });
      const sitemap = sitemapXml(contexto);
      if (sitemap) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
      else {
        this.warn(
          'site.url vazio em src/dados/doutor.js: o build sai sem sitemap.xml, sem canonical e sem URLs absolutas no Open Graph. Preencha antes de publicar.',
        );
      }
    },
    // Seções, dados e manifesto não fazem parte do grafo de módulos:
    // qualquer mudança neles recarrega a página inteira.
    handleHotUpdate({ file, server }) {
      const f = file.replace(/\\/g, '/');
      if (f.includes('/src/secoes/') || f.includes('/src/dados/') || f.endsWith('/public/img/manifesto.json')) {
        server.ws.send({ type: 'full-reload', path: '*' });
        return [];
      }
    },
  };
}
