# Transições no estilo LAVA, "O espaço" e as rodas (notas de trabalho)

Pedido do usuário (31/10/2026):
1. "O espaço" vira a 2ª seção: galeria com scroll lateral; a última foto vira o fundo dos "atendimentos" (manifesto + fotos flutuando).
2. Trocar as transições pelas da LAVA: cada seção desliza por cima da anterior, que fica parada.
3. No fim: experiência e consulta viram a "roda" da LAVA (foto 1): a cada scroll a roda gira e passa um passo.
4. Continuar o que estava em andamento (viagem da pérola, testes, docs, resposta sobre texto justificado, aviso da foto de banco).

## O que a LAVA faz (medido em docs/referencias/lava-transicoes/)
- Hero `position: sticky`; o resto da página sobe por cima dele.
- Galeria: itens de 100vw x 100vh com clip-path mostrando só um "cartão"; o trilho anda na horizontal.
  O item principal abre o clip-path até a tela cheia (e escala 1.1): vira o fundo.
- Sobre o fundo: frase centralizada parada; fotos pequenas sobem por cima, em posições de grid de 12 colunas.
- Roda: seção alta com palco sticky; 6 itens a 60° num círculo grande; o número ativo fica no topo,
  com um traço descendo até o título e o texto. Cada gesto de rolagem anda exatamente 450 px (um passo).
- Seções seguintes: margin-top -160px e clip-path que abre de cima (a borda sobe um pouco mais rápido).

## Como ficou
- Empilhamento (`pilha.js`, `secao.css`): `position: sticky` no CSS (`.pilha--ativa[data-pilha]`,
  `top: min(0px, calc(100svh - var(--pilha-altura)))`), alturas medidas no JS. A classe `.pilha-medindo`
  no `<html>` desliga os stickies durante o refresh do ScrollTrigger, para medir as posições naturais.
  Véu grafite (até 0,32) no painel que está sendo coberto; `.pilha--coberta` solta o sticky quando o
  painel some de vez. O contato entra em caixa (clip-path com cantos arredondados que abre até 0).
  O pin do GSAP com `pinSpacing: false` foi descartado: atrasava no toque e criava pin-spacers.
- Âncoras e foco: `rolarPara` usa a posição natural (`topoNaPagina`); o foco do teclado dentro de um
  painel coberto rola até a posição em que ele fica descoberto.
- Espaço (`section#espaco`): abertura (frase + pouso da pérola) -> palco sticky (galeria) -> percurso ->
  manifesto aninhado (`@incluir`), por cima do palco já em tela cheia (fundo = espaco-05 + véu).
  A última foto é um quadro de 100vw × 100svh recortado no tamanho do cartão; o recorte abre até a
  tela cheia, a imagem vai de 1,1 a 1 e o véu aparece.
- Manifesto: parágrafo parado no centro com as palavras acendendo; quatro fotos do atendimento sobem
  em ritmos diferentes (`data-flutua`). Os números ficam num painel grafite sobre a foto (texto pequeno
  não pode ficar direto sobre a imagem). Palavra apagada sobre a foto: `--cor-manifesto-apagado-foto`.
- Pérola: o elemento que viaja mora no pouso (abertura do espaço), reparentado por JS; antes do pouso,
  um deslocamento o leva até o lugar no hero. Sem JS ou com movimento reduzido: fica no hero.
- Rodas (`roda.js` + `roda.css`): lista acessível de verdade no HTML; a roda desenhada é aria-hidden e
  se ajusta ao número de itens. Mouse: trava por gesto via `virtualScroll` do Lenis (um gesto = um
  passo, com `scrollTo` animado). Toque: snap direcional do ScrollTrigger. Movimento reduzido/sem JS:
  lista simples. A consulta passou para o tema claro.
- Imagens provisórias novas: fotos/espaco/espaco-01..05 (ambientes renderizados, ferramentas/ambientes.js)
  e fotos/atendimento/atendimento-01..04 (detalhes sem paciente; CFO proíbe foto do "durante").

## Verificação (31/10/2026)
- `npm run build` sem erros.
- `scripts/testar-interacoes.mjs`: 45/45 no dev e no build (porta 4173); 36/36 com movimento reduzido.
- `scripts/testar-roda.mjs`: desktop (um gesto = um passo, nos dois sentidos) e celular (toque com snap).
- `scripts/testar-foco.mjs` (normal e `--reduzido`): 31 elementos focáveis até o rodapé, nenhum coberto;
  todas as âncoras param no topo da seção, com foco.
- `scripts/capturar-viagem.mjs`: a pérola não encosta em texto nem no retrato em 5 tamanhos de tela.
- `scripts/contraste-fundo.mjs`: todo texto sobre a foto de fundo passa no AA (desktop e celular).
- `scripts/verificar-imagens.mjs`: todas as imagens carregam (desktop e celular, dev e build).
- Capturas da página inteira: `capturas/jornada/` (com e sem movimento reduzido) e
  `capturas/transicoes-sem-js/` (sem JavaScript, desktop e celular).

## Lighthouse mobile (31/10/2026, adiado a pedido do usuário)
Medido no build local (`npm run build` + `npx vite preview --port 4173`) com `npx -y lighthouse@13.6.0 http://localhost:4173/ --output=json --output=html --output-path=capturas/lighthouse/mobile --chrome-flags="--headless=new"`.
O resumo sai com `node scripts/resumo-lighthouse.mjs capturas/lighthouse/mobile.report.json`.

| Categoria | Nota | Meta do briefing |
| --- | --- | --- |
| Desempenho | 49 | 80 ou mais |
| Acessibilidade | 100 | 95 ou mais |
| Boas práticas | 100 | |
| SEO | 92 | 95 ou mais |

Desempenho: FCP 2,2 s, LCP 4,9 s, TBT 2.510 ms, CLS 0,001, Speed Index 4,0 s.
- LCP: o elemento é a imagem do retrato do hero. Ela chega em 51 ms, mas o "atraso para renderizar o elemento" é de 3,4 s dos 4,9 s. Hipótese, ainda não verificada: o retrato só aparece depois do preloader (cerca de 2 s na primeira visita) e da animação de entrada do hero, e a thread principal está ocupada nesse tempo.
- Thread principal (6,7 s simulados no celular): 2,9 s de scripts, 2,6 s de estilo e layout, 1,0 s de outros. O `index-*.js` (177 kB) responde por quase tudo (4,3 s, contando o estilo e o layout que ele dispara). O `perola-*.js` (Three.js, 543 kB) custa só 139 ms.
- O CSS (47 kB) bloqueia a renderização (economia estimada de 150 ms).
SEO: a única falha é "robots.txt inválido". Não existe `public/robots.txt`, e o `vite preview` devolve o `index.html` para qualquer caminho, o que o Lighthouse lê como robots.txt quebrado. Provavelmente some no host de verdade (um arquivo ausente dá 404); confirmar lá, ou criar `public/robots.txt`.
O relatório completo fica em `capturas/lighthouse/` (pasta ignorada pelo git).

## Próximos passos
- Etapa 3: polimento de celular e acessibilidade em aparelhos reais; desempenho e SEO (ver Lighthouse acima), que o usuário vai tratar depois.
- Etapa 4: capturas finais em 1440×900 e 390×844, revisão independente do código por outro modelo, correção dos bugs reais, `README.md` (como rodar, trocar fotos e dados e publicar) e resumo das pendências.
- Em outro computador: `git clone`, `npm install`, `npx playwright install chrome` (só para os scripts de teste em `scripts/`), `npm run dev`. Os testes (`scripts/testar-*.mjs`) esperam o site em http://localhost:5173/ (ou em `URL_SITE`).
