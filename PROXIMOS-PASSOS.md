# Próximos passos

O site está completo e testado: todas as seções, as transições no estilo da LAVA, "O espaço" e as rodas. Falta o fechamento (etapa 4 do briefing), em quatro passos.

## Situação em 01/11/2026 (nada commitado)

- **Passo 1, parcial.** A revisão por outro modelo não terminou: o Fable foi parado pelo custo (regra nova no `CLAUDE.md` global: não usar Fable) e o Sonnet parou no limite de 5 horas da conta antes do relatório. O relatório `.agents/reviews/revisao.md` junta a pista que o Fable deixou e uma revisão do agente principal (mesmo modelo, não independente). Falta: se quiser o segundo olhar de outro modelo, retomar o revisor Sonnet depois que o limite liberar (o trabalho dele fica salvo).
- **Passo 2, feito.** Sete achados reproduzidos e corrigidos, com o destino de cada um no relatório:
  - rodas por cima do título e da nota;
  - lugar da leitura perdido ao girar ou redimensionar;
  - Page Down e Espaço pulando passos;
  - troca de sentido ignorada;
  - duas falhas do menu do celular;
  - contador fixo no HTML.

  Todos os testes abaixo passam.
- **Passo 3, feito.** Capturas em `capturas/final/` (seções, movimento reduzido, sem WebGL e a página inteira em quadros, nos dois tamanhos). Única sobreposição achada: as rodas, corrigida no passo 2. Console limpo.
- **Passo 4, feito.** `README.md` criado e seguido num clone limpo (`npm install` e `npm run build` sem erro, nenhum `.map`). `CONTEUDO-PENDENTE.md` cobre todos os `[CONFIRMAR]` e ganhou a imagem de prévia do link.

## Depois dos quatro passos (01 e 02/11/2026, nada commitado)

- **Uma roda só.** O texto do passo ficava fora do centro em telas com mais de 1920 px (a margem da grade era zerada); corrigido. A primeira consulta, que repetia a roda da experiência, foi unida a ela: seis etapas, do agendamento ao acompanhamento. No menu, "Consulta" virou "Experiência".
- **SEO 100.** O build gera `robots.txt` e, com `site.url`, o `sitemap.xml`. Entraram meta robots, Twitter Card completo e os dados estruturados `WebSite` e `FAQPage` (lido do HTML do FAQ). Conferir com `scripts/verificar-seo.mjs`.
- **Desempenho 97** no Lighthouse mobile, nas três rodadas (era 49 a 57). Os recálculos repetidos do ScrollTrigger na carga, os títulos divididos duas vezes, as medições em vaivém e a pérola 3D no meio da entrada do hero saíram. Detalhes em `docs/plano-transicoes.md`.
- **Tablets.** Conferidos em iPhone SE, Pixel, iPad (768, 820 e 1024 em pé; 1024, 1180 e 1366 deitado) e 2560×1440 (`capturas/aparelhos/`). No iPad Pro em pé, o hero deixava metade da tela vazia: agora o retrato fica no alto. Sobre e Tratamentos ganharam duas colunas a partir de 48em.
- **Sem `[CONFIRMAR]` na tela.** Os dados e textos que dependem do doutor estão fictícios (lista em `CONTEUDO-PENDENTE.md`), e o build avisa enquanto `ficticio: true` estiver em `doutor.js`.

Para refazer um dos quatro passos, escreva, por exemplo: **"Faça o passo 1 do PROXIMOS-PASSOS.md"**. Vale a ordem 1, 2, 3, 4, porque o passo 2 usa o relatório do passo 1. Os passos 3 e 4 não dependem dos outros.

## Regras para todos os passos

- Ler antes `.kiro/steering/projeto.md` (regras do CFO e convenções) e `docs/briefing.md`.
- Não fazer commit nem push sem o usuário pedir, e não publicar em lugar nenhum.
- Só o passo 1 usa workflow (o briefing abre essa exceção). Os outros se fazem na própria conversa.
- Nenhuma seção, widget ou efeito novo sem perguntar. Tudo que depende do doutor segue marcado com `[CONFIRMAR]`.

## Rodar o projeto num computador novo

```bash
npm install
npx playwright install chrome   # só para os scripts de teste e de captura
npm run dev                     # http://localhost:5173/
```

Os scripts em `scripts/` leem o endereço da variável `URL_SITE` (padrão: `http://localhost:5173/`). Para testar o build de produção:

```bash
npm run build
npx vite preview --port 4173 --strictPort
URL_SITE=http://localhost:4173/ node scripts/testar-interacoes.mjs
```

`testar-roda.mjs`, `testar-tamanhos.mjs`, `testar-redimensionar.mjs` e `capturar-viagem.mjs` só funcionam com o servidor de desenvolvimento: usam `window.__rodas`, `window.__lenis` e `window.__perola`, que só existem nele.

---

## Passo 1. Revisão independente do código

**O que é:** um segundo olhar, de outro modelo, no código do site. A revisão só aponta problemas. A correção é o passo 2.

**Como:**

- Rodar o workflow `bundled://semantic-review-multi-model` (dois revisores em modelos diferentes; o relatório sai em `.agents/reviews/`, dentro da pasta de trabalho). Como alvo, usar o diff `0c3de61..HEAD`: o primeiro commit não tem código do site, então esse diff é o site inteiro. Sem esse workflow, serve qualquer revisão feita por outro modelo.
- Pedir que procurem **bugs reais**, não estilo:
  - Ciclo de vida: ScrollTrigger, Lenis e listeners que nunca são desfeitos; `ScrollTrigger.refresh` depois de fontes e imagens; resize e rotação do aparelho (`pilha.js` mede a altura das seções).
  - Rodas (`roda.js`): gestos de trackpad com inércia, teclado (Espaço, Page Down, setas), âncoras para dentro da roda, troca de sentido no meio do giro, toque.
  - Acessibilidade: foco do teclado numa seção coberta pela seguinte, roda desenhada com `aria-hidden` e a lista real por baixo, FAQ, slider do antes e depois, movimento reduzido, página sem JavaScript.
  - Regras do CFO nos textos (HTML e `src/dados/`): sem preço, promessa ou garantia, superlativo, "especialista", comparação nem depoimento; antes e depois só com nome, CRO e autorização (o build confere a autorização marcada em `src/dados/casos.js`).
  - Plugin de build (`vite/`): dados de `doutor.js` escapados ao entrar no HTML, `target="_blank"` com `rel="noopener"`, nenhum formulário, cookie ou rastreamento.
  - Fora do escopo: desempenho e SEO.

**Pronto quando:** existe o relatório e o usuário viu um resumo dele.

## Passo 2. Corrigir os bugs reais da revisão

**O que é:** tratar o relatório do passo 1.

**Como:**

- Para cada achado, provar que existe (reproduzir no navegador ou apontar a linha que falha) antes de mexer. Falso positivo é descartado com o motivo.
- Corrigir só o que é bug, sem refatorar nem acrescentar efeito ou seção.
- Ao final (e depois de correções grandes), rodar tudo isto com o servidor de desenvolvimento ligado. Na última vez, todos passaram:

```bash
npm run build
node scripts/testar-interacoes.mjs              # 42/42
node scripts/testar-interacoes.mjs --reduzido   # 35/35
node scripts/testar-roda.mjs                    # inclui troca de sentido e teclado
node scripts/testar-foco.mjs                    # inclui o menu do celular
node scripts/testar-foco.mjs --reduzido
node scripts/testar-tamanhos.mjs                # a roda em 16 tamanhos (celulares, iPad, 2560×1440)
node scripts/testar-redimensionar.mjs           # lugar da leitura e giro do celular
node scripts/contraste-fundo.mjs
node scripts/verificar-imagens.mjs
node scripts/capturar-viagem.mjs                # nenhuma sobreposição
node scripts/verificar-seo.mjs                  # meta tags, JSON-LD, robots.txt e sitemap.xml
```

- E uma vez com o build no ar (`npx vite preview --port 4173 --strictPort`): `URL_SITE=http://localhost:4173/ node scripts/testar-interacoes.mjs` (42/42).

**Pronto quando:** o build passa sem erro, todos esses testes passam e cada achado do relatório tem um destino (corrigido, ou descartado com o motivo).

## Passo 3. Capturas finais e revisão visual

**O que é:** olhar a página nos dois tamanhos do briefing (1440×900 e 390×844), com e sem movimento reduzido, e corrigir o que estiver sobreposto, cortado ou mal espaçado.

**Como:** com o servidor de desenvolvimento ligado.

```bash
# Uma captura por seção, em capturas/final/desktop e capturas/final/mobile.
# Para movimento reduzido, repita com --reduzido no fim.
node scripts/capturar.mjs --roteiro secoes --vp desktop,mobile --saida capturas/final --ancoras "#espaco,#manifesto,#tratamentos,#resultados,#sobre,#experiencia,#faq,#contato"

# Hero sem WebGL (a imagem estática da pérola)
node scripts/capturar.mjs --vp desktop,mobile --sem-webgl --saida capturas/final

# A página inteira em quadros (transições, galeria e rodas) e a folha de contato
node scripts/capturar-jornada.mjs --vp desktop --ate 60000 --passo 900 --colunas 8
node scripts/capturar-jornada.mjs --vp mobile  --ate 60000 --passo 844 --colunas 10
node scripts/capturar-jornada.mjs --vp desktop --ate 60000 --passo 900 --reduzido
node scripts/capturar-jornada.mjs --vp mobile  --ate 60000 --passo 844 --reduzido

# Tablets e telas largas: LxAt é com toque (820x1180t = iPad Air em pé)
node scripts/capturar-jornada.mjs --vp 820x1180t --ate 60000 --passo 1180 --saida capturas/aparelhos/820x1180t

# Folha de contato de uma pasta de capturas (pasta, saída, colunas, escala)
node scripts/folha-contato.mjs capturas/final/desktop capturas/final/folha-desktop.png 5 0.3
```

O `--ate 60000` passa do fim da página de propósito: o script para na rolagem máxima, seja qual for.

O `capturar-jornada.mjs` sempre inclui a posição final (o rodapé) como último quadro, com pelo menos 3 s de espera, para o nome "Henrique Martins" sair inteiro. A espera dos outros quadros muda com `--espera` (padrão: 750 ms).

- Abrir as imagens e olhar de verdade, porque o script rodar não prova nada sobre o visual: texto sobre texto, imagem cortada, espaço sobrando, contraste, etiquetas `[CONFIRMAR]` sobrepostas, itens fora da tela no celular. Corrigir e capturar de novo.
- Repetir a verificação do briefing: console sem erros (os scripts avisam), toque emulado, movimento reduzido, slider com mouse, toque e teclado (o `testar-interacoes.mjs` cobre os dois últimos), hero sem WebGL.
- Opcional: 1920×1080 com `--vp 1920x1080` no `capturar-jornada.mjs`.

**Pronto quando:** nos dois tamanhos, com e sem movimento reduzido, não há sobreposição, corte nem texto ilegível; o console está limpo; e o usuário viu as folhas de contato.

## Passo 4. README e resumo das pendências

**O que é:** o `README.md`, que ainda não existe, e o fechamento da lista do que depende do doutor.

**Como:**

- Criar `README.md` na raiz, em português e curto, com:
  - o que é o projeto e a stack;
  - como rodar (`npm install`, `npm run dev`, `npm run build`, `npm run preview`);
  - a estrutura de pastas (`src/secoes`, `src/css`, `src/js/core`, `src/js/modulos`, `src/js/3d`, `src/dados`, `vite/`, `fotos/`, `public/`, `scripts/`, `ferramentas/`, `docs/`);
  - como trocar os dados (`src/dados/doutor.js` e `src/dados/casos.js`) e as fotos (`fotos/` e `npm run imagens`; os tamanhos estão em `CONTEUDO-PENDENTE.md`; a pérola se refaz com `npm run perola`);
  - como publicar na Vercel ou na Netlify (comando `npm run build`, pasta `dist`, domínio em `site.url` de `doutor.js`);
  - como rodar os testes de `scripts/`.
- Conferir que todo `[CONFIRMAR]` do código está em `CONTEUDO-PENDENTE.md`: `git grep -n CONFIRMAR -- src vite index.html`. Acrescentar o que faltar.
- Terminar deixando o servidor de desenvolvimento rodando e passando o endereço ao usuário (o briefing pede isso).

**Pronto quando:** o README existe e dá certo seguido à risca num clone limpo (`git clone` em outra pasta, `npm install`, `npm run build` sem erro), e o `CONTEUDO-PENDENTE.md` cobre todos os `[CONFIRMAR]`.

---

## Fora dos quatro passos

- **Desempenho e SEO** (feitos em 02/11/2026). Lighthouse mobile no build local, três rodadas: Desempenho 97 (era 49; meta 80), Acessibilidade 100, Boas práticas 100, SEO 100 (era 92; meta 95). O que pesava e o que mudou está em `docs/plano-transicoes.md`. Para medir de novo, com o build no ar na porta 4173:

  ```bash
  npx -y lighthouse@13.6.0 http://localhost:4173/ --output=json --output=html --output-path=capturas/lighthouse/mobile --chrome-flags="--headless=new"
  node scripts/resumo-lighthouse.mjs capturas/lighthouse/mobile.report.json
  ```

- **O que depende do doutor:** `CONTEUDO-PENDENTE.md` (CRO, WhatsApp, endereço, horários, textos clínicos, formação e todas as fotos). A foto do hero (`fotos/hero/doutor-capa.png`) é de banco de imagens e não pode ir ao ar.
- **Publicar** na Vercel ou na Netlify: só quando o usuário pedir.
