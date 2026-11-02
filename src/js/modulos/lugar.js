// Mantém o lugar da leitura quando a tela muda de tamanho (janela
// redimensionada, celular girado). A altura dos trechos animados (galeria,
// rodas, seções empilhadas) depende do tamanho da tela; no recálculo, o
// ScrollTrigger devolve a mesma rolagem em pixels, que passaria a cair em
// outra seção (ou no topo, quando as rodas são refeitas no giro).
// Sempre que a rolagem para, guarda a seção que está no meio da tela e quanto
// dela já passou; depois de um recálculo causado pela mudança de tamanho,
// volta para o mesmo ponto da mesma seção.
import { ScrollTrigger } from '../core/gsap.js';
import { temMouse } from '../core/ambiente.js';
import { comPosicoesNaturais, obterLenis, rolarPara } from '../core/scroll.js';

// Recálculos que chegam até este tempo (ms) depois da mudança de tamanho
// ainda devolvem a pessoa ao lugar (o giro do celular dispara mais de um).
const JANELA = 1500;

export function manterLugar() {
  const secoes = [...document.querySelectorAll('main > section, body > footer')];
  if (!secoes.length) return;
  let lugar = null;
  let mudouEm = -Infinity;
  let largura = window.innerWidth;
  let altura = window.innerHeight;

  // Posições do HTML (sem as seções paradas): é nelas que a rolagem anda.
  const medir = (secao) => ({ topo: secao.getBoundingClientRect().top + window.scrollY, altura: secao.offsetHeight });

  function guardar() {
    // Logo depois da mudança de tamanho, a rolagem que o navegador ajusta
    // sozinho (com a página ainda pela metade) não conta como lugar novo.
    if (performance.now() - mudouEm < JANELA) return;
    const meio = window.scrollY + window.innerHeight / 2;
    lugar = comPosicoesNaturais(() => {
      for (const secao of secoes) {
        const m = medir(secao);
        if (meio >= m.topo && meio < m.topo + m.altura) return { secao, fracao: (meio - m.topo) / m.altura };
      }
      return null;
    });
  }

  function voltar() {
    if (!lugar || performance.now() - mudouEm > JANELA) return;
    const m = comPosicoesNaturais(() => medir(lugar.secao));
    // O Lenis guarda o limite da rolagem; a página acabou de mudar de altura.
    obterLenis()?.resize();
    rolarPara(m.topo + lugar.fracao * m.altura - window.innerHeight / 2, { imediato: true });
  }

  // No toque, só a largura conta: a barra do navegador aparecendo e sumindo
  // muda a altura a toda hora, com a pessoa rolando.
  window.addEventListener('resize', () => {
    if (window.innerWidth !== largura || (temMouse && window.innerHeight !== altura)) mudouEm = performance.now();
    largura = window.innerWidth;
    altura = window.innerHeight;
  });
  // Sem medir na carga (medir pede um layout da página inteira, caro no
  // celular): parada no topo, a página continua no topo depois do resize; e
  // a rolagem restaurada numa recarga já dispara o scrollEnd.
  ScrollTrigger.addEventListener('scrollEnd', guardar);
  ScrollTrigger.addEventListener('refresh', voltar);
}
