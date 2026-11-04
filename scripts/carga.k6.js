// ---------------------------------------------------------------------------
// Teste de carga (k6): quantas pessoas abrindo o site ao mesmo tempo ele
// aguenta. Cada usuário virtual faz o que um navegador faz ao abrir a página:
// baixa o HTML e, em seguida, o CSS, o JavaScript, as fontes e as imagens da
// primeira tela (as que não esperam o scroll); depois "lê" a página por alguns
// segundos e abre de novo.
//
// O alerta de 1 segundo: o teste falha se 5% das respostas passarem de 1 s
// (p95) ou se mais de 1% der erro.
//
// O site é estático (sem banco de dados nem servidor próprio): no ar, quem
// responde é a CDN da Vercel ou da Netlify. Rodar contra o `vite preview` da
// máquina mede o pior caso (um processo Node, na mesma máquina do k6).
// Só rode contra o domínio de produção com o site já publicado e com a
// hospedagem de acordo: carga em servidor de terceiros sem combinar é abuso.
//
// Uso (precisa do k6: https://grafana.com/docs/k6/latest/set-up/install-k6/):
//   npm run build && npx vite preview --port 4173
//   k6 run scripts/carga.k6.js                      (100 pessoas)
//   k6 run -e PESSOAS=1000 scripts/carga.k6.js      (1.000 pessoas)
//   k6 run -e BASE=https://dominio.com.br scripts/carga.k6.js
// ---------------------------------------------------------------------------
import http from 'k6/http';
import { check, sleep } from 'k6';
import { parseHTML } from 'k6/html';

const BASE = (__ENV.BASE || 'http://localhost:4173').replace(/\/$/, '');
const PESSOAS = Number(__ENV.PESSOAS || 100);

export const options = {
  stages: [
    { duration: '30s', target: PESSOAS }, // chegada gradual
    { duration: '1m', target: PESSOAS }, // todo mundo ao mesmo tempo
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'max'],
};

const absoluta = (url) => (url.startsWith('http') ? url : `${BASE}${url.startsWith('/') ? '' : '/'}${url}`);

// Endereços que o navegador pede logo ao abrir a página. Lidos do HTML uma
// vez só, antes do teste (setup), para todos os usuários usarem os mesmos.
export function setup() {
  const resposta = http.get(`${BASE}/`);
  if (resposta.status !== 200) throw new Error(`${BASE}/ respondeu ${resposta.status}`);
  const doc = parseHTML(resposta.body);
  const urls = new Set();
  doc.find('link[rel="stylesheet"], link[rel="preload"], link[rel="modulepreload"], link[rel="icon"]').each((_, el) => {
    urls.add(el.getAttribute('href'));
  });
  doc.find('script[src]').each((_, el) => urls.add(el.getAttribute('src')));
  // Imagens da primeira tela: as de carregamento imediato (o resto espera o scroll).
  for (const picture of doc.find('picture').toArray()) {
    const img = picture.find('img');
    if (img.attr('loading') !== 'eager') continue;
    const srcset = picture.find('source[type="image/avif"]').attr('srcset') || img.attr('srcset') || img.attr('src') || '';
    // A versão do meio do srcset: a que um celular costuma escolher.
    const opcoes = srcset.split(',').map((s) => s.trim().split(' ')[0]).filter(Boolean);
    if (opcoes.length) urls.add(opcoes[Math.floor(opcoes.length / 2)]);
  }
  return { recursos: [...urls].filter(Boolean).map(absoluta) };
}

export default function ({ recursos }) {
  const pagina = http.get(`${BASE}/`, { tags: { tipo: 'html' } });
  check(pagina, { 'página 200': (r) => r.status === 200 });
  // O navegador pede os recursos em paralelo.
  const respostas = http.batch(recursos.map((url) => ['GET', url, null, { tags: { tipo: 'recurso' } }]));
  check(respostas, { 'recursos 200': (rs) => rs.every((r) => r.status === 200) });
  sleep(3 + Math.random() * 5);
}
