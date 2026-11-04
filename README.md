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

O que ainda depende do doutor está em `CONTEUDO-PENDENTE.md`, com o lugar de cada item e o tamanho de cada foto. No site, esses dados e textos estão preenchidos com valores **fictícios** (sem marca na tela, para o site parecer pronto); no código, busque por `FICTÍCIO`. Enquanto `ficticio: true` estiver em `src/dados/doutor.js`, o build avisa.

- **Dados de contato e registro:** só em `src/dados/doutor.js` (CRO, WhatsApp e mensagem, endereço e mapa, Instagram, horários, domínio). O build espalha esses dados pelo site inteiro.
- **Antes e depois:** a lista fica em `src/dados/casos.js`. Um caso real leva `provisorio: false` e `autorizacaoPorEscrito: true`; sem a autorização marcada, o build para com um aviso. As fotos são `fotos/casos/<id>-antes.jpg` e `fotos/casos/<id>-depois.jpg`.
- **Textos:** direto no HTML de cada seção, em `src/secoes/`.
- **Fotos:** substitua o arquivo em `fotos/` mantendo o nome e rode `npm run imagens` (o `npm run build` também roda). O script recorta no centro e gera as versões AVIF e WebP em `public/img/`. Ao trocar uma foto provisória, apague a etiqueta "provisória" da seção e ajuste o `alt`. As provisórias de agora são, em boa parte, fotos de banco do Unsplash (autor e link de cada uma em `docs/creditos-imagens.md`); `node scripts/buscar-unsplash.mjs "<busca>"` monta uma folha de contato para escolher outras.
- **Pérola do hero:** a imagem estática (`fotos/hero/perola.png`) se refaz com `npm run perola`, que precisa do Chrome.
- **Prévia do link (WhatsApp, Instagram, Facebook):** `public/og-imagem.jpg`, 1200 × 630 px, trocada direto no lugar (não passa pelo `npm run imagens`).

Com `npm run dev` ligado, a página recarrega sozinha ao salvar um dado ou uma seção, e depois de cada `npm run imagens`.

## Publicar (Vercel ou Netlify)

1. Preencha `site.url` em `src/dados/doutor.js` com o domínio definitivo (com `https://` e sem barra no fim). Sem ele, o build não gera o canonical, o `sitemap.xml` nem as URLs absolutas do Open Graph e dos dados estruturados (e avisa no fim do `npm run build`). O `robots.txt` e o `sitemap.xml` saem sozinhos no `dist/`, a partir desse domínio.
2. Troque os dados fictícios pelos reais (lista em `CONTEUDO-PENDENTE.md`) e mude `ficticio` para `false` em `src/dados/doutor.js`. O número do WhatsApp dos botões também é inventado. O retrato do hero e do Sobre é de banco de imagens e **não pode ir ao ar**; as demais fotos de banco também saem quando chegarem as do consultório.
3. Na Vercel ou na Netlify, importe o repositório com o comando de build `npm run build` e a pasta de publicação `dist`, em Node 20.19 ou mais novo (na Netlify, a variável `NODE_VERSION`, se o padrão for mais antigo). Não há outra variável de ambiente nem servidor.

## Testes

Os scripts de `scripts/` abrem o site no Chrome com Playwright. Uma vez por computador:

```bash
npx playwright install chrome
```

Com o `npm run dev` ligado em outro terminal:

```bash
npm run build
node scripts/testar-interacoes.mjs              # slider (mouse, toque, teclado), carrossel, cursor, tratamentos, FAQ, roda
node scripts/testar-interacoes.mjs --reduzido   # o mesmo, com movimento reduzido
node scripts/testar-roda.mjs                    # roda: um gesto ou uma tecla = um passo (desktop) e encaixe no toque
node scripts/testar-foco.mjs                    # teclado, âncoras e o menu do celular
node scripts/testar-foco.mjs --reduzido
node scripts/testar-tamanhos.mjs                # roda em 16 tamanhos (celulares, iPad, 2560×1440): sem texto sobreposto, centralizada e com os números inteiros na tela
node scripts/testar-redimensionar.mjs           # girar o celular ou redimensionar mantém a seção
node scripts/contraste-fundo.mjs                # contraste do texto sobre a foto de fundo do manifesto
node scripts/verificar-imagens.mjs              # todas as imagens aparecem na tela
node scripts/capturar-viagem.mjs                # a pérola não passa por cima do texto nem do retrato (10 tamanhos, inclusive celular baixo e deitado)
node scripts/verificar-seo.mjs                  # meta tags, JSON-LD, robots.txt e sitemap.xml (como os robôs leem)
```

Para testar o build, sirva o `dist/` e aponte os scripts para ele com `URL_SITE`:

```bash
npx vite preview --port 4173 --strictPort
URL_SITE=http://localhost:4173/ node scripts/testar-interacoes.mjs
URL_SITE=http://localhost:4173/ node scripts/verificar-seo.mjs
```

Desempenho (Lighthouse mobile, com o build no ar na porta 4173; as notas e o que foi feito estão em `docs/plano-transicoes.md`):

```bash
npx -y lighthouse@13.6.0 http://localhost:4173/ --output=json --output=html --output-path=capturas/lighthouse/mobile --chrome-flags="--headless=new"
node scripts/resumo-lighthouse.mjs capturas/lighthouse/mobile.report.json
```

`testar-roda.mjs`, `testar-tamanhos.mjs`, `testar-redimensionar.mjs` e `capturar-viagem.mjs` só funcionam no servidor de desenvolvimento.

### Carga (quantas pessoas ao mesmo tempo)

`scripts/carga.k6.js` usa o [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) (programa à parte, não vem pelo npm). Cada usuário virtual abre a página como um navegador: HTML, CSS, JavaScript, fontes e as imagens da primeira tela; depois espera de 3 a 8 segundos e abre de novo. O teste falha se 5% das respostas passarem de 1 segundo ou se mais de 1% der erro.

```bash
npm run build && npx vite preview --port 4173 --strictPort
k6 run scripts/carga.k6.js                    # 100 pessoas
k6 run -e PESSOAS=1000 scripts/carga.k6.js    # 1.000 pessoas
```

Resultado em 04/11/2026, no build servido pelo `vite preview` na própria máquina (o pior caso: um processo Node, no mesmo computador do k6), 1 min 45 s cada:

| Pessoas ao mesmo tempo | Requisições | Erros | Resposta (mediana / p95 / máxima) |
| --- | --- | --- | --- |
| 100 | 15.511 | 0 | 1,8 ms / 3,8 ms / 36 ms |
| 1.000 | 154.991 | 0 | 2,4 ms / 8,3 ms / 37 ms |

Cada visita baixa uns 440 KB. O site é estático (sem banco de dados nem servidor próprio): no ar, quem responde é a CDN da Vercel ou da Netlify, que aguenta bem mais que isso. Os tempos acima não incluem a internet; o que pesa para o visitante é o tamanho do que ele baixa, já medido pelo Lighthouse. Só rode contra o domínio de produção (`-e BASE=https://...`) com o site publicado e com a hospedagem de acordo.

**Cache:** `vercel.json` e `netlify.toml` dizem por quanto tempo o navegador e a CDN guardam cada arquivo. O CSS e o JS de `assets/` (com um código no nome, que muda a cada build) e as fontes ficam guardados por 1 ano. As imagens de `img/` mantêm o nome quando uma foto é trocada, então ficam guardadas por 1 dia e são renovadas em segundo plano. O HTML segue o padrão da hospedagem, que sempre confere se há versão nova.

**Alerta de lentidão:** no teste, é o limite de 1 segundo. No ar, um monitor externo (o da própria hospedagem ou um serviço como o UptimeRobot) pode avisar quando a página demorar ou cair; ele precisa ser criado na conta de quem publicar.

Capturas de tela para revisão visual (saem em `capturas/`, fora do git):

```bash
node scripts/capturar.mjs --roteiro secoes --vp desktop,mobile --saida capturas/final --ancoras "#espaco,#tratamentos,#resultados,#sobre,#experiencia,#faq,#contato"
node scripts/capturar-jornada.mjs --vp desktop --ate 30000 --passo 900 --colunas 8   # a página inteira em quadros
node scripts/capturar-jornada.mjs --vp 820x1180t --ate 60000 --passo 1180            # LxAt: com toque (aqui, um iPad Air em pé)
```
