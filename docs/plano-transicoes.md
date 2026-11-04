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
  lista simples. Em 01/11/2026 a consulta, que tinha uma roda igual, foi unida à experiência (uma roda só).
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

## Lighthouse mobile
Medido no build local (`npm run build` + `npx vite preview --port 4173`) com `npx -y lighthouse@13.6.0 http://localhost:4173/ --output=json --output=html --output-path=capturas/lighthouse/mobile --chrome-flags="--headless=new"`.
O resumo sai com `node scripts/resumo-lighthouse.mjs capturas/lighthouse/mobile.report.json`. O relatório completo fica em `capturas/lighthouse/` (pasta ignorada pelo git).

| Categoria | 31/10/2026 | 02/11/2026 (três rodadas) | Meta do briefing |
| --- | --- | --- | --- |
| Desempenho | 49 | 97 | 80 ou mais |
| Acessibilidade | 100 | 100 | 95 ou mais |
| Boas práticas | 100 | 100 | |
| SEO | 92 | 100 | 95 ou mais |

02/11/2026 (build final, três rodadas iguais): LCP 2,3 s (era 4,2 a 4,9 s), TBT 40 ms (era 1.700 a 2.510 ms), FCP 0,8 s, CLS 0,004.

O que pesava (perfil de CPU com a CPU 4x mais lenta, como no Lighthouse, num build sem minificação) e o que mudou:
- Recálculos repetidos do ScrollTrigger na carga: os automáticos do DOMContentLoaded e do load, mais os pedidos do código (fontes no `main.js` e no `revelar.js`, load e cada leva de imagens). Cada um mede a página inteira: de 50 a 200 ms com a tela travada no celular. Agora há um só, quando as fontes chegam; depois disso, só se a altura da página mudar (`main.js`).
- Títulos divididos duas vezes: o `autoSplit` do SplitText refaz a divisão no evento `loadingdone` das fontes, que chegava logo depois da primeira. Agora `aguardarFontes` espera também o `document.fonts.ready`, que o Chrome só resolve depois desse evento.
- `medirAlturas` (`pilha.js`) alternava leitura e escrita: um layout da página inteira por painel. Agora lê tudo e depois escreve.
- `lugar.js` media a página na carga (mais um layout inteiro). Agora só mede quando a rolagem para.
- Pérola 3D: a montagem era uma tarefa só de uns 470 ms no celular (o mapa de reflexos, PMREM, compila shaders de forma síncrona) e caía no meio da entrada do hero. Agora espera a entrada terminar e é dividida em etapas (`perola.js`).
- SEO: faltava o robots.txt. O build gera `robots.txt` e, com `site.url`, o `sitemap.xml` (`vite/arquivos-raiz.js`).

Ainda pesam o primeiro layout da página (uns 250 ms no celular simulado) e o CSS que bloqueia a renderização (uns 180 ms). O Speed Index acompanha o preloader, que é decisão de design. A categoria nova "Agentic Browsing" do Lighthouse 13 (`llms.txt`) só falha no `vite preview`, que devolve o `index.html` para qualquer endereço.

## Próximos passos
- Etapa 3: polimento de celular e acessibilidade em aparelhos reais. Desempenho e SEO tratados em 02/11/2026 (ver Lighthouse acima).
- Etapa 4: capturas finais em 1440×900 e 390×844, revisão independente do código por outro modelo, correção dos bugs reais, `README.md` (como rodar, trocar fotos e dados e publicar) e resumo das pendências.
- Em outro computador: `git clone`, `npm install`, `npx playwright install chrome` (só para os scripts de teste em `scripts/`), `npm run dev`. Os testes (`scripts/testar-*.mjs`) esperam o site em http://localhost:5173/ (ou em `URL_SITE`).
