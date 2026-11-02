// ---------------------------------------------------------------------------
// Cena 3D do hero: uma pérola barroca com acabamento de porcelana.
// Material físico (clearcoat, iridescência sutil e brilho acetinado), luz de
// estúdio suave e uma deformação lenta feita no vertex shader.
//
// Este módulo não depende do resto do site: o hero o carrega sob demanda e
// a página ferramentas/perola.html o usa para gerar a imagem estática.
// ---------------------------------------------------------------------------
import {
  BackSide,
  BoxGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { ruidoSimplex3d } from './ruido.glsl.js';

// Ajustes finos do visual, reunidos para facilitar a calibragem.
const AJUSTES = {
  exposicao: 0.92,
  amplitude: 0.13,       // quanto a forma foge da esfera
  frequencia: 0.55,      // menor = lóbulos maiores e mais calmos
  escala: [1, 1.1, 0.96], // levemente alongada, como uma pérola barroca
};

// Deformação: dois ruídos de baixa frequência dão a forma barroca; um
// terceiro, mais fino, só aparece quando o cursor se mexe ("agitação").
const DEFORMACAO = /* glsl */ `
uniform float uTempo;
uniform float uAmplitude;
uniform float uFrequencia;
uniform float uAgitacao;
uniform float uScroll;
${ruidoSimplex3d}

float hmDeformar(vec3 p) {
  float t = uTempo * 0.07 + uScroll * 0.55;
  float n = hm_snoise(p * uFrequencia + vec3(0.0, t, t * 0.6)) * uAmplitude;
  n += hm_snoise(p * uFrequencia * 2.1 + vec3(t * 1.2, -t * 0.8, 3.1)) * uAmplitude * 0.22;
  if (uAgitacao > 0.001) n += hm_snoise(p * 3.1 + vec3(t * 2.4)) * 0.026 * uAgitacao;
  return n;
}
`;

// Normal da superfície deformada. A forma é uma esfera com raio variável
// R(u) = 1 + d(u); a normal é R·u menos o gradiente de d no plano tangente.
// Sem escolha de vetor tangente, não há ramificação nem emenda na superfície.
const NORMAL = /* glsl */ `
  vec3 hmU = normalize(position);
  float hmD = hmDeformar(position);
  const float hmE = 0.01;
  vec3 hmGrad = vec3(
    hmDeformar(position + vec3(hmE, 0.0, 0.0)),
    hmDeformar(position + vec3(0.0, hmE, 0.0)),
    hmDeformar(position + vec3(0.0, 0.0, hmE))
  ) - hmD;
  hmGrad /= hmE;
  vec3 hmGradTangente = hmGrad - dot(hmGrad, hmU) * hmU;
  vec3 hmPos = position + hmU * hmD;
  vec3 objectNormal = normalize(hmU * (1.0 + hmD) - hmGradTangente);
  #ifdef USE_TANGENT
    vec3 objectTangent = vec3(tangent.xyz);
  #endif
`;

const POSICAO = /* glsl */ `
  vec3 transformed = hmPos;
  #ifdef USE_ALPHAHASH
    vPosition = vec3(position);
  #endif
`;

// Devolve a vez ao navegador entre as etapas pesadas da montagem: várias
// tarefas curtas em vez de uma longa, e a página continua respondendo.
const pausa = () => new Promise((resolver) => setTimeout(resolver, 0));

/**
 * Cria a pérola dentro de `palco` (elemento quadrado).
 * @param {HTMLElement} palco
 * @param {object} opcoes
 * @param {boolean} [opcoes.leve]      versão mais leve (celular)
 * @param {boolean} [opcoes.animar]    false = quadro único (movimento reduzido)
 * @param {boolean} [opcoes.cursor]    reage ao mouse
 * @param {number}  [opcoes.tamanho]   tamanho fixo em px (geração da imagem estática)
 * @returns {Promise<null | {canvas, definirGiro, destruir, aoPerderContexto}>}
 */
export async function criarPerola(
  palco,
  { leve = false, animar = true, cursor = false, tamanho = null, material: ajusteMaterial = {}, forma = {} } = {},
) {
  const ajustes = { ...AJUSTES, ...forma };
  const canvas = document.createElement('canvas');
  canvas.className = 'perola-palco__canvas';
  canvas.setAttribute('aria-hidden', 'true');

  // Testa o WebGL 2 no próprio canvas, sem gerar erro no console quando faltar.
  // Antialias sempre ligado: nas GPUs de celular (tile-based) o MSAA custa
  // pouco e evita a borda serrilhada. A versão leve economiza na malha e no
  // pixel ratio.
  const atributos = {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    powerPreference: leve ? 'default' : 'high-performance',
    preserveDrawingBuffer: Boolean(tamanho),
  };
  const gl = canvas.getContext('webgl2', atributos);
  if (!gl) return null;

  const renderer = new WebGLRenderer({ canvas, context: gl, ...atributos });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = ajustes.exposicao;
  await pausa();

  // Luz de estúdio: o reflexo vem de um estúdio montado aqui (softboxes sobre
  // fundo cinza quente), mais uma luz direta suave para o brilho principal.
  const cena = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const estudio = criarEstudio();
  cena.environment = pmrem.fromScene(estudio, 0.02).texture;
  estudio.traverse((o) => o.isMesh && (o.geometry.dispose(), o.material.dispose()));
  pmrem.dispose();
  await pausa();

  const luzChave = new DirectionalLight('#fff1de', 1.1);
  luzChave.position.set(-3, 4, 5);
  const luzRecorte = new DirectionalLight('#eef1ff', 0.7);
  luzRecorte.position.set(4, -2, -4);
  cena.add(luzChave, luzRecorte);

  const camera = new PerspectiveCamera(30, 1, 0.1, 30);
  camera.position.set(0, 0, 6);

  const uniforms = {
    uTempo: { value: 0 },
    uAmplitude: { value: ajustes.amplitude },
    uFrequencia: { value: ajustes.frequencia },
    uAgitacao: { value: 0 },
    uScroll: { value: 0 },
  };

  const material = new MeshPhysicalMaterial({
    color: '#f1ece5',
    roughness: 0.3,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    iridescence: 0.8,
    iridescenceIOR: 1.3,
    // Faixa de espessura do filme (nm): 200 a 480 dá o oriente rosado da pérola.
    iridescenceThicknessMinimum: 200,
    iridescenceThicknessMaximum: 480,
    sheen: 0.3,
    sheenRoughness: 0.45,
    sheenColor: '#f3e4c8',
    envMapIntensity: 1,
    // Só para calibragem (ferramentas/perola.html?material={...}).
    ...ajusteMaterial,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${DEFORMACAO}`)
      .replace('#include <beginnormal_vertex>', NORMAL)
      .replace('#include <begin_vertex>', POSICAO);
  };
  material.customProgramCacheKey = () => 'perola-barroca';

  const geometria = new IcosahedronGeometry(1, leve ? 28 : 56);
  const perola = new Mesh(geometria, material);
  perola.scale.set(...ajustes.escala);
  perola.rotation.set(0.18, -0.4, 0.06);
  cena.add(perola);
  await pausa();

  const rotacaoBase = { x: perola.rotation.x, y: perola.rotation.y };
  const estado = { tempo: 0, scroll: 0, giroX: 0, giroY: 0, cx: 0, cy: 0, alvoX: 0, alvoY: 0, agitacao: 0, ultimo: 0 };

  function ajustarTamanho() {
    const largura = tamanho || Math.max(1, Math.round(palco.clientWidth));
    const altura = tamanho || Math.max(1, Math.round(palco.clientHeight));
    renderer.setPixelRatio(tamanho ? 1 : Math.min(window.devicePixelRatio || 1, leve ? 1.5 : 2));
    renderer.setSize(largura, altura, false);
    camera.aspect = largura / altura;
    camera.updateProjectionMatrix();
  }

  function desenhar() {
    uniforms.uTempo.value = estado.tempo;
    uniforms.uAgitacao.value = estado.agitacao;
    uniforms.uScroll.value = estado.scroll;
    // Giro: deriva lenta no tempo, um pouco de cursor e o rolamento da viagem.
    perola.rotation.y = rotacaoBase.y + estado.tempo * 0.045 + estado.cx * 0.32 + estado.giroY;
    perola.rotation.x = rotacaoBase.x - estado.cy * 0.22 + estado.giroX;
    // A luz principal acompanha o cursor de leve: o reflexo "anda" na pérola.
    luzChave.position.x = -3 + estado.cx * 2.2;
    luzChave.position.y = 4 + estado.cy * 1.4;
    renderer.render(cena, camera);
  }

  function quadro(agora) {
    const dt = estado.ultimo ? Math.min((agora - estado.ultimo) / 1000, 0.05) : 0;
    estado.ultimo = agora;
    estado.tempo += dt;
    const k = 1 - Math.exp(-dt * 3);
    estado.cx += (estado.alvoX - estado.cx) * k;
    estado.cy += (estado.alvoY - estado.cy) * k;
    estado.agitacao *= Math.exp(-dt * 1.4);
    desenhar();
  }

  // Liga e desliga o loop conforme a visibilidade (fora da tela ou aba oculta).
  let naTela = true;
  let rodando = false;
  function atualizarLoop() {
    const deveRodar = animar && naTela && !document.hidden;
    if (deveRodar === rodando) return;
    rodando = deveRodar;
    estado.ultimo = 0;
    renderer.setAnimationLoop(rodando ? quadro : null);
  }

  const observador = new IntersectionObserver(([entrada]) => {
    naTela = entrada.isIntersecting;
    atualizarLoop();
  });
  const aoMudarAba = () => atualizarLoop();
  const aoRedimensionar = new ResizeObserver(() => {
    ajustarTamanho();
    if (!rodando) desenhar();
  });

  function aoMoverCursor(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    estado.agitacao = Math.min(1, estado.agitacao + Math.hypot(x - estado.alvoX, y - estado.alvoY) * 1.6);
    estado.alvoX = x;
    estado.alvoY = -y;
  }

  ajustarTamanho();
  // Compila os shaders antes do primeiro quadro para não travar a rolagem.
  await renderer.compileAsync(cena, camera);
  palco.appendChild(canvas);
  desenhar();

  if (!tamanho) {
    observador.observe(palco);
    aoRedimensionar.observe(palco);
    document.addEventListener('visibilitychange', aoMudarAba);
    if (cursor && animar) window.addEventListener('pointermove', aoMoverCursor, { passive: true });
    atualizarLoop();
  }

  let aoPerder = () => {};
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    renderer.setAnimationLoop(null);
    rodando = false;
    aoPerder();
  });

  return {
    canvas,
    // Vem da viagem pelo scroll: giro em radianos (x = rolando para baixo,
    // y = rolando para a direita) e progresso de 0 a 1, que também muda a
    // forma devagar.
    definirGiro({ x = 0, y = 0, progresso = 0 } = {}) {
      estado.giroX = x;
      estado.giroY = y;
      estado.scroll = progresso;
      if (!rodando) desenhar();
    },
    aoPerderContexto(fn) {
      aoPerder = fn;
    },
    destruir() {
      renderer.setAnimationLoop(null);
      observador.disconnect();
      aoRedimensionar.disconnect();
      document.removeEventListener('visibilitychange', aoMudarAba);
      window.removeEventListener('pointermove', aoMoverCursor);
      geometria.dispose();
      material.dispose();
      cena.environment?.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}

// Estúdio fotográfico usado só para gerar o mapa de reflexos (PMREM):
// fundo cinza quente, um softbox grande no alto à esquerda, um rebatedor à
// direita, um contraluz frio atrás e o chão claro devolvendo luz por baixo.
function criarEstudio() {
  const estudio = new Scene();
  const caixa = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: '#4a4540', side: BackSide }));
  caixa.scale.set(24, 16, 24);
  estudio.add(caixa);

  const painel = (cor, intensidade, posicao, escala) => {
    const material = new MeshBasicMaterial({ color: new Color(cor).multiplyScalar(intensidade), side: DoubleSide });
    const malha = new Mesh(new PlaneGeometry(1, 1), material);
    malha.position.set(...posicao);
    malha.scale.set(escala[0], escala[1], 1);
    malha.lookAt(0, 0, 0);
    estudio.add(malha);
  };
  painel('#fff4e6', 7, [-5, 5, 6], [7, 5]);     // softbox principal
  painel('#ffffff', 2.4, [7, 0.5, 3], [3, 7]);  // rebatedor
  painel('#e6edff', 3.2, [2, 3, -8], [7, 3]);   // contraluz
  painel('#f4ede2', 1.1, [0, -7, 0], [14, 14]); // chão
  return estudio;
}
