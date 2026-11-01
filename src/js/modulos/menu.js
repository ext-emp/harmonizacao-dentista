// Menu em tela cheia (abaixo de 64em): cortina descendo e links entrando
// em sequência. Esc fecha, o resto da página fica inerte e o foco volta
// para o botão. No desktop o mesmo <nav> é a barra de links.
import { gsap } from '../core/gsap.js';
import { dur, ease, sequencia } from '../core/tokens.js';
import { reduzMovimento } from '../core/ambiente.js';
import { liberarScroll, travarScroll } from '../core/scroll.js';

export function iniciarMenu() {
  const header = document.querySelector('[data-header]');
  const menu = document.querySelector('[data-menu]');
  const botao = document.querySelector('[data-menu-botao]');
  if (!header || !menu || !botao) return;

  const rotulo = botao.querySelector('[data-menu-rotulo]');
  const links = menu.querySelectorAll('.menu__link');
  const extras = menu.querySelector('[data-menu-extras]');
  const telaCheia = window.matchMedia('(max-width: 63.999em)');
  const foraDoMenu = () =>
    [document.querySelector('main'), document.querySelector('footer'), header.querySelector('.header__cta')].filter(Boolean);

  let aberto = false;
  let animacao = null;

  // O link "#menu" (que funciona sem JS) passa a se comportar como botão.
  botao.setAttribute('role', 'button');
  botao.setAttribute('aria-expanded', 'false');

  function abrir() {
    aberto = true;
    animacao?.kill();
    header.classList.add('header--menu-aberto');
    header.classList.remove('header--oculto');
    menu.classList.add('esta-aberto');
    botao.setAttribute('aria-expanded', 'true');
    rotulo.textContent = 'Fechar';
    foraDoMenu().forEach((el) => el.setAttribute('inert', ''));
    travarScroll();

    if (reduzMovimento) {
      gsap.set(menu, { clipPath: 'inset(0% 0% 0% 0%)' });
    } else {
      animacao = gsap
        .timeline()
        .fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: dur.cortina, ease: ease.cortina })
        .fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: dur.lenta, ease: ease.saida, stagger: sequencia }, dur.cortina * 0.45)
        .fromTo(extras, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: dur.media, ease: ease.saida }, dur.cortina * 0.8);
    }
    links[0]?.focus({ preventScroll: true });
  }

  function fechar({ instantaneo = false, devolverFoco = true } = {}) {
    if (!aberto) return;
    aberto = false;
    animacao?.kill();
    botao.setAttribute('aria-expanded', 'false');
    rotulo.textContent = 'Menu';
    foraDoMenu().forEach((el) => el.removeAttribute('inert'));
    liberarScroll();

    const concluir = () => {
      menu.classList.remove('esta-aberto');
      header.classList.remove('header--menu-aberto');
      gsap.set([menu, ...links, extras], { clearProps: 'clipPath,transform,opacity' });
    };
    if (instantaneo || reduzMovimento) concluir();
    else animacao = gsap.to(menu, { clipPath: 'inset(0% 0% 100% 0%)', duration: dur.media, ease: ease.cortina, onComplete: concluir });

    if (devolverFoco) botao.focus({ preventScroll: true });
  }

  botao.addEventListener('click', (e) => {
    e.preventDefault();
    if (aberto) fechar();
    else abrir();
  });

  // Clicar num link fecha o menu; o módulo de âncoras cuida da rolagem.
  menu.addEventListener('click', (e) => {
    if (aberto && e.target.closest('a')) fechar({ devolverFoco: false });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aberto) fechar();
  });

  // Girou o tablet ou aumentou a janela além de 64em: fecha sem animação.
  telaCheia.addEventListener('change', () => {
    if (!telaCheia.matches) fechar({ instantaneo: true, devolverFoco: false });
  });

  // Se a página abriu com #menu na URL (caminho sem JS), limpa.
  if (location.hash === '#menu') history.replaceState(null, '', location.pathname + location.search);
}
