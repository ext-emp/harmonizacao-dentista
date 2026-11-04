// Contagem dos números ([data-contar]) em rolos de dígitos: cada dígito dá
// uma volta inteira (0 a 9) e para no valor escrito no HTML. Assim o efeito
// aparece com qualquer número, até com "00".
// O valor escrito continua no HTML para o leitor de tela e para quem está
// sem JavaScript. Com movimento reduzido, o número fica parado.
// Quando a contagem termina, os rolos dão lugar ao número em texto simples.
// Cada rolo tem a largura do seu dígito no número final (algarismos
// proporcionais: o "1" é estreito), então a troca não mexe em nada na tela.
import { gsap } from '../core/gsap.js';
import { dur, ease, sequencia } from '../core/tokens.js';
import { reduzMovimento } from '../core/ambiente.js';

function montarRolos(el) {
  const valor = el.textContent.trim();
  const leitura = document.createElement('span');
  leitura.className = 'visualmente-oculto';
  leitura.textContent = valor;

  const visual = document.createElement('span');
  visual.className = 'contador';
  visual.setAttribute('aria-hidden', 'true');

  const rolos = [];
  for (const [indice, caractere] of [...valor].entries()) {
    if (!/\d/.test(caractere)) {
      const fixo = document.createElement('span');
      fixo.textContent = caractere;
      visual.append(fixo);
      continue;
    }
    // Uma volta inteira mais o dígito final: 0, 1, ..., 9, 0, ..., alvo.
    const passos = 10 + Number(caractere);
    const digito = document.createElement('span');
    digito.className = 'contador__digito';
    const tira = document.createElement('span');
    tira.className = 'contador__tira';
    for (let i = 0; i <= passos; i++) {
      const numero = document.createElement('span');
      numero.textContent = String(i % 10);
      tira.append(numero);
    }
    digito.append(tira);
    visual.append(digito);
    rolos.push({ el, valor, indice, digito, tira, fim: (-100 * passos) / (passos + 1) });
  }

  el.replaceChildren(leitura, visual);
  return rolos;
}

// Largura de cada coluna: a distância até o caractere seguinte no número
// escrito por extenso (inclui o ajuste entre pares de algarismos da fonte).
// Medida quando a contagem começa, com as fontes já carregadas.
function ajustarColunas(rolos) {
  const medidas = new Map();
  for (const { el, valor } of rolos) {
    if (medidas.has(el)) continue;
    const medida = document.createElement('span');
    medida.className = 'contador__medida';
    medida.textContent = valor;
    el.append(medida);
    medidas.set(el, medida);
  }
  const larguras = rolos.map(({ el, indice, valor }) => {
    const texto = medidas.get(el).firstChild;
    const faixa = document.createRange();
    faixa.setStart(texto, indice);
    faixa.setEnd(texto, indice + 1);
    const atual = faixa.getBoundingClientRect();
    if (indice + 1 >= valor.length) return atual.width;
    faixa.setStart(texto, indice + 1);
    faixa.setEnd(texto, indice + 2);
    return faixa.getBoundingClientRect().left - atual.left;
  });
  medidas.forEach((medida) => medida.remove());
  rolos.forEach(({ digito }, i) => {
    digito.style.width = `${larguras[i]}px`;
  });
}

export function iniciarContadores() {
  if (reduzMovimento) return;
  gsap.utils.toArray('[data-numeros]').forEach((grupo) => {
    const numeros = grupo.querySelectorAll('[data-contar]');
    const rolos = [...numeros].flatMap((el) => (/\d/.test(el.textContent) ? montarRolos(el) : []));
    if (!rolos.length) return;
    gsap.fromTo(
      rolos.map((r) => r.tira),
      { yPercent: 0 },
      {
        yPercent: (i) => rolos[i].fim,
        duration: dur.longa * 1.4,
        ease: ease.saida,
        stagger: sequencia,
        scrollTrigger: { trigger: grupo, start: 'top 80%', once: true },
        onStart: () => ajustarColunas(rolos),
        onComplete: () => {
          for (const { el, valor } of rolos) el.textContent = valor;
        },
      },
    );
  });
}
