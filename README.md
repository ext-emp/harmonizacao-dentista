# Site do Dr. Henrique Martins

Site one-page do Dr. Henrique Martins, cirurgião-dentista em Novo Hamburgo/RS: harmonização orofacial e lentes de contato dental. É um site estático (a pasta `dist/`), sem formulário, cookie nem rastreamento.

- **Stack:** Vite + JavaScript puro (módulos ES), GSAP (ScrollTrigger e SplitText), Lenis (scroll suave) e Three.js (a pérola 3D do hero). As imagens são geradas com `sharp`, e os testes rodam no Chrome com Playwright.
- **Conteúdo no HTML:** o texto fica em `index.html` e `src/secoes/*.html`. No build, um plugin (`vite/`) monta as seções, preenche os dados do doutor e gera o `<picture>` de cada imagem. A página funciona sem JavaScript e com movimento reduzido.
- **Regras:** o site segue a Resolução CFO 196/2019 (sem preço, promessa, superlativo, "especialista" nem depoimento; antes e depois só com nome, CRO e autorização por escrito). As regras completas e as convenções estão em `.kiro/steering/projeto.md`, e o briefing, em `docs/briefing.md`.

## Como rodar

Precisa do Node.js 20.19 ou mais novo (o Vite 8 não roda em versões anteriores; testado no 24).

```bash
npm install
npm run dev       # servidor de desenvolvimento em http://localhost:5173/
npm run build     # gera as imagens (npm run imagens) e o site em dist/
npm run preview   # serve o dist/ em http://localhost:4173/
```

## Pastas

| Pasta | O que tem |
| --- | --- |
| `src/secoes/` | O HTML de cada seção, na ordem da página (incluídas em `index.html` com `<!-- @incluir ... -->`) |
| `src/css/` | `tokens.css` (cores, tipografia, espaçamentos, grid, easings e durações), `base.css`, `componentes/` e `secoes/` |
| `src/js/core/` | Peças comuns: GSAP, scroll (Lenis), tokens, fontes e detecção de aparelho |
| `src/js/modulos/` | Um módulo por efeito ou seção (header, menu, pilha de seções, galeria, rodas, slider, FAQ…) |
| `src/js/3d/` | A pérola em Three.js e o ruído que a deforma |
| `src/dados/` | `doutor.js` (dados de contato e registro) e `casos.js` (antes e depois) |
| `vite/` | O plugin que monta o HTML: inclusões, dados, dados estruturados e imagens |
| `fotos/` | Originais das imagens, com nomes padronizados |
| `public/` | Arquivos servidos como estão: fontes, favicons, imagem do Open Graph e `img/` (gerada a partir de `fotos/`) |
| `scripts/` | Geração de imagens, testes e capturas de tela (Playwright) |
| `ferramentas/` | Páginas que renderizam a pérola e as imagens provisórias |
| `docs/` | Briefing, referências, créditos das imagens e notas de trabalho |

## Trocar dados, textos e fotos

O que ainda depende do doutor está em `CONTEUDO-PENDENTE.md`, com o lugar de cada item e o tamanho de cada foto. No site, tudo que é provisório aparece com a etiqueta `[CONFIRMAR]`.

- **Dados de contato e registro:** só em `src/dados/doutor.js` (CRO, WhatsApp e mensagem, endereço e mapa, Instagram, horários, domínio). O build espalha esses dados pelo site inteiro.
- **Antes e depois:** a lista fica em `src/dados/casos.js`. Um caso real leva `provisorio: false` e `autorizacaoPorEscrito: true`; sem a autorização marcada, o build para com um aviso. As fotos são `fotos/casos/<id>-antes.jpg` e `fotos/casos/<id>-depois.jpg`.
- **Textos:** direto no HTML de cada seção, em `src/secoes/`.
- **Fotos:** substitua o arquivo em `fotos/` mantendo o nome e rode `npm run imagens` (o `npm run build` também roda). O script recorta no centro e gera as versões AVIF e WebP em `public/img/`. Ao trocar uma foto provisória, apague a etiqueta "provisória" da seção e ajuste o `alt`.
- **Pérola do hero:** a imagem estática (`fotos/hero/perola.png`) se refaz com `npm run perola`, que precisa do Chrome.
- **Prévia do link (WhatsApp, Instagram, Facebook):** `public/og-imagem.jpg`, 1200 × 630 px, trocada direto no lugar (não passa pelo `npm run imagens`).

Com `npm run dev` ligado, a página recarrega sozinha ao salvar um dado ou uma seção, e depois de cada `npm run imagens`.

## Publicar (Vercel ou Netlify)

1. Preencha `site.url` em `src/dados/doutor.js` com o domínio definitivo (com `https://` e sem barra no fim). Sem ele, o build não gera o canonical nem as URLs absolutas do Open Graph e dos dados estruturados.
2. Resolva o que está em `CONTEUDO-PENDENTE.md`. A foto do hero de agora é de banco de imagens e **não pode ir ao ar**.
3. Na Vercel ou na Netlify, importe o repositório com o comando de build `npm run build` e a pasta de publicação `dist`, em Node 20.19 ou mais novo (na Netlify, a variável `NODE_VERSION`, se o padrão for mais antigo). Não há outra variável de ambiente nem servidor.

## Testes

Os scripts de `scripts/` abrem o site no Chrome com Playwright. Uma vez por computador:

```bash
npx playwright install chrome
```

Com o `npm run dev` ligado em outro terminal:

```bash
npm run build
node scripts/testar-interacoes.mjs              # slider (mouse, toque, teclado), carrossel, cursor, tratamentos, FAQ, rodas
node scripts/testar-interacoes.mjs --reduzido   # o mesmo, com movimento reduzido
node scripts/testar-roda.mjs                    # rodas: um gesto ou uma tecla = um passo (desktop) e encaixe no toque
node scripts/testar-foco.mjs                    # teclado, âncoras e o menu do celular
node scripts/testar-foco.mjs --reduzido
node scripts/testar-tamanhos.mjs                # rodas em 11 tamanhos de tela, sem texto sobreposto
node scripts/testar-redimensionar.mjs           # girar o celular ou redimensionar mantém a seção
node scripts/contraste-fundo.mjs                # contraste do texto sobre a foto de fundo do manifesto
node scripts/verificar-imagens.mjs              # todas as imagens aparecem na tela
node scripts/capturar-viagem.mjs                # a pérola não passa por cima do texto nem do retrato
```

Para testar o build, sirva o `dist/` e aponte os scripts para ele com `URL_SITE`:

```bash
npx vite preview --port 4173 --strictPort
URL_SITE=http://localhost:4173/ node scripts/testar-interacoes.mjs
```

`testar-roda.mjs`, `testar-tamanhos.mjs`, `testar-redimensionar.mjs` e `capturar-viagem.mjs` só funcionam no servidor de desenvolvimento.

Capturas de tela para revisão visual (saem em `capturas/`, fora do git):

```bash
node scripts/capturar.mjs --roteiro secoes --vp desktop,mobile --saida capturas/final --ancoras "#espaco,#tratamentos,#resultados,#sobre,#experiencia,#consulta,#faq,#contato"
node scripts/capturar-jornada.mjs --vp desktop --ate 30000 --passo 900 --colunas 8   # a página inteira em quadros
```
