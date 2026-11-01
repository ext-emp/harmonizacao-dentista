# Conteúdo pendente

Tudo que depende do Dr. Henrique. No site, cada item aparece marcado com `[CONFIRMAR]` (na tela, numa etiqueta tracejada; no código, busque por `[CONFIRMAR]`).
Os dados de contato ficam todos em `src/dados/doutor.js`: corrigiu lá, corrigiu no site inteiro.

## Dados de contato e registro (`src/dados/doutor.js`)

| Item | Onde aparece | Observação |
| --- | --- | --- |
| Número do CRO-RS | Rodapé, Sobre, marca sobre as fotos de antes e depois, dados estruturados | Obrigatório pela Resolução CFO 196/2019 |
| Especialidade registrada no CFO | Hoje o site diz "Cirurgião-dentista" | Só trocar por "especialista em..." com o registro confirmado |
| Número do WhatsApp (com DDI e DDD) | Todos os botões "Agendar avaliação", Contato | Enquanto estiver vazio, o link abre o WhatsApp sem destinatário |
| Número do WhatsApp como aparece escrito | Contato | Hoje: "(51) [CONFIRMAR]" |
| Mensagem pré-preenchida do WhatsApp | Botões de agendamento | Texto atual: "Olá, Dr. Henrique. Gostaria de agendar uma avaliação." |
| Endereço completo (rua, número, sala, bairro, CEP) | Contato, dados estruturados | |
| Link do Google Maps | Contato ("Abrir no mapa") | Sem ele, o site abre uma busca pela cidade |
| Horários de atendimento | Contato | Um item por linha em `horarios` |
| Domínio definitivo do site | Canonical, Open Graph, dados estruturados | Sem ele, o build não gera URLs absolutas |

## Marca

| Item | Onde aparece | Observação |
| --- | --- | --- |
| Monograma HM | Header, preloader, favicon, imagem do Open Graph | Desenho provisório feito para o site. Se o doutor já tiver uma marca, ela entra no lugar |

## Textos

| Item | Arquivo | Observação |
| --- | --- | --- |
| Título e subtítulo do hero | `src/secoes/hero.html` | Escolhido: "O luxo de parecer você." (alternativa do briefing: "Naturalidade é o novo luxo.") |
| Frase de abertura do "O espaço" | `src/secoes/espaco.html` | "Antes de qualquer tratamento, um lugar para conversar com calma." Confirmar que descreve o consultório de verdade |
| Texto do manifesto | `src/secoes/manifesto.html` | Texto de posicionamento, sem promessa. Revisar o tom com o doutor. Fica dentro do "O espaço", sobre a última foto da galeria |
| Números do manifesto | `src/secoes/manifesto.html` | Hoje "00". Categorias sugeridas: anos de profissão, anos de dedicação à harmonização orofacial, cursos de formação complementar. Trocar pelo valor real ou apagar o item. A contagem animada lê o número escrito no HTML. Não usar número de pacientes nem de procedimentos como chamariz |
| Descrições dos blocos Rosto e Sorriso | `src/secoes/tratamentos.html` | Textos clínicos |
| Lista final de procedimentos | `src/secoes/tratamentos.html` e `SERVICOS` em `vite/geradores.js` (dados estruturados) | Lista provisória do briefing. Ao mudar, trocar a imagem de cada linha em `fotos/procedimentos/` |
| Tratamento de cada caso | `src/dados/casos.js` | Os seis atuais são provisórios |
| Texto do Sobre | `src/secoes/sobre.html` | O segundo parágrafo descreve a forma de atendimento |
| Formação | `src/secoes/sobre.html` | Graduação (instituição e ano), cursos de harmonização orofacial e de lentes de contato dental (nomes, instituições e anos). Não incluir nada sem comprovação |
| Seis diferenciais | `src/secoes/experiencia.html` | Precisam descrever a rotina real do consultório. Não citar equipamentos sem confirmação. A roda se ajusta sozinha ao número de itens da lista |
| Etapas da primeira consulta | `src/secoes/consulta.html` | Cinco etapas provisórias: agendamento, conversa, avaliação, plano, decisão. Mesma roda da experiência |
| Perguntas e respostas do FAQ | `src/secoes/faq.html` | Textos clínicos. Sem promessa nem garantia de resultado, sem valores |

## Antes e depois (Resolução CFO 196/2019)

- Só casos atendidos pelo próprio Dr. Henrique, com autorização **por escrito** do paciente, guardada pelo consultório.
- Nada de fotos do "durante". Antes e depois com o mesmo enquadramento e a mesma luz.
- O nome e o CRO entram sozinhos sobre cada foto (vêm de `doutor.js`).
- Em `src/dados/casos.js`, cada caso real fica com `provisorio: false` e `autorizacaoPorEscrito: true`. Sem a autorização marcada, o build para com um aviso.
- A seção traz a nota "Imagens divulgadas com autorização dos pacientes."
- Depoimentos de pacientes continuam fora do site até o doutor confirmar com o CRO-RS.

## Fotos

Formato dos originais: JPG (ou PNG, quando precisa de fundo transparente), o maior possível. Os tamanhos abaixo são o mínimo. O `npm run imagens` (o build também roda) recorta no centro e gera as versões AVIF/WebP.

| Pasta e nome do arquivo | Onde aparece | Tamanho mínimo | Proporção |
| --- | --- | --- | --- |
| `fotos/hero/doutor-capa.png` | Hero, à direita do título | 1600 × 2000 px, **PNG com fundo transparente** (só a pessoa recortada, sem sombra no chão) | 4:5, retrato da cintura para cima, cabeça a uns 12% do topo. **A imagem de agora é de banco de imagens (tem marca d'água no jaleco) e mede só 554 × 554: não pode ir ao ar** |
| `fotos/hero/perola.png` | Hero | 1600 × 1600 px, fundo transparente | 1:1. Gerada pelo próprio site (`npm run perola`), não precisa de foto |
| `fotos/espaco/espaco-01.jpg` e `espaco-03.jpg` | O espaço, fotos deitadas da galeria | 2400 × 1600 px | 3:2 |
| `fotos/espaco/espaco-02.jpg` e `espaco-04.jpg` | O espaço, fotos em pé da galeria | 1600 × 2000 px | 4:5 |
| `fotos/espaco/espaco-05.jpg` | Última foto da galeria: abre até a tela cheia e vira o fundo do manifesto | 2880 × 1920 px | 3:2, com o assunto no centro (no celular a tela corta as laterais) e tons calmos, porque o texto fica por cima, sob um véu grafite |
| `fotos/atendimento/atendimento-01.jpg` … `atendimento-04.jpg` | Manifesto, as quatro fotos que sobem sobre o fundo | 1000 × 1250 px | 4:5. Detalhes do consultório e do atendimento, **sem paciente e nunca do "durante"** |
| `fotos/tratamentos/rosto.jpg` | Tratamentos, bloco Rosto | 1600 × 2000 px | 4:5 |
| `fotos/tratamentos/sorriso.jpg` | Tratamentos, bloco Sorriso | 1600 × 2000 px | 4:5 |
| `fotos/procedimentos/<nome>.jpg` (um por procedimento, mesmo nome da linha) | Lista de procedimentos | 640 × 800 px | 4:5 |
| `fotos/sobre/retrato.jpg` | Sobre | 1600 × 2000 px | 4:5 |
| `fotos/casos/<id>-antes.jpg` e `fotos/casos/<id>-depois.jpg` (o `id` vem de `casos.js`) | Resultados | 1080 × 1080 px | 1:1, o mesmo enquadramento nas duas |

Ao trocar uma foto provisória, apague também a etiqueta da seção ("Retrato provisório", "Fotos provisórias" ou "Fotos do atendimento provisórias [CONFIRMAR]") e ajuste o texto alternativo (`alt`), que hoje diz "Imagem provisória…" ou "Ilustração provisória…".

Depois de trocar a `espaco-05.jpg`, rode `node scripts/contraste-fundo.mjs` com o site aberto em `npm run dev`: ele mede o contraste do manifesto e dos números sobre a foto. Quando o retrato do hero mudar, meça onde a pessoa fica na imagem com `node scripts/limites-alfa.mjs fotos/hero/doutor-capa.png`, atualize esses limites em `scripts/capturar-viagem.mjs` e rode o script: ele confere, quadro a quadro, que a pérola não passa por cima da pessoa nem do texto.
