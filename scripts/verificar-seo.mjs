// ---------------------------------------------------------------------------
// Confere o SEO no HTML como ele chega (sem JavaScript, que é o que os robôs e
// as prévias de link leem): title, description, robots, canonical, Open
// Graph, Twitter Card, dados estruturados (cada bloco JSON-LD passa no
// JSON.parse; Dentist, WebSite e FAQPage com as perguntas da página), um h1
// só, alt em todas as imagens, robots.txt e sitemap.xml (XML válido, com URL
// absoluta). Sem site.url em src/dados/doutor.js, as URLs absolutas e o
// sitemap viram avisos, não falhas.
// Uso: node scripts/verificar-seo.mjs   (URL_SITE muda o endereço)
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';

const URL_SITE = (process.env.URL_SITE || 'http://localhost:5173/').replace(/\/?$/, '/');
let falhas = 0;
const conferir = (ok, mensagem) => {
  console.log(`  ${ok ? 'ok   ' : 'FALHA'} ${mensagem}`);
  if (!ok) falhas++;
};
const avisar = (mensagem) => console.log(`  aviso ${mensagem}`);

const buscar = async (caminho) => {
  const r = await fetch(new URL(caminho, URL_SITE));
  return { status: r.status, tipo: r.headers.get('content-type') || '', texto: await r.text() };
};

const pagina = await buscar('/');
const robots = await buscar('/robots.txt');
const sitemap = await buscar('/sitemap.xml');

const navegador = await chromium.launch({ channel: 'chrome' });
const aba = await navegador.newPage();
// DOMParser não roda os scripts da página: é o HTML cru.
const html = await aba.evaluate(
  ({ fonte, xml }) => {
    const doc = new DOMParser().parseFromString(fonte, 'text/html');
    const meta = (seletor) => doc.querySelector(seletor)?.getAttribute('content') ?? null;
    const blocos = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
      try {
        return { ok: true, dados: JSON.parse(s.textContent) };
      } catch (erro) {
        return { ok: false, erro: String(erro) };
      }
    });
    let mapa = null;
    if (xml) {
      const x = new DOMParser().parseFromString(xml, 'application/xml');
      mapa = {
        valido: !x.querySelector('parsererror'),
        raiz: x.documentElement?.nodeName,
        locs: [...x.getElementsByTagName('loc')].map((l) => l.textContent.trim()),
      };
    }
    return {
      lang: doc.documentElement.getAttribute('lang'),
      titulos: [...doc.querySelectorAll('head > title')].map((t) => t.textContent.trim()),
      descricao: meta('meta[name="description"]'),
      robots: meta('meta[name="robots"]'),
      viewport: meta('meta[name="viewport"]'),
      canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      og: Object.fromEntries(
        [...doc.querySelectorAll('meta[property^="og:"]')].map((m) => [m.getAttribute('property'), m.getAttribute('content')]),
      ),
      twitter: Object.fromEntries(
        [...doc.querySelectorAll('meta[name^="twitter:"]')].map((m) => [m.getAttribute('name'), m.getAttribute('content')]),
      ),
      blocos,
      perguntas: doc.querySelectorAll('details.faq__item').length,
      h1: doc.querySelectorAll('h1').length,
      semAlt: [...doc.querySelectorAll('img:not([alt])')].map((i) => i.getAttribute('src')),
      icone: Boolean(doc.querySelector('link[rel="icon"]')),
      mapa,
    };
  },
  { fonte: pagina.texto, xml: sitemap.status === 200 ? sitemap.texto : null },
);
await navegador.close();

console.log(`\n== ${URL_SITE}`);
conferir(pagina.status === 200, `página responde (${pagina.status})`);
conferir(html.lang === 'pt-BR', `lang="${html.lang}"`);
conferir(html.titulos.length === 1 && html.titulos[0].length >= 20 && html.titulos[0].length <= 70, `um <title> com 20 a 70 caracteres (${html.titulos[0]?.length}): ${html.titulos[0]}`);
conferir(html.descricao && html.descricao.length >= 70 && html.descricao.length <= 170, `description com 70 a 170 caracteres (${html.descricao?.length})`);
conferir(/index/.test(html.robots ?? '') && !/noindex/.test(html.robots ?? ''), `meta robots indexável (${html.robots})`);
conferir(/width=device-width/.test(html.viewport ?? ''), 'meta viewport');
conferir(html.icone, 'favicon');
conferir(html.h1 === 1, `um h1 só (${html.h1})`);
conferir(!html.semAlt.length, `todas as imagens com alt${html.semAlt.length ? ` (sem alt: ${html.semAlt.join(', ')})` : ''}`);

console.log('\n== Open Graph e Twitter');
for (const chave of ['og:title', 'og:description', 'og:image', 'og:type', 'og:site_name', 'og:locale']) {
  conferir(Boolean(html.og[chave]), `${chave}: ${html.og[chave] ?? '(falta)'}`);
}
for (const chave of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
  conferir(Boolean(html.twitter[chave]), `${chave}: ${html.twitter[chave] ?? '(falta)'}`);
}
const absoluta = (u) => /^https:\/\//.test(u ?? '');
if (html.og['og:url'] || html.canonical) {
  conferir(absoluta(html.canonical), `canonical absoluto: ${html.canonical}`);
  conferir(html.og['og:url'] === html.canonical, 'og:url igual ao canonical');
  conferir(absoluta(html.og['og:image']) && absoluta(html.twitter['twitter:image']), 'imagem da prévia com URL absoluta');
} else {
  avisar('sem site.url: sem canonical e sem og:url, e a imagem da prévia fica com URL relativa (preencha antes de publicar)');
}

console.log('\n== dados estruturados');
conferir(html.blocos.length > 0, `${html.blocos.length} bloco(s) JSON-LD`);
html.blocos.forEach((b, i) => conferir(b.ok, `bloco ${i + 1} passa no JSON.parse${b.ok ? ` (${b.dados['@type']})` : `: ${b.erro}`}`));
const tipo = (t) => html.blocos.find((b) => b.ok && b.dados['@type'] === t)?.dados;
const dentista = tipo('Dentist');
conferir(Boolean(dentista?.name && dentista?.address?.addressLocality), `Dentist com nome e cidade (${dentista?.name}, ${dentista?.address?.addressLocality})`);
conferir(Boolean(tipo('WebSite')), 'WebSite');
const faq = tipo('FAQPage');
conferir(faq?.mainEntity?.length === html.perguntas, `FAQPage com as ${html.perguntas} perguntas da página (${faq?.mainEntity?.length ?? 0})`);
conferir(
  Boolean(faq?.mainEntity?.every((q) => q.name && q.acceptedAnswer?.text && !/[<>]/.test(q.acceptedAnswer.text))),
  'cada pergunta com resposta em texto puro',
);

console.log('\n== robots.txt e sitemap.xml');
conferir(robots.status === 200 && /^User-agent:\s*\*/im.test(robots.texto) && /^Allow:\s*\/\s*$/im.test(robots.texto), 'robots.txt com User-agent e Allow: /');
const linhaSitemap = /^Sitemap:\s*(\S+)/im.exec(robots.texto)?.[1];
if (linhaSitemap) {
  conferir(absoluta(linhaSitemap), `Sitemap: com URL absoluta (${linhaSitemap})`);
  conferir(sitemap.status === 200 && html.mapa?.valido && html.mapa.raiz === 'urlset', 'sitemap.xml é XML válido (urlset)');
  conferir(html.mapa?.locs.length > 0 && html.mapa.locs.every(absoluta), `sitemap com URLs absolutas (${html.mapa?.locs.join(', ')})`);
  if (html.canonical) conferir(html.mapa?.locs.includes(html.canonical), 'sitemap lista o canonical da página');
} else {
  avisar('sem site.url: robots.txt sem a linha Sitemap e sem sitemap.xml (preencha antes de publicar)');
  conferir(sitemap.status === 404 || !/<urlset/.test(sitemap.texto), 'sem sitemap.xml falso (o endereço não devolve a página)');
}

console.log(falhas ? `\n${falhas} falha(s).` : '\nSEO ok.');
process.exitCode = falhas ? 1 : 0;
