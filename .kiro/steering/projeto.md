# Projeto: site one-page do Dr. Henrique Martins

Cirurgião-dentista em Novo Hamburgo/RS. Focos: harmonização orofacial com naturalidade e lentes de contato dental. Briefing completo em `docs/briefing.md`; o que falta confirmar está em `CONTEUDO-PENDENTE.md`.

## Stack

- Vite + JavaScript puro (módulos ES), GSAP (ScrollTrigger, SplitText), Lenis, Three.js. Site estático em `dist/`, para Vercel ou Netlify.
- O conteúdo fica escrito em HTML (`index.html` + `src/secoes/*.html`). O plugin em `vite/` monta as seções, injeta os dados e gera o markup das imagens no build. A página precisa funcionar sem JavaScript.
- Fontes OFL hospedadas em `public/fonts/` (com preload). Nada de CDN de fontes.

## Onde ficam os dados editáveis

- `src/dados/doutor.js`: nome, CRO, WhatsApp e mensagem, endereço e mapa, Instagram, horários. Único lugar desses dados.
- `src/dados/casos.js`: lista única dos antes e depois.
- `fotos/`: originais com nomes padronizados. `npm run imagens` gera AVIF/WebP com srcset em `public/img/`.
- Origem de cada imagem provisória: `docs/creditos-imagens.md`.

## Regras do CFO (Resolução CFO 196/2019), obrigatórias

- Site em nome do Dr. Henrique, pessoa física. Nome e CRO no rodapé.
- Antes e depois só de casos dele, com nome e CRO sobre a imagem e autorização por escrito do paciente. Nada de fotos do "durante". Banco de imagens nunca como resultado.
- Proibido: preços, promoções, promessa ou garantia de resultado, superlativos ("o melhor", "referência", "nº 1"), comparação com outros profissionais.
- "Cirurgião-dentista", nunca "especialista", até a especialidade ser confirmada no CFO.
- Sem depoimentos de pacientes até confirmação com o CRO-RS.

## Convenções

- Texto em português do Brasil, tom sereno e direto. Nunca dizer "alto padrão": a exclusividade aparece no design.
- Tudo que depende do doutor fica marcado com `[CONFIRMAR]` e listado em `CONTEUDO-PENDENTE.md`. Não inventar números, cursos nem equipamentos.
- Paleta: porcelana e grafite quente como base; champagne só em detalhes (linhas, ícones, botão do slider), nunca em texto sobre fundo claro. Todo texto com contraste WCAG AA.
- Tokens em `src/css/tokens.css` (cores, tipografia, espaçamentos, grid de 12 colunas, easings e durações) espelhados em `src/js/core/tokens.js`. Nada de easing ou duração solta no código.
- Hover só dentro de `@media (hover: hover) and (pointer: fine)`. Cada hover (menos cursor e magnetismo) tem equivalente no toque via classe `is-active`, ligada pelo ScrollTrigger quando o elemento passa pelo centro da tela. Tipo de aparelho pela media query, nunca pela largura.
- `prefers-reduced-motion`: sem Lenis, parallax ou animação longa, todo o conteúdo visível.
- Comentários de código em português. Módulos pequenos em `src/js/`.
- Contenção: nenhuma seção, widget ou efeito fora do briefing sem perguntar. Nada de gradiente roxo, glassmorphism, ícones genéricos, emojis ou cards iguais com sombra.
- Sem formulários, cookies ou rastreamento.
- Commit no git ao fim de cada etapa.
