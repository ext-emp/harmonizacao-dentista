// Diagnóstico: pula direto para os resultados (passando pelos tratamentos
// sem parar) e volta. As revelações dos tratamentos precisam ter rodado.
(async () => {
  const ir = (sel, d = 0) => {
    const el = document.querySelector(sel);
    const y = el.getBoundingClientRect().top + window.scrollY + d;
    window.__lenis.scrollTo(y, { immediate: true });
  };
  const estado = () =>
    [...document.querySelectorAll('[data-revelar="imagem"]')].map((m) => ({
      classe: m.className.split(' ')[0],
      clipInline: m.style.clipPath,
      clipCalc: getComputedStyle(m).clipPath,
    }));
  ir('#resultados', 150);
  await new Promise((r) => setTimeout(r, 2500));
  const noMeio = estado();
  ir('.tratamento--rosto', -120);
  await new Promise((r) => setTimeout(r, 2500));
  return { noMeio, depois: estado() };
})()
