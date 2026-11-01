// ---------------------------------------------------------------------------
// Ferramenta (não entra no site): renderiza os ambientes provisórios da
// galeria "O espaço". São interiores desenhados aqui mesmo, na paleta do
// site (reboco claro, travertino, latão, linho e porcelana), com luz de
// janela. Ficam no lugar das fotos do consultório até elas chegarem; nunca
// são fotos de banco. Usada por scripts/gerar-provisorias.mjs.
// Unidades em metros. Eixos: x para a direita, y para cima, z para a câmera.
// ---------------------------------------------------------------------------
import {
  CanvasTexture,
  CatmullRomCurve3,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MirroredRepeatWrapping,
  NeutralToneMapping,
  NoColorSpace,
  Path,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  RectAreaLight,
  Scene,
  Shape,
  SphereGeometry,
  SplineCurve,
  SpotLight,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { porcelana, geometriaSeixo } from './natureza-morta.js';

RectAreaLightUniformsLib.init();

const ruido = new ImprovedNoise();
const texturas = new Map();

// ---- Materiais ---------------------------------------------------------------
// Ruído em tons de cinza para o relevo e a rugosidade de reboco e cimento.
// O espelhamento (MirroredRepeat) esconde as emendas da repetição.
function texturaRuido(nome, frequencias) {
  if (texturas.has(nome)) return texturas.get(nome);
  const lado = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = lado;
  const ctx = canvas.getContext('2d');
  const dados = ctx.createImageData(lado, lado);
  const semente = texturas.size * 17.3 + 3.1;
  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      let v = 0;
      for (const [f, a] of frequencias) v += ruido.noise((x / lado) * f + semente, (y / lado) * f, semente) * a;
      const cinza = Math.max(0, Math.min(255, 128 + v * 170));
      const i = (y * lado + x) * 4;
      dados.data[i] = dados.data[i + 1] = dados.data[i + 2] = cinza;
      dados.data[i + 3] = 255;
    }
  }
  ctx.putImageData(dados, 0, 0);
  const textura = new CanvasTexture(canvas);
  textura.wrapS = textura.wrapT = MirroredRepeatWrapping;
  textura.colorSpace = NoColorSpace;
  texturas.set(nome, textura);
  return textura;
}

// Reboco: fosco, com relevo leve de espátula.
function reboco(cor, { relevo = 1.2, rugosidade = 0.94 } = {}) {
  return new MeshStandardMaterial({
    color: cor,
    roughness: rugosidade,
    bumpMap: texturaRuido('reboco', [[4, 0.55], [18, 0.35], [70, 0.22]]),
    bumpScale: relevo,
  });
}

// Cimento queimado do piso: um pouco de brilho, que varia de lugar para lugar.
function cimento(cor) {
  const t = texturaRuido('cimento', [[1.5, 0.6], [7, 0.4], [48, 0.18]]);
  return new MeshStandardMaterial({ color: cor, roughness: 1.35, roughnessMap: t, bumpMap: t, bumpScale: 0.35 });
}

const travertino = () =>
  new MeshStandardMaterial({ color: '#d8cab3', roughness: 0.62, bumpMap: texturaRuido('pedra', [[3, 0.5], [30, 0.4], [120, 0.3]]), bumpScale: 0.6 });
const latao = () => new MeshStandardMaterial({ color: '#bfa77a', metalness: 1, roughness: 0.34 });
const carvalho = () => new MeshStandardMaterial({ color: '#b39374', roughness: 0.7 });
const tecido = (cor) =>
  new MeshStandardMaterial({ color: cor, roughness: 1, bumpMap: texturaRuido('tecido', [[40, 0.5], [140, 0.5]]), bumpScale: 0.8 });
const ceramica = (cor) => new MeshStandardMaterial({ color: cor, roughness: 0.72 });

function sombras(malha, projeta = true) {
  malha.castShadow = projeta;
  malha.receiveShadow = true;
  return malha;
}

// UV em metros (planos): a textura fica na mesma escala em qualquer tamanho.
function uvEmMetros(geometria, largura, altura) {
  const uv = geometria.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * largura, uv.getY(i) * altura);
  return geometria;
}

// ---- Arquitetura ----------------------------------------------------------------
// Parede extrudada na espessura, com janelas (vaos) e no máximo uma porta,
// que entra no contorno (um furo encostado na borda não triangula bem).
// Medidas a partir do canto de baixo à esquerda, olhando de dentro da sala.
function parede(largura, altura, material, { vaos = [], porta = null, espessura = 0.2 } = {}) {
  const forma = new Shape();
  forma.moveTo(0, 0);
  if (porta) {
    const { x, w, h, arco } = porta;
    forma.lineTo(x, 0);
    if (arco) {
      forma.lineTo(x, h - w / 2);
      forma.absarc(x + w / 2, h - w / 2, w / 2, Math.PI, 0, true);
    } else {
      forma.lineTo(x, h);
      forma.lineTo(x + w, h);
    }
    forma.lineTo(x + w, 0);
  }
  forma.lineTo(largura, 0);
  forma.lineTo(largura, altura);
  forma.lineTo(0, altura);
  forma.closePath();
  for (const { x, y, w, h, arco } of vaos) {
    const furo = new Path();
    furo.moveTo(x, y);
    furo.lineTo(x + w, y);
    if (arco) {
      furo.lineTo(x + w, y + h - w / 2);
      furo.absarc(x + w / 2, y + h - w / 2, w / 2, 0, Math.PI, false);
    } else {
      furo.lineTo(x + w, y + h);
      furo.lineTo(x, y + h);
    }
    furo.closePath();
    forma.holes.push(furo);
  }
  const geometria = new ExtrudeGeometry(forma, { depth: espessura, bevelEnabled: false, curveSegments: 72 });
  return sombras(new Mesh(geometria, material));
}

// Sala fechada: piso, teto e quatro paredes. A parede da frente fica atrás
// da câmera e só existe para a luz não vazar. Os vãos de cada parede são
// medidos de dentro: fundo e frente a partir da esquerda; laterais a partir
// da frente (esquerda) ou do fundo (direita).
function montarSala(grupo, { L, H, P, paredes, piso, teto, e = 0.2, deslocar = [0, 0, 0] }) {
  const sala = new Group();
  const ajustar = (lista = []) => lista.map((v) => ({ ...v, x: v.x + e }));
  const fundo = parede(L + 2 * e, H, paredes.fundo.material, {
    vaos: ajustar(paredes.fundo.vaos),
    porta: paredes.fundo.porta && { ...paredes.fundo.porta, x: paredes.fundo.porta.x + e },
    espessura: e,
  });
  fundo.position.set(-L / 2 - e, 0, -P / 2 - e);
  const esquerda = parede(P, H, paredes.esquerda.material, { vaos: paredes.esquerda.vaos, porta: paredes.esquerda.porta, espessura: e });
  esquerda.rotation.y = Math.PI / 2;
  esquerda.position.set(-L / 2 - e, 0, P / 2);
  const direita = parede(P, H, paredes.direita.material, { vaos: paredes.direita.vaos, porta: paredes.direita.porta, espessura: e });
  direita.rotation.y = -Math.PI / 2;
  direita.position.set(L / 2 + e, 0, -P / 2);
  const frente = parede(L + 2 * e, H, paredes.frente?.material || paredes.fundo.material, { espessura: e });
  frente.rotation.y = Math.PI;
  frente.position.set(L / 2 + e, 0, P / 2 + e);

  const chao = sombras(new Mesh(uvEmMetros(new PlaneGeometry(L + 2 * e, P + 2 * e), (L + 2 * e) / 2, (P + 2 * e) / 2), piso), false);
  chao.rotation.x = -Math.PI / 2;
  const forro = sombras(new Mesh(uvEmMetros(new PlaneGeometry(L + 2 * e, P + 2 * e), L / 2, P / 2), teto));
  forro.rotation.x = Math.PI / 2;
  forro.position.y = H;
  sala.add(fundo, esquerda, direita, frente, chao, forro);
  sala.position.set(...deslocar);
  grupo.add(sala);
  return sala;
}

// Céu claro atrás das janelas (estourado, como numa foto de interior).
function ceu(grupo, posicao, rotacaoY, largura, altura, brilho = 2.2, cor = '#fff8ee') {
  const material = new MeshBasicMaterial({ color: cor });
  material.color.multiplyScalar(brilho);
  const plano = new Mesh(new PlaneGeometry(largura, altura), material);
  plano.position.set(...posicao);
  plano.rotation.y = rotacaoY;
  grupo.add(plano);
}

// Sol: luz direcional com sombra, entrando pelas janelas.
function sol(grupo, { de, para, intensidade = 3.4, cor = '#ffe7c9', area = 8 }) {
  const luz = new DirectionalLight(cor, intensidade);
  luz.position.set(...de);
  luz.target.position.set(...para);
  luz.castShadow = true;
  luz.shadow.mapSize.set(4096, 4096);
  Object.assign(luz.shadow.camera, { left: -area, right: area, top: area, bottom: -area, near: 0.5, far: 80 });
  luz.shadow.bias = -0.0002;
  luz.shadow.normalBias = 0.03;
  grupo.add(luz, luz.target);
  return luz;
}

// ---- Objetos --------------------------------------------------------------------
// Vaso de cerâmica girado no torno a partir de um perfil (altura, raio).
function vaso({ altura = 0.42, raio = 0.13, cor = '#d6cbbb', perfil } = {}) {
  const pontos = (perfil || [[0, 0.5], [0.1, 0.82], [0.34, 1], [0.6, 0.8], [0.8, 0.4], [0.92, 0.34], [1, 0.42]]).map(
    ([t, r]) => new Vector2(r * raio, t * altura),
  );
  const contorno = new SplineCurve(pontos).getPoints(90);
  contorno.unshift(new Vector2(0.001, 0));
  return sombras(new Mesh(new LatheGeometry(contorno, 96), ceramica(cor)));
}

// Galho seco: um tubo fino em curva, com dois ramos.
function galho({ base = [0, 0, 0], escala = 1, cor = '#43372c' } = {}) {
  const g = new Group();
  const material = new MeshStandardMaterial({ color: cor, roughness: 0.85 });
  const ramos = [
    [[0, 0, 0], [0.02, 0.35, 0.01], [0.1, 0.7, -0.02], [0.28, 1.0, 0.0], [0.5, 1.18, 0.04]],
    [[0.06, 0.55, 0], [-0.1, 0.78, 0.03], [-0.22, 0.98, 0.02], [-0.3, 1.1, 0.05]],
    [[0.2, 0.9, 0], [0.26, 1.12, -0.03], [0.24, 1.3, -0.02]],
  ];
  ramos.forEach((pontos, i) => {
    const curva = new CatmullRomCurve3(pontos.map(([x, y, z]) => new Vector3(x * escala, y * escala, z * escala)));
    g.add(sombras(new Mesh(new TubeGeometry(curva, 64, (i ? 0.004 : 0.007) * escala, 8, false), material)));
  });
  g.position.set(...base);
  return g;
}

// Pendente: fio de latão e globo leitoso aceso.
function pendente(grupo, { x, z, teto, comprimento = 1.1, raio = 0.16, intensidade = 2.4 }) {
  const fio = new Mesh(new CylinderGeometry(0.004, 0.004, comprimento, 8), latao());
  fio.position.set(x, teto - comprimento / 2, z);
  const globo = new Mesh(
    new SphereGeometry(raio, 48, 32),
    new MeshStandardMaterial({ color: '#fff7ec', emissive: '#ffe6c4', emissiveIntensity: 1.7, roughness: 0.5 }),
  );
  globo.position.set(x, teto - comprimento - raio * 0.9, z);
  const luz = new PointLight('#ffd9ad', intensidade, 7, 2);
  luz.position.copy(globo.position);
  grupo.add(fio, globo, luz);
}

// Poltrona baixa estofada em linho, com pés de carvalho.
function poltrona(cor = '#cfc3b0') {
  const g = new Group();
  const pano = tecido(cor);
  const assento = sombras(new Mesh(new RoundedBoxGeometry(0.86, 0.2, 0.8, 5, 0.07), pano));
  assento.position.set(0, 0.36, 0);
  const encosto = sombras(new Mesh(new RoundedBoxGeometry(0.86, 0.62, 0.18, 5, 0.08), pano));
  encosto.position.set(0, 0.7, -0.34);
  encosto.rotation.x = -0.16;
  const braco = new RoundedBoxGeometry(0.14, 0.34, 0.78, 4, 0.06);
  const bracoE = sombras(new Mesh(braco, pano));
  bracoE.position.set(-0.46, 0.5, 0);
  const bracoD = sombras(new Mesh(braco, pano));
  bracoD.position.set(0.46, 0.5, 0);
  const madeira = carvalho();
  const pe = new CylinderGeometry(0.02, 0.016, 0.27, 12);
  for (const [x, z] of [[-0.4, 0.34], [0.4, 0.34], [-0.4, -0.34], [0.4, -0.34]]) {
    const p = sombras(new Mesh(pe, madeira));
    p.position.set(x, 0.135, z);
    g.add(p);
  }
  g.add(assento, encosto, bracoE, bracoD);
  return g;
}

// Mesa lateral redonda: tampo de travertino num pé central.
function mesaLateral() {
  const g = new Group();
  const tampo = sombras(new Mesh(new CylinderGeometry(0.27, 0.27, 0.04, 64), travertino()));
  tampo.position.y = 0.52;
  const pe = sombras(new Mesh(new CylinderGeometry(0.06, 0.07, 0.5, 32), travertino()));
  pe.position.y = 0.25;
  const base = sombras(new Mesh(new CylinderGeometry(0.2, 0.21, 0.03, 48), travertino()));
  base.position.y = 0.015;
  g.add(tampo, pe, base);
  return g;
}

// ---- Cenas ----------------------------------------------------------------------
const CENAS = {
  // Recepção: balcão canelado com tampo de travertino, vaso com galho e um
  // pendente. A luz entra pela janela da esquerda; à direita, uma passagem
  // em arco leva a um corredor mais claro.
  recepcao(cena, camera) {
    const L = 7.2;
    const H = 3.1;
    const P = 6.6;
    const paredeMat = reboco('#e6ddcf');
    montarSala(cena, {
      L,
      H,
      P,
      paredes: {
        fundo: { material: paredeMat, porta: { x: 5.2, w: 1.25, h: 2.55, arco: true } },
        esquerda: { material: paredeMat, vaos: [{ x: 2.6, y: 0.45, w: 3.0, h: 2.3 }] },
        direita: { material: paredeMat },
      },
      piso: cimento('#d1c7b9'),
      teto: reboco('#ece6dc', { relevo: 0.3 }),
    });
    // Corredor atrás do arco: paredes claras e uma luz própria.
    const x0 = -L / 2 + 5.2;
    const corredor = montarSala(cena, {
      L: 1.25,
      H: 3.1,
      P: 2.6,
      paredes: { fundo: { material: reboco('#ede6da') }, esquerda: { material: paredeMat }, direita: { material: paredeMat } },
      piso: cimento('#d1c7b9'),
      teto: reboco('#ece6dc', { relevo: 0.3 }),
      deslocar: [x0 + 0.625, 0, -P / 2 - 0.2 - 1.3],
    });
    corredor.children.find((m) => m.rotation.y === Math.PI)?.removeFromParent();
    const luzCorredor = new PointLight('#fff1dd', 5, 5, 2);
    luzCorredor.position.set(x0 + 0.625, 2.6, -P / 2 - 2.2);
    cena.add(luzCorredor);
    ceu(cena, [-L / 2 - 2.5, 1.6, -0.8], Math.PI / 2, 9, 6, 2.4);
    // Sol baixo e de lado: o recorte da janela atravessa a parede do fundo.
    sol(cena, { de: [-12, 5.8, 4.5], para: [0, 1, -3], intensidade: 3.8 });

    // Balcão.
    const balcao = new Group();
    const corpo = sombras(new Mesh(new RoundedBoxGeometry(2.7, 1.0, 0.62, 4, 0.02), reboco('#e0d4c2', { relevo: 0.6 })));
    corpo.position.y = 0.5;
    const caneluraGeo = new CylinderGeometry(0.035, 0.035, 0.97, 24, 1, false, -Math.PI / 2, Math.PI);
    const caneluraMat = reboco('#e3d8c7', { relevo: 0.4 });
    const total = 35;
    for (let i = 0; i < total; i++) {
      const c = sombras(new Mesh(caneluraGeo, caneluraMat));
      c.position.set((i - (total - 1) / 2) * 0.075, 0.49, 0.31);
      balcao.add(c);
    }
    const tampo = sombras(new Mesh(new RoundedBoxGeometry(2.92, 0.06, 0.76, 3, 0.012), travertino()));
    tampo.position.set(0, 1.03, 0.03);
    const v = vaso({ altura: 0.4, raio: 0.12, cor: '#cbbfae' });
    v.position.set(0.95, 1.06, 0.05);
    const g = galho({ base: [0.95, 1.42, 0.05], escala: 0.62 });
    const livro = sombras(new Mesh(new RoundedBoxGeometry(0.32, 0.04, 0.24, 2, 0.006), tecido('#b9ab96')));
    livro.position.set(-0.85, 1.08, 0.08);
    livro.rotation.y = 0.2;
    balcao.add(corpo, tampo, v, g, livro);
    balcao.position.set(-0.55, 0, -P / 2 + 1.25);
    cena.add(balcao);
    pendente(cena, { x: -0.1, z: -P / 2 + 1.35, teto: H, comprimento: 0.62 });

    camera.fov = 38;
    camera.position.set(0.3, 1.45, 3.0);
    camera.lookAt(0.3, 1.45, -P / 2);
  },

  // Arco: passagem em arco para uma sala clara, onde o sol bate no fundo,
  // num banco de carvalho com um vaso.
  arco(cena, camera) {
    const L = 4.6;
    const H = 3.2;
    const paredeFrente = reboco('#ddd3c4');
    // Sala da câmera (sem janela: só a luz que vem pelo arco e o rebatimento).
    montarSala(cena, {
      L,
      H,
      P: 4,
      paredes: {
        fundo: { material: paredeFrente, porta: { x: (L - 1.55) / 2, w: 1.55, h: 2.85, arco: true } },
        esquerda: { material: paredeFrente },
        direita: { material: paredeFrente },
      },
      piso: cimento('#cbc1b3'),
      teto: reboco('#e4ddd2', { relevo: 0.3 }),
    });
    // Sala de trás, com janela à esquerda.
    const trasMat = reboco('#e9e1d4');
    const tras = montarSala(cena, {
      L,
      H,
      P: 4,
      paredes: {
        fundo: { material: trasMat },
        esquerda: { material: trasMat, vaos: [{ x: 0.5, y: 0.4, w: 2.4, h: 2.4 }] },
        direita: { material: trasMat },
      },
      piso: cimento('#d3c9bb'),
      teto: reboco('#ece6dc', { relevo: 0.3 }),
      deslocar: [0, 0, -4.2],
    });
    tras.children.find((m) => m.rotation.y === Math.PI)?.removeFromParent();
    ceu(cena, [-L / 2 - 2.4, 1.6, -4.6], Math.PI / 2, 8, 6, 2.4);
    sol(cena, { de: [-10, 6.2, -1.2], para: [0.6, 0.6, -6.1], intensidade: 3.8 });
    const rebate = new PointLight('#ffe9cf', 1.3, 6, 2);
    rebate.position.set(0, 1.6, -0.5);
    cena.add(rebate);

    const banco = sombras(new Mesh(new RoundedBoxGeometry(1.7, 0.42, 0.44, 4, 0.03), travertino()));
    banco.position.set(0.15, 0.21, -5.75);
    const v = vaso({ altura: 0.5, raio: 0.15, cor: '#3f3a34' });
    v.position.set(0.68, 0.42, -5.75);
    const g = galho({ base: [0.68, 0.88, -5.75], escala: 0.8 });
    const vasoChao = vaso({ altura: 0.78, raio: 0.26, cor: '#cfc4b4', perfil: [[0, 0.62], [0.2, 0.92], [0.45, 1], [0.75, 0.8], [0.92, 0.55], [1, 0.58]] });
    vasoChao.position.set(1.62, 0, -1.45);
    cena.add(banco, v, g, vasoChao);

    camera.fov = 52;
    camera.position.set(0, 1.45, 1.55);
    camera.lookAt(0, 1.45, -6);
  },

  // Cortina: a parede da esquerda é quase toda janela, atrás de uma cortina
  // leve de linho; a luz difusa chega a uma poltrona e a uma mesa lateral.
  cortina(cena, camera) {
    const L = 5.6;
    const H = 3.0;
    const P = 6.0;
    const paredeMat = reboco('#e4dbcd');
    montarSala(cena, {
      L,
      H,
      P,
      paredes: {
        fundo: { material: paredeMat },
        esquerda: { material: paredeMat, vaos: [{ x: 0.5, y: 0.1, w: 4.9, h: 2.78 }] },
        direita: { material: paredeMat },
      },
      piso: cimento('#cfc5b7'),
      teto: reboco('#ebe5db', { relevo: 0.3 }),
    });
    ceu(cena, [-L / 2 - 1.6, 1.5, 0], Math.PI / 2, 10, 6, 1.9);

    // Cortina com pregas: um plano ondulado e translúcido, paralelo à janela.
    const comprimento = 5.2;
    const geo = new PlaneGeometry(comprimento, 2.94, 520, 8);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i);
      const y = p.getY(i);
      p.setZ(i, Math.sin(u * 7.2) * 0.075 + Math.sin(u * 17 + 1.3) * 0.022 + Math.sin(u * 2.3 + y * 0.5) * 0.03);
    }
    geo.computeVertexNormals();
    const cortina = sombras(
      new Mesh(
        geo,
        new MeshStandardMaterial({ color: '#efe8dd', emissive: '#fff0da', emissiveIntensity: 0.3, roughness: 1, transparent: true, opacity: 0.9, side: DoubleSide }),
      ),
      false,
    );
    cortina.rotation.y = Math.PI / 2;
    cortina.position.set(-L / 2 + 0.24, 1.49, P / 2 - 0.45 - comprimento / 2);
    cena.add(cortina);
    const trilho = new Mesh(new CylinderGeometry(0.012, 0.012, comprimento + 0.2, 12), latao());
    trilho.rotation.x = Math.PI / 2;
    trilho.position.set(-L / 2 + 0.24, 2.97, cortina.position.z);
    cena.add(trilho);

    // A janela vira uma grande fonte de luz difusa (a cortina não deixa
    // passar sombra recortada).
    const janela = new RectAreaLight('#fff0da', 6, 4.9, 2.7);
    janela.position.set(-L / 2 + 0.4, 1.5, cortina.position.z);
    janela.lookAt(L / 2, 1.1, cortina.position.z);
    cena.add(janela);
    const lateral = new DirectionalLight('#fff3e2', 0.9);
    lateral.position.set(-8, 3, -1);
    lateral.target.position.set(0, 1, -1);
    cena.add(lateral, lateral.target);

    const cadeira = poltrona('#cbbfab');
    cadeira.position.set(0.55, 0, -1.7);
    cadeira.rotation.y = -0.9;
    const mesa = mesaLateral();
    mesa.position.set(-0.45, 0, -1.95);
    const xicara = vaso({ altura: 0.09, raio: 0.05, cor: '#efe9e0', perfil: [[0, 0.6], [0.3, 0.9], [1, 1]] });
    xicara.position.set(-0.4, 0.54, -1.9);
    const v = vaso({ altura: 0.66, raio: 0.18, cor: '#3f3a34' });
    v.position.set(1.95, 0, -P / 2 + 0.55);
    const g = galho({ base: [1.95, 0.6, -P / 2 + 0.55], escala: 0.95 });
    cena.add(cadeira, mesa, xicara, v, g);

    camera.fov = 44;
    camera.position.set(1.35, 1.32, 2.3);
    camera.lookAt(-0.55, 1.32, -P / 2);
  },

  // Nicho: arco embutido na parede, com prateleira de travertino e peças de
  // porcelana sob um foco; um raio de sol atravessa a parede.
  nicho(cena, camera) {
    const L = 4.4;
    const H = 3.1;
    const P = 4.2;
    const paredeMat = reboco('#d9ccb8');
    const arco = { x: (L - 1.15) / 2, y: 0.78, w: 1.15, h: 1.95, arco: true };
    montarSala(cena, {
      L,
      H,
      P,
      paredes: {
        fundo: { material: paredeMat, vaos: [arco] },
        esquerda: { material: paredeMat },
        direita: { material: paredeMat, vaos: [{ x: 0.35, y: 0.6, w: 1.5, h: 2.2 }] },
      },
      piso: cimento('#c9bfb1'),
      teto: reboco('#e2dbcf', { relevo: 0.3 }),
    });
    // Caixa do nicho atrás do arco (fundo, laterais, base e topo).
    const fundoZ = -P / 2 - 0.2;
    const prof = 0.42;
    const nichoMat = reboco('#ddd0bd', { relevo: 0.8 });
    const caixa = (w, h, d, x, y, z) => {
      const m = sombras(new Mesh(new RoundedBoxGeometry(w, h, d, 2, 0.004), nichoMat));
      m.position.set(x, y, z);
      cena.add(m);
    };
    caixa(1.25, 2.05, 0.04, 0, 0.78 + 1.0, fundoZ - prof);
    caixa(0.04, 2.05, prof, -0.6, 0.78 + 1.0, fundoZ - prof / 2);
    caixa(0.04, 2.05, prof, 0.6, 0.78 + 1.0, fundoZ - prof / 2);
    caixa(1.25, 0.04, prof, 0, 0.76, fundoZ - prof / 2);
    caixa(1.25, 0.04, prof, 0, 2.75, fundoZ - prof / 2);
    const prateleira = sombras(new Mesh(new RoundedBoxGeometry(1.15, 0.035, prof - 0.02, 2, 0.006), travertino()));
    prateleira.position.set(0, 1.5, fundoZ - prof / 2);
    cena.add(prateleira);

    const z = fundoZ - prof / 2 + 0.02;
    const seixo1 = sombras(new Mesh(geometriaSeixo(1.7, 0.1), porcelana()));
    seixo1.scale.set(0.17, 0.08, 0.14);
    seixo1.position.set(-0.22, 0.86, z);
    const seixo2 = sombras(new Mesh(geometriaSeixo(5.2, 0.1), porcelana({ color: '#e7e0d5' })));
    seixo2.scale.set(0.11, 0.06, 0.1);
    seixo2.position.set(-0.2, 0.99, z + 0.01);
    const v1 = vaso({ altura: 0.36, raio: 0.1, cor: '#efe9df' });
    v1.position.set(0.2, 0.78, z);
    const v2 = vaso({ altura: 0.5, raio: 0.075, cor: '#3d3832', perfil: [[0, 0.7], [0.3, 1], [0.6, 0.6], [0.8, 0.3], [1, 0.34]] });
    v2.position.set(-0.12, 1.518, z);
    const esfera = sombras(new Mesh(new SphereGeometry(0.07, 64, 48), porcelana({ color: '#f4f0ea', roughness: 0.2 })));
    esfera.position.set(0.24, 1.588, z);
    cena.add(seixo1, seixo2, v1, v2, esfera);

    const foco = new SpotLight('#ffdcb2', 9, 3, 0.62, 0.85, 2);
    foco.position.set(0, 2.68, fundoZ - prof / 2);
    foco.target.position.set(0, 0.7, fundoZ - prof / 2);
    foco.castShadow = true;
    foco.shadow.mapSize.set(2048, 2048);
    foco.shadow.bias = -0.0004;
    cena.add(foco, foco.target);
    ceu(cena, [L / 2 + 2.6, 1.6, -0.9], -Math.PI / 2, 8, 6, 2.4);
    sol(cena, { de: [12, 6.5, 1.6], para: [-1.2, 1.0, -2.2], intensidade: 3.2 });

    camera.fov = 50;
    camera.position.set(0, 1.5, 2.0);
    camera.lookAt(0, 1.5, -P / 2);
  },

  // Sala (a última da galeria, que vira fundo): paredes escuras e uma
  // janela alta com montantes, cujas faixas de sol cruzam o piso e a parede.
  sala(cena, camera) {
    const L = 7.4;
    const H = 3.3;
    const P = 6.2;
    const paredeMat = reboco('#4a443d', { relevo: 1.4 });
    montarSala(cena, {
      L,
      H,
      P,
      paredes: {
        fundo: { material: paredeMat },
        esquerda: { material: paredeMat },
        direita: { material: paredeMat, vaos: [{ x: 0.5, y: 0.25, w: 3.6, h: 2.8 }] },
      },
      piso: cimento('#3b3631'),
      teto: reboco('#3f3a34', { relevo: 0.3 }),
    });
    // Montantes da janela: as faixas de sombra no piso e na parede.
    for (let i = 1; i < 4; i++) {
      const montante = sombras(new Mesh(new CylinderGeometry(0.035, 0.035, 2.8, 8), new MeshStandardMaterial({ color: '#2a2622', roughness: 0.6 })));
      montante.position.set(L / 2 + 0.1, 0.25 + 1.4, -P / 2 + 0.5 + i * 0.9);
      cena.add(montante);
    }
    ceu(cena, [L / 2 + 2.8, 1.6, -0.5], -Math.PI / 2, 9, 6, 2.2);
    // Sol baixo, quase rasante: as faixas da janela atravessam a parede do fundo.
    sol(cena, { de: [12.5, 4.6, 7.3], para: [-2, 1.2, -3.1], intensidade: 5.2, cor: '#ffe2bd' });

    const cadeira = poltrona('#d8cebf');
    cadeira.position.set(-1.25, 0, -1.6);
    cadeira.rotation.y = 0.5;
    const mesa = mesaLateral();
    mesa.position.set(-0.3, 0, -1.95);
    const v = vaso({ altura: 0.3, raio: 0.09, cor: '#e9e2d7' });
    v.position.set(-0.3, 0.54, -1.95);
    const g = galho({ base: [-0.3, 0.83, -1.95], escala: 0.5 });
    cena.add(cadeira, mesa, v, g);

    camera.fov = 40;
    camera.position.set(-0.3, 1.4, 2.5);
    camera.lookAt(-0.3, 1.4, -P / 2);
  },
};

export async function renderizar({ cena = 'recepcao', largura = 1600, altura = 1067, exposicao = 1, ao = 1 }) {
  const canvas = document.createElement('canvas');
  const renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(largura, altura, false);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = exposicao;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;
  scene.add(new HemisphereLight('#f6f0e6', '#8f8476', 0.55));

  const camera = new PerspectiveCamera(42, largura / altura, 0.05, 80);
  (CENAS[cena] || CENAS.recepcao)(scene, camera);
  camera.updateProjectionMatrix();

  // Oclusão de ambiente (GTAO): escurece cantos e encontros, como na foto real.
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(1);
  composer.setSize(largura, altura);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, largura, altura);
  gtao.output = GTAOPass.OUTPUT.Default;
  gtao.blendIntensity = ao;
  gtao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.4, thickness: 1.5, scale: 1.1, samples: 24 });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 7, rings: 2, samples: 16 });
  composer.addPass(gtao);
  composer.addPass(new OutputPass());

  await renderer.compileAsync(scene, camera);
  composer.render();

  // Vinheta leve, como numa lente de verdade.
  const final = document.createElement('canvas');
  final.width = largura;
  final.height = altura;
  const ctx = final.getContext('2d');
  ctx.drawImage(canvas, 0, 0);
  const vinheta = ctx.createRadialGradient(largura / 2, altura / 2, Math.min(largura, altura) * 0.35, largura / 2, altura / 2, Math.hypot(largura, altura) * 0.6);
  vinheta.addColorStop(0, 'rgba(0,0,0,0)');
  vinheta.addColorStop(1, 'rgba(20,16,12,0.28)');
  ctx.fillStyle = vinheta;
  ctx.fillRect(0, 0, largura, altura);
  return final.toDataURL('image/png');
}
