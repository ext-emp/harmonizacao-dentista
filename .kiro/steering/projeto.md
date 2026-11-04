# Projeto: site one-page do Dr. Henrique Martins

Cirurgião-dentista em Novo Hamburgo/RS. Focos: harmonização orofacial com naturalidade e lentes de contato dental. Briefing completo em `docs/briefing.md`; o que falta confirmar está em `CONTEUDO-PENDENTE.md`.

## Stack

- Vite + JavaScript puro (módulos ES), GSAP (ScrollTrigger, SplitText), Lenis, Three.js. Site estático em `dist/`, para Vercel ou Netlify.
- O conteúdo fica escrito em HTML (`index.html` + `src/secoes/*.html`). O plugin em `vite/` monta as seções, injeta os dados e gera o markup das imagens no build. A página precisa funcionar sem JavaScript.
- Fontes OFL hospedadas em `public/fonts/` (com preload). Nada de CDN de fontes.
- SEO: title, description, robots, Open Graph e Twitter Card (`index.html` e `vite/geradores.js`); JSON-LD `Dentist`, `WebSite` e `FAQPage` (lido do HTML do FAQ); `robots.txt` e `sitemap.xml` gerados pelo plugin a partir de `site.url` (`vite/arquivos-raiz.js`). Conferir com `scripts/verificar-seo.mjs`.
- Desempenho: o recálculo da página inteira pelo ScrollTrigger custa caro no celular. Ele acontece uma vez quando as fontes chegam e, depois, só se a altura da página mudar (`main.js`); os módulos não chamam `ScrollTrigger.refresh()` na carga. Medições de layout em bloco (todas as leituras, depois as escritas). A pérola 3D só é montada depois da entrada do hero.

## Onde ficam os dados editáveis

- `src/dados/doutor.js`: nome, CRO, WhatsApp e mensagem, endereço e mapa, Instagram, horários. Único lugar desses dados.
- `src/dados/casos.js`: lista única dos antes e depois.
- `fotos/`: originais com nomes padronizados. `npm run imagens` gera AVIF/WebP com srcset em `public/img/`.
- Origem de cada imagem provisória: `docs/creditos-imagens.md`. Desde 02/11/2026, a pedido do usuário, várias provisórias são fotos de banco do Unsplash (espaço, manifesto, blocos de tratamento) e o Sobre usa o retrato de banco do hero: só como provisórias, com etiqueta na tela e crédito registrado, nunca como resultado e nunca do "durante".

## Regras do CFO (Resolução CFO 196/2019), obrigatórias

- Site em nome do Dr. Henrique, pessoa física. Nome e CRO no rodapé.
- Antes e depois só de casos dele, com nome e CRO sobre a imagem e autorização por escrito do paciente. Nada de fotos do "durante". Banco de imagens nunca como resultado.
- Proibido: preços, promoções, promessa ou garantia de resultado, superlativos ("o melhor", "referência", "nº 1"), comparação com outros profissionais.
- "Cirurgião-dentista", nunca "especialista", até a especialidade ser confirmada no CFO.
- Sem depoimentos de pacientes até confirmação com o CRO-RS.

## Estrutura e movimento (decisões do usuário)

- Ordem: preloader, header, hero, O espaço (galeria lateral; a última foto vira o fundo do manifesto e dos números), tratamentos, resultados, sobre, experiência (com as etapas da consulta), FAQ, contato e rodapé.
- Hero: retrato do Dr. Henrique recortado, sem fundo (`fotos/hero/doutor-capa.png`, PNG transparente 4:5), texto à esquerda, nunca sobre a pessoa. A pérola tem área própria no hero (nunca atrás do retrato) e, com o scroll, pousa na abertura de "O espaço" (`perola-viagem.js`). Nunca paciente nem foto de banco no hero.
- Transições no estilo da LAVA dental: cada seção com `data-pilha` sobe por cima da anterior, que fica parada (`position: sticky` em `pilha.js` e `secao.css`); o contato entra em caixa.
- Experiência: a roda (`roda.js`, `roda.css`), uma só no site. A primeira consulta, que tinha uma roda igual, foi unida a ela em 01/11/2026 (o usuário não quis duas seções iguais): seis etapas, do agendamento ao acompanhamento. Um gesto de rolagem (ou um Page Down, Page Up ou Espaço) = um passo no mouse e no trackpad; snap no toque. A lista `<ol>` real fica no HTML e a roda desenhada é `aria-hidden`. A nota da seção fica no cabeçalho (no desktop, à direita, sob o contador), e a roda desce o quanto o cabeçalho pedir. No celular deitado e em telas baixas demais, fica a lista.
- Girar o celular ou redimensionar a janela mantém a seção que a pessoa lia (`lugar.js`).
- Sem JavaScript ou com `prefers-reduced-motion`: rolagem normal, galeria com scroll lateral nativo, rodas como lista numerada.

## Convenções

- Texto em português do Brasil, tom sereno e direto. Nunca dizer "alto padrão": a exclusividade aparece no design.
- Tudo que depende do doutor fica listado em `CONTEUDO-PENDENTE.md`. Desde 01/11/2026, a pedido do usuário, não há marca na tela: os dados e textos estão preenchidos com valores fictícios realistas, marcados com `FICTÍCIO` só no código, e o build avisa enquanto `ficticio: true` estiver em `doutor.js`. Os fictícios seguem as regras do CFO (nada de especialista, superlativo, promessa, preço ou depoimento). O número do WhatsApp no link fica vazio até o real chegar (um número inventado mandaria a pessoa para um desconhecido). Não inventar equipamentos.
- Paleta: porcelana e grafite quente como base; champagne só em detalhes (linhas, ícones, botão do slider), nunca em texto sobre fundo claro. Todo texto com contraste WCAG AA.
- Tokens em `src/css/tokens.css` (cores, tipografia, espaçamentos, grid de 12 colunas, easings e durações) espelhados em `src/js/core/tokens.js`. Nada de easing ou duração solta no código.
- Hover só dentro de `@media (hover: hover) and (pointer: fine)`. Cada hover (menos cursor e magnetismo) tem equivalente no toque via classe `is-active`, ligada pelo ScrollTrigger quando o elemento passa pelo centro da tela. Tipo de aparelho pela media query, nunca pela largura.
- Tablets: abaixo de 64em vale o layout de celular, mas Sobre e Tratamentos ficam em duas colunas a partir de 48em. O hero (e a pérola) só usam o layout de texto à esquerda em tela larga **e deitada** (`(min-width: 64em) and (orientation: landscape)`): num iPad Pro em pé, o retrato fica no alto. Conferir com `capturar-jornada.mjs --vp 820x1180t` (o `t` é toque).
- `prefers-reduced-motion`: sem Lenis, parallax ou animação longa, todo o conteúdo visível.
- Comentários de código em português. Módulos pequenos em `src/js/`.
- Contenção: nenhuma seção, widget ou efeito fora do briefing sem perguntar. Nada de gradiente roxo, glassmorphism, ícones genéricos, emojis ou cards iguais com sombra.
- Sem formulários, cookies ou rastreamento.
- Git: o repositório de destino é `origin` = https://github.com/ext-emp/harmonizacao-dentista.git (branch `main`), indicado pelo usuário em 31/10/2026, que mandou subir tudo para continuar em outro computador. Daí em diante, só fazer commit e push quando o usuário pedir, e nunca publicar em outro lugar (Vercel, Netlify etc.) sem pedido.
- Estado e próximos passos: `docs/plano-transicoes.md` (o que foi feito, como foi testado e o que falta). Pendências do doutor: `CONTEUDO-PENDENTE.md`.
