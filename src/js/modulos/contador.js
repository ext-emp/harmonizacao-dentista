// Contagem dos números ([data-contar]) em rolos de dígitos: cada dígito dá
// uma volta inteira (0 a 9) e para no valor escrito no HTML. Assim o efeito
// aparece até com o "00" provisório, sem inventar número nenhum.
// O valor escrito continua no HTML para o leitor de tela e para quem está
// sem JavaScript. Com movimento reduzido, o número fica parado.
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
  for (const caractere of valor) {
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
    rolos.push({ tira, fim: (-100 * passos) / (passos + 1) });
  }

  el.replaceChildren(leitura, visual);
  return rolos;
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
      },
    );
  });
}
