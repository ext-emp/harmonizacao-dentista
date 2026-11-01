// Contraste WCAG 2 entre os pares de cor do design system.
// Uso: node scripts/contraste.mjs
// Mistura uma cor com alfa sobre um fundo (para medir texto sobre véus).
const misturar = (frente, alfa, fundo) => {
  const f = frente.match(/\w\w/g).map((h) => parseInt(h, 16));
  const b = fundo.match(/\w\w/g).map((h) => parseInt(h, 16));
  return `#${f.map((c, i) => Math.round(c * alfa + b[i] * (1 - alfa)).toString(16).padStart(2, '0')).join('')}`;
};

const cores = {
  porcelana: '#f3efe8',
  linho: '#eae4da',
  perola: '#fbf9f5',
  grafite: '#161513',
  grafite2: '#211f1c',
  champagne: '#bfa77a',
  texto2Claro: '#645e55',
  texto2Escuro: '#a8a196',
  // Palavras do manifesto antes de acender (texto grande sobre grafite).
  manifestoApagado: '#7a746b',
  branco: '#ffffff',
  // Pior caso das etiquetas sobre as fotos: véu grafite a 60% sobre uma foto quase branca.
  veuSobreFotoClara: misturar('#161513', 0.6, '#fafafa'),
};

const linear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminancia = (hex) => {
  const [r, g, b] = hex.match(/\w\w/g).map((h) => linear(parseInt(h, 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const pares = [
  ['grafite', 'porcelana'],
  ['grafite', 'linho'],
  ['grafite', 'perola'],
  ['texto2Claro', 'porcelana'],
  ['texto2Claro', 'linho'],
  ['texto2Claro', 'perola'],
  ['porcelana', 'grafite'],
  ['porcelana', 'grafite2'],
  ['texto2Escuro', 'grafite'],
  ['texto2Escuro', 'grafite2'],
  ['champagne', 'grafite'],
  ['champagne', 'grafite2'],
  ['champagne', 'porcelana'],
  ['manifestoApagado', 'grafite'],
  ['porcelana', 'manifestoApagado'],
  ['branco', 'veuSobreFotoClara'],
];

for (const [texto, fundo] of pares) {
  const r = contraste(cores[texto], cores[fundo]);
  const nota = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA texto grande' : 'reprova';
  console.log(`${texto.padEnd(13)} sobre ${fundo.padEnd(10)} ${r.toFixed(2)}:1  ${nota}`);
}
