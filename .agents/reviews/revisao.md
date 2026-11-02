# Revisão do código (passo 1) e destino de cada achado (passo 2)

Alvo: `git diff 0c3de61..HEAD` (o site inteiro), em 01/11/2026. As linhas citadas são as da versão commitada (`HEAD`, 5f8e441).

## Quem revisou

A revisão independente por outros modelos não chegou ao fim:

- **Fable 5.1:** parado a pedido do usuário no meio do trabalho, pelo custo (a regra agora está no `CLAUDE.md` global: não usar Fable). Antes de parar, ele conferiu o plugin de build e a trava do CFO, sem problemas, e deixou uma pista: depois de girar o aparelho ou redimensionar a janela, a pessoa cai em outra seção. A pista foi confirmada (achado R2).
- **Sonnet 5.5:** parou no limite de 5 horas da conta antes de gravar o relatório. O trabalho dele fica salvo; dá para retomá-lo depois que o limite liberar.

O resto desta revisão foi feito pelo agente principal (Opus 5.5), com o mesmo checklist do passo 1, mais a revisão visual do passo 3. **Não é uma revisão de outro modelo.** Cada achado foi reproduzido no navegador (Playwright) antes da correção, e a versão commitada foi servida à parte (porta 5181) para separar o que já existia do que as correções poderiam ter introduzido.

## Achados

### R1. Rodas: números e linha do círculo por cima do título e da nota (alta, reproduzido)

- **Onde:** `src/css/componentes/roda.css:12` e `:20` (o topo da roda é fixo em `44svh` e `40svh`), `src/secoes/consulta.html:54` e `src/secoes/experiencia.html:62` (a nota fica no pé do palco).
- **Problema:** a geometria da roda não leva em conta o tamanho real do título nem da nota.
- **Cenários:**
  - Num iPhone no Safari, com as barras do navegador, `100svh` fica perto de 660 px. O número do topo da consulta cai em cima de "qualquer plano.".
  - Em 1440×900, a linha do círculo corta a palavra "tempo." da nota da consulta.
  - Em 390×844, o número "4" da experiência encosta na etiqueta da nota, e a cada giro os números passam por cima de "Do agendamento à decisão…".
  - No celular deitado, o texto do passo fica em cima da nota.
- **Destino: corrigido.**
  - A nota foi para o cabeçalho: no desktop à direita, sob o contador; no celular, sob o título, como na FAQ.
  - O `roda.js` mede o cabeçalho e desce a roda o necessário (`--roda-desce`).
  - Onde a roda não cabe, fica a lista numerada: no celular deitado (via `gsap.matchMedia`, que também refaz a roda ao virar o aparelho) e em telas baixas demais.
  - Conferido em 13 tamanhos, de 360×640 a 1920×1080: `scripts/testar-tamanhos.mjs`.

### R2. Redimensionar a janela ou girar o celular leva a outra seção (média, reproduzido)

- **Onde:** `src/js/modulos/pilha.js:101` e os percursos da galeria e das rodas, cujas alturas dependem do tamanho da tela. No recálculo, o ScrollTrigger devolve a mesma rolagem em pixels.
- **Cenário:** lendo "Sobre" no celular em pé, a pessoa gira o aparelho e vai parar em "Resultados". Na versão commitada, 15 de 20 cenários testados mudavam de seção.
- **Destino: corrigido** com `src/js/modulos/lugar.js`:
  - quando a rolagem para, o módulo guarda a seção do meio da tela e quanto dela já passou;
  - depois de um recálculo causado por mudança de tamanho, volta ao mesmo ponto;
  - no toque, só conta mudança de largura, por causa da barra do navegador.
  - Resultado: 20 de 20 cenários (`scripts/testar-redimensionar.mjs`).
- **Nota:** a primeira versão da correção R1 introduziu uma regressão aqui, porque as rodas recriadas no giro apagam a posição que o ScrollTrigger guarda, e a página voltava ao topo. O `lugar.js` cobre esse caso, e o teste confere.

### R3. Teclado: Page Down e Espaço pulam passos da roda (média, reproduzido)

- **Onde:** `src/js/modulos/roda.js` (só a roda do mouse anda um passo por vez; o teclado rola uma tela inteira).
- **Cenário:** quem desce a experiência com Page Down ou Espaço vê os passos 1, 3, 4 e 6; os passos 2 e 5 nunca aparecem.
- **Destino: corrigido.** Page Down, Page Up, Espaço e Shift+Espaço andam um passo por tecla. Ficam de fora os elementos que usam essas teclas (campos, botões, `summary` da FAQ, slider). Entrando por cima, para no primeiro passo; depois do último, rola normal (`scripts/testar-roda.mjs`).

### R4. Troca de sentido logo depois de um passo é ignorada (baixa, reproduzido)

- **Onde:** `src/js/modulos/roda.js:154` (`ehGestoNovo`).
- **Cenário:** um gesto para baixo seguido, em menos de 200 ms, de um para cima. O segundo é engolido como se fosse a inércia do primeiro, e a roda não volta.
- **Destino: corrigido.** Trocar de sentido é sempre gesto novo (com delta mínimo de 4, para ignorar ruído). A inércia nunca troca de sentido, então ela continua valendo um passo só.

### R5. Menu aberto: o Tab escapa para "Pular para o conteúdo" (baixa, reproduzido)

- **Onde:** `src/js/modulos/menu.js:19` (`foraDoMenu` não inclui o link de pular).
- **Cenário:** com o menu em tela cheia aberto, o Tab chega ao "Pular para o conteúdo", que aparece por cima do menu e leva a um `main` inerte.
- **Destino: corrigido.** O link de pular também fica inerte com o menu aberto (`scripts/testar-foco.mjs`).

### R6. Menu aberto: tocar no monograma deixa o menu aberto e a rolagem travada (baixa, reproduzido)

- **Onde:** `src/js/modulos/menu.js:79` (só os links dentro do `<nav>` fecham o menu).
- **Cenário:** com o menu aberto, tocar no monograma rola a página até o topo por trás do menu. O menu continua aberto e a rolagem, travada.
- **Destino: corrigido.** O monograma fecha o menu, como os links (`scripts/testar-foco.mjs`).

### R7. Contador da roda fixo no HTML (baixa, pela leitura)

- **Onde:** `src/secoes/experiencia.html:14` ("/ 06") e `src/secoes/consulta.html:11` ("/ 05").
- **Cenário:** se a lista de diferenciais ou de etapas mudar de tamanho, a roda se ajusta mas o contador mostra o total antigo. O `CONTEUDO-PENDENTE.md` diz que "a roda se ajusta sozinha".
- **Destino: corrigido.** O `roda.js` escreve o total a partir da lista. O contador só aparece com a roda, então não faz diferença sem JavaScript.

## Verificado e sem problemas

- **Regras do CFO nos textos** (`src/secoes`, `src/dados`, `index.html`, `vite/`): sem preço, promoção, promessa, superlativo, "especialista", comparação nem depoimento. "Cada rosto único" (Sobre) descreve o rosto do paciente, não o profissional.
- **Trava do CFO no build:** um caso com `provisorio: false` sem `autorizacaoPorEscrito: true` para o build (`vite/geradores.js:101`).
- **Plugin de build:** dados escapados em texto e atributos (`escapar`); no JSON-LD, `<` vira `<`, então um `</script>` num dado não fecha a tag. Todo `target="_blank"` tem `rel="noopener"`. Nenhum formulário, cookie ou rastreamento (só `sessionStorage` para o preloader).
- **Ciclo de vida:**
  - `ScrollTrigger.refresh` depois das fontes, do `load` e de cada leva de imagens.
  - `.pilha-medindo` não fica presa: o `refreshInit` e o `refresh` andam em par, e o `comPosicoesNaturais` usa `try/finally`.
  - SplitText com `autoSplit`.
  - A pérola pausa fora da tela e com a aba oculta.
- **Acessibilidade:**
  - Foco do teclado em seção coberta (`testar-foco.mjs`).
  - Roda desenhada com `aria-hidden` sobre a lista real.
  - FAQ com `<details>` nativo.
  - Slider nativo (`input type=range`) com mouse, toque e teclado.
  - Movimento reduzido e página sem JavaScript com tudo visível.

## Fora do escopo

Desempenho e SEO (o usuário trata depois).
