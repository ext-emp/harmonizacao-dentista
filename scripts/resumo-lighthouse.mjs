// ---------------------------------------------------------------------------
// Resume um relatório JSON do Lighthouse: notas por categoria, métricas e as
// auditorias que não passaram (com os elementos citados, quando houver).
// Uso: node scripts/resumo-lighthouse.mjs capturas/lighthouse/mobile.report.json
// ---------------------------------------------------------------------------
import { readFile } from 'node:fs/promises';

const [arquivo = 'capturas/lighthouse/mobile.report.json'] = process.argv.slice(2);
const r = JSON.parse(await readFile(arquivo, 'utf8'));

console.log(`${r.finalDisplayedUrl}  (${r.configSettings.formFactor}, Lighthouse ${r.lighthouseVersion})`);
for (const c of Object.values(r.categories)) {
  console.log(`  ${c.title.padEnd(16)} ${Math.round(c.score * 100)}`);
}

const metricas = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'];
console.log('\nMétricas');
for (const id of metricas) {
  const a = r.audits[id];
  if (a) console.log(`  ${a.title.padEnd(28)} ${a.displayValue ?? ''}  (nota ${a.score})`);
}

const lcp = r.audits['largest-contentful-paint-element'];
if (lcp?.details?.items?.length) {
  const item = lcp.details.items[0]?.items?.[0] ?? lcp.details.items[0];
  console.log(`\nElemento do LCP: ${item?.node?.snippet ?? JSON.stringify(item).slice(0, 200)}`);
  const fases = lcp.details.items[1]?.items;
  if (fases) console.log('  fases: ' + fases.map((f) => `${f.phase ?? f.label}=${Math.round(f.timing)}ms`).join(', '));
}

console.log('\nAuditorias com problema');
for (const [id, c] of Object.entries(r.categories)) {
  for (const ref of c.auditRefs) {
    const a = r.audits[ref.id];
    if (!a || a.scoreDisplayMode === 'notApplicable' || a.scoreDisplayMode === 'manual' || a.scoreDisplayMode === 'informative') continue;
    if (a.score === null || a.score >= 0.9) continue;
    console.log(`  [${id}] ${a.id}: ${a.title} ${a.displayValue ? `(${a.displayValue})` : ''} nota ${a.score}`);
    const itens = a.details?.items ?? [];
    for (const it of itens.slice(0, 6)) {
      const texto = it.node?.snippet ?? it.url ?? it.source?.url ?? it.label ?? JSON.stringify(it).slice(0, 160);
      const extra = it.wastedBytes ? ` (${Math.round(it.wastedBytes / 1024)} KiB)` : it.wastedMs ? ` (${Math.round(it.wastedMs)} ms)` : '';
      console.log(`      - ${String(texto).slice(0, 180)}${extra}`);
    }
  }
}
