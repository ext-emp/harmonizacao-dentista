// ---------------------------------------------------------------------------
// Ferramenta (não entra no site): renderiza as naturezas-mortas de porcelana
// usadas como imagens provisórias. Cada "cena" é uma composição simples sobre
// fundo de papel de estúdio, com a mesma porcelana da pérola do hero.
// Usada por scripts/gerar-provisorias.mjs.
// ---------------------------------------------------------------------------
import {
  BackSide,
  BoxGeometry,
  CanvasTexture,
  Color,
  SplineCurve,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  VSMShadowMap,
  WebGLRenderer,
} from 'three';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const suave = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Junta os vértices duplicados da emenda antes de recalcular as normais,
// para não aparecer um vinco onde a malha fecha.
function semEmenda(geometria) {
  geometria.deleteAttribute('uv');
  geometria.deleteAttribute('normal');
  const g = mergeVertices(geometria);
  g.computeVertexNormals();
  return g;
}

const FUNDOS = {
  porcelana: ['#f6f2ec', '#e2dbd0'],
  linho: ['#eee8de', '#d6cdbf'],
  perola: ['#fbf9f5', '#e7e1d8'],
  // Areia: um tom abaixo do linho, para a imagem não sumir sobre a porcelana.
  areia: ['#e2d8c9', '#bfb19d'],
  grafite: ['#3a3631', '#141311'],
};

const ruido = new ImprovedNoise();

// Fundo de papel de estúdio: claro no centro, caindo para as bordas.
function texturaFundo(nome, largura, altura) {
  const [centro, borda] = FUNDOS[nome] || FUNDOS.porcelana;
  const c = document.createElement('canvas');
  c.width = largura;
  c.height = altura;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(largura * 0.5, altura * 0.38, 0, largura * 0.5, altura * 0.45, Math.hypot(largura, altura) * 0.62);
  g.addColorStop(0, centro);
  g.addColorStop(1, borda);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, largura, altura);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

// Estúdio só para os reflexos (mesma ideia do hero, com paredes mais claras
// para as bordas não escurecerem).
function estudioReflexos() {
  const estudio = new Scene();
  const caixa = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: '#8a8279', side: BackSide }));
  caixa.scale.set(24, 16, 24);
  estudio.add(caixa);
  const painel = (cor, k, pos, esc) => {
    const m = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ color: new Color(cor).multiplyScalar(k), side: DoubleSide }));
    m.position.set(...pos);
    m.scale.set(esc[0], esc[1], 1);
    m.lookAt(0, 0, 0);
    estudio.add(m);
  };
  // Softbox grande e difuso (em vez de painéis pequenos e estourados).
  painel('#fff6ec', 3.2, [-6, 7, 6], [12, 9]);
  painel('#ffffff', 1.4, [8, 1, 3], [5, 9]);
  painel('#eef1ff', 1.3, [2, 3, -9], [10, 4]);
  painel('#f4ede2', 1.2, [0, -7, 0], [16, 16]);
  return estudio;
}

// Porcelana acetinada: menos verniz que a pérola, para parecer foto de
// produto e não render. (Também usada pelos ambientes, em ambientes.js.)
export function porcelana(extra = {}) {
  return new MeshPhysicalMaterial({
    color: '#ebe6de',
    roughness: 0.46,
    clearcoat: 0.5,
    clearcoatRoughness: 0.26,
    sheen: 0.18,
    sheenRoughness: 0.6,
    sheenColor: '#efe4d2',
    ...extra,
  });
}

// Lâmina fina, como uma lente de contato dental: perfil em crescente girado
// num torno, achatado para ficar ovalado.
export function geometriaLamina() {
  const pontos = [];
  const raio = 1;
  const curva = 0.32; // profundidade da concha
  const espessura = 0.045;
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pontos.push(new Vector2(t * raio, -curva * t * t));
  }
  for (let i = n; i >= 0; i--) {
    const t = i / n;
    const e = espessura * (1 - t * t * 0.7);
    pontos.push(new Vector2(t * raio * 0.995, -curva * t * t + e));
  }
  return new LatheGeometry(pontos, 96);
}

// Seixo: esfera deformada por ruído suave.
export function geometriaSeixo(semente, irregularidade = 0.12) {
  const g = new SphereGeometry(1, 160, 120);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const n = ruido.noise(x * 0.9 + semente, y * 0.9 + semente * 1.7, z * 0.9 - semente) * irregularidade;
    const k = 1 + n;
    p.setXYZ(i, x * k, y * k, z * k);
  }
  g.computeVertexNormals();
  return g;
}

function sombra(malha) {
  malha.castShadow = true;
  malha.receiveShadow = true;
  return malha;
}

// ---- Cenas ------------------------------------------------------------------
const CENAS = {
  // Rosto: três seixos em equilíbrio (proporção, harmonia). Pequenos no
  // quadro, apoiados no terço de baixo, com muito papel em volta.
  seixos(grupo, camera) {
    const base = sombra(new Mesh(geometriaSeixo(1.3, 0.1), porcelana()));
    base.scale.set(1.25, 0.52, 1.05);
    base.position.set(0, 0.5, 0);
    const meio = sombra(new Mesh(geometriaSeixo(4.1, 0.1), porcelana({ color: '#e8e1d6' })));
    meio.scale.set(0.86, 0.42, 0.78);
    meio.position.set(0.12, 1.36, 0.02);
    meio.rotation.set(0.05, 0.6, -0.08);
    const topo = sombra(new Mesh(geometriaSeixo(7.7, 0.12), porcelana()));
    topo.scale.set(0.5, 0.34, 0.48);
    topo.position.set(0.02, 2.02, 0.04);
    topo.rotation.set(-0.06, 1.2, 0.1);
    grupo.add(base, meio, topo);
    camera.position.set(0.6, 3.2, 13.5);
    camera.lookAt(0, 2.3, 0);
  },

  // Sorriso: três lâminas finas de porcelana em pé, giradas de lado para a
  // curvatura e a translucidez aparecerem.
  laminas(grupo, camera) {
    const geo = geometriaLamina();
    const mat = porcelana({ color: '#f2eee8', roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.15, transmission: 0.45, thickness: 0.06, ior: 1.5, attenuationColor: '#eadcc4', attenuationDistance: 0.5 });
    const posicoes = [
      [-1.05, 0.42, 0.35, 0.95, 0.52],
      [0.05, 0.47, -0.2, 0.7, 0.58],
      [1.1, 0.4, 0.3, 0.45, 0.5],
    ];
    for (const [x, y, z, giro, tam] of posicoes) {
      const lamina = sombra(new Mesh(geo, mat));
      lamina.scale.set(tam, tam, tam * 1.32);
      lamina.position.set(x, y, z);
      lamina.rotation.set(Math.PI / 2 - 0.12, 0, 0);
      lamina.rotateOnWorldAxis({ x: 0, y: 1, z: 0 }, giro);
      grupo.add(lamina);
    }
    camera.position.set(0.4, 2.6, 12.5);
    camera.lookAt(0, 1.55, 0);
  },

  // Sorriso (bloco grande): prato raso e fino de porcelana com uma pérola.
  // A borda fina do prato lembra a delicadeza da lente; a pérola liga ao hero.
  prato(grupo, camera) {
    const perfil = [];
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      perfil.push(new Vector2(t * 1.6, 0.03 + 0.34 * t ** 3));
    }
    for (let i = n; i >= 0; i--) {
      const t = i / n;
      perfil.push(new Vector2(t * 1.6 * 0.985, 0.075 + 0.34 * t ** 3));
    }
    const prato = sombra(new Mesh(new LatheGeometry(perfil, 160), porcelana({ color: '#efeae2', side: DoubleSide })));
    const perola = sombra(
      new Mesh(
        new SphereGeometry(0.34, 128, 96),
        new MeshPhysicalMaterial({ color: '#f1ece5', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.8, iridescenceIOR: 1.3, iridescenceThicknessMinimum: 200, iridescenceThicknessMaximum: 480, sheen: 0.3, sheenColor: '#f3e4c8' }),
      ),
    );
    perola.position.set(0.32, 0.44, 0.18);
    grupo.add(prato, perola);
    camera.position.set(0.3, 4.6, 10.5);
    camera.lookAt(0, 1.3, 0);
  },

  // Lentes de contato dental: uma lâmina, de perto, apoiada num bloco.
  lamina(grupo, camera) {
    const lamina = sombra(new Mesh(geometriaLamina(), porcelana({ color: '#f2eee8', roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.15, transmission: 0.45, thickness: 0.06, ior: 1.5, attenuationColor: '#eadcc4', attenuationDistance: 0.5 })));
    lamina.scale.set(0.55, 0.55, 0.72);
    lamina.position.set(-0.1, 0.98, 0.25);
    lamina.rotation.set(Math.PI / 2 - 0.3, 0.55, 0.06);
    const bloco = sombra(new Mesh(new RoundedBoxGeometry(1.8, 0.42, 1.2, 6, 0.06), porcelana({ color: '#e4dbce', roughness: 0.6, clearcoat: 0.15 })));
    bloco.position.set(0.15, 0.21, -0.35);
    bloco.rotation.y = -0.25;
    grupo.add(lamina, bloco);
    camera.position.set(0.4, 3.0, 9.5);
    camera.lookAt(0, 0.75, 0);
  },

  // Harmonização facial completa: um seixo alongado e uma esfera menor.
  par(grupo, camera) {
    const seixo = sombra(new Mesh(geometriaSeixo(2.2, 0.08), porcelana()));
    seixo.scale.set(0.9, 1.25, 0.8);
    seixo.position.set(-0.45, 1.2, 0);
    seixo.rotation.set(0.05, 0.4, 0.08);
    const esfera = sombra(new Mesh(new SphereGeometry(0.46, 96, 72), porcelana({ color: '#ece4d8' })));
    esfera.position.set(0.85, 0.46, 0.35);
    grupo.add(seixo, esfera);
    camera.position.set(0.3, 2.3, 11.5);
    camera.lookAt(0.15, 1.05, 0);
  },

  // Preenchimento labial: uma almofada macia, levemente inflada.
  almofada(grupo, camera) {
    const geo = new RoundedBoxGeometry(2.4, 0.9, 1.7, 10, 0.42);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const inflar = 1 + 0.18 * (1 - Math.min(1, (x * x) / 1.6)) * (1 - Math.min(1, (z * z) / 0.8));
      p.setY(i, y * inflar);
    }
    geo.computeVertexNormals();
    const almofada = sombra(new Mesh(geo, porcelana({ roughness: 0.38 })));
    almofada.position.set(0, 0.52, 0);
    almofada.rotation.set(0, 0.5, 0);
    almofada.scale.setScalar(0.72);
    almofada.position.y = 0.38;
    grupo.add(almofada);
    camera.position.set(0.5, 3.2, 10.5);
    camera.lookAt(0, 0.6, 0);
  },

  // Toxina botulínica: disco liso com ondulação concêntrica quase parada.
  onda(grupo, camera) {
    const geo = new CylinderGeometry(1.7, 1.7, 0.24, 160, 1, false);
    const topo = new CylinderGeometry(1.7, 1.7, 0.01, 160, 80);
    const p = topo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const r = Math.hypot(x, z);
      p.setY(i, p.getY(i) + Math.sin(r * 9) * 0.012 * Math.max(0, 1 - r / 1.7));
    }
    topo.computeVertexNormals();
    const disco = sombra(new Mesh(geo, porcelana({ color: '#e9e1d4', roughness: 0.5, clearcoat: 0.3 })));
    disco.position.y = 0.12;
    const superficie = sombra(new Mesh(topo, porcelana({ roughness: 0.15, clearcoatRoughness: 0.05 })));
    superficie.position.y = 0.245;
    const gota = sombra(new Mesh(new SphereGeometry(0.16, 64, 48), porcelana()));
    gota.position.set(0, 0.4, 0);
    grupo.add(disco, superficie, gota);
    grupo.scale.setScalar(0.62);
    camera.position.set(0, 5.4, 9.2);
    camera.lookAt(0, 0.35, 0);
  },

  // Bioestimulador de colágeno: camadas finas empilhadas (estrutura que se forma).
  camadas(grupo, camera) {
    const total = 9;
    for (let i = 0; i < total; i++) {
      const t = i / (total - 1);
      const raio = 1.3 - t * 0.45;
      const camada = sombra(new Mesh(new CylinderGeometry(raio, raio, 0.11, 128), porcelana({ color: i % 2 ? '#ece4d8' : '#f0eae1', roughness: 0.4 })));
      camada.position.set(Math.sin(i * 1.3) * 0.06, 0.06 + i * 0.125, Math.cos(i * 1.7) * 0.05);
      camada.rotation.y = i * 0.3;
      grupo.add(camada);
    }
    grupo.scale.setScalar(0.7);
    camera.position.set(0.4, 3.4, 11);
    camera.lookAt(0, 0.85, 0);
  },

  // Clareamento dental: esfera muito clara e brilhante sobre um pedestal.
  esfera(grupo, camera) {
    const pedestal = sombra(new Mesh(new CylinderGeometry(0.8, 0.8, 1.1, 128), porcelana({ color: '#e4dbce', roughness: 0.6, clearcoat: 0.15 })));
    pedestal.position.y = 0.55;
    const esfera = sombra(new Mesh(new SphereGeometry(0.62, 128, 96), porcelana({ color: '#f8f6f2', roughness: 0.12, clearcoatRoughness: 0.03 })));
    esfera.position.y = 1.72;
    grupo.add(pedestal, esfera);
    camera.position.set(0.3, 2.5, 11);
    camera.lookAt(0, 1.2, 0);
  },

  // ---- Atendimento (fotos que flutuam sobre o fundo do manifesto) ----------
  // Detalhes do atendimento, sem paciente: a Resolução CFO 196/2019 não
  // permite imagem "durante" o procedimento.

  // Espelho clínico e sonda sobre um guardanapo de linho dobrado.
  espelho(grupo, camera) {
    const pano = sombra(
      new Mesh(
        new RoundedBoxGeometry(2.7, 0.07, 1.8, 4, 0.03),
        new MeshPhysicalMaterial({ color: '#e4dacb', roughness: 0.95, sheen: 0.7, sheenColor: '#f4eadb', sheenRoughness: 0.8 }),
      ),
    );
    pano.position.set(0, 0.035, 0);
    pano.rotation.y = -0.12;
    pano.material.color.set('#d8d1c7');
    pano.material.sheen = 0.25;
    const aco = new MeshPhysicalMaterial({ color: '#cdc9c2', metalness: 1, roughness: 0.24 });
    const cabo = sombra(new Mesh(new CylinderGeometry(0.05, 0.05, 1.45, 40), aco));
    cabo.rotation.z = Math.PI / 2;
    cabo.position.set(-0.32, 0.12, 0.22);
    const haste = sombra(new Mesh(new CylinderGeometry(0.016, 0.03, 0.5, 24), aco));
    haste.rotation.z = Math.PI / 2;
    haste.position.set(0.64, 0.12, 0.22);
    const aro = sombra(new Mesh(new CylinderGeometry(0.15, 0.15, 0.035, 64), aco));
    aro.position.set(1.02, 0.11, 0.22);
    const vidro = new Mesh(new CylinderGeometry(0.13, 0.13, 0.04, 64), new MeshPhysicalMaterial({ color: '#ffffff', metalness: 1, roughness: 0.02 }));
    vidro.position.set(1.02, 0.113, 0.22);
    // Sonda: cabo fino e ponta curva.
    const caboSonda = sombra(new Mesh(new CylinderGeometry(0.035, 0.035, 1.5, 32), aco));
    caboSonda.rotation.z = Math.PI / 2;
    caboSonda.position.set(-0.2, 0.105, -0.3);
    const curva = new SplineCurve([new Vector2(0, 0), new Vector2(0.18, 0.01), new Vector2(0.3, 0.06), new Vector2(0.34, 0.14)]);
    const pontos = curva.getPoints(24).map((p) => ({ x: p.x, y: p.y }));
    const ponta = new Group();
    for (let i = 1; i < pontos.length; i++) {
      const a = pontos[i - 1];
      const b = pontos[i];
      const seg = sombra(new Mesh(new CylinderGeometry(0.008, 0.008, Math.hypot(b.x - a.x, b.y - a.y) + 0.002, 10), aco));
      seg.position.set((a.x + b.x) / 2, 0, (a.y + b.y) / 2);
      seg.rotation.set(Math.PI / 2, 0, 0);
      seg.rotateOnWorldAxis({ x: 0, y: 1, z: 0 }, -Math.atan2(b.y - a.y, b.x - a.x));
      ponta.add(seg);
    }
    ponta.position.set(0.55, 0.105, -0.3);
    grupo.add(pano, cabo, haste, aro, vidro, caboSonda, ponta);
    grupo.rotation.y = 0.55;
    camera.position.set(0.35, 3.9, 3.3);
    camera.lookAt(0.2, 0.05, 0);
  },

  // Xícara de porcelana no pires, com café: o acolhimento da recepção.
  xicara(grupo, camera) {
    const perfilXicara = [];
    const fora = [[0.02, 0], [0.3, 0.01], [0.36, 0.06], [0.44, 0.26], [0.5, 0.52], [0.52, 0.62]];
    const dentro = [[0.495, 0.62], [0.47, 0.5], [0.41, 0.27], [0.3, 0.1], [0.02, 0.08]];
    for (const [r, y] of [...fora, ...dentro]) perfilXicara.push(new Vector2(r, y));
    const mat = porcelana({ color: '#f1ece4', roughness: 0.3, clearcoat: 0.8, side: DoubleSide });
    const xicara = sombra(new Mesh(new LatheGeometry(perfilXicara, 120), mat));
    xicara.position.y = 0.09;
    const cafe = new Mesh(new CylinderGeometry(0.455, 0.455, 0.01, 96), new MeshPhysicalMaterial({ color: '#2e1d12', roughness: 0.12, clearcoat: 1 }));
    cafe.position.y = 0.09 + 0.47;
    // Asa: um anel parcial, de pé, na lateral.
    const asa = sombra(new Mesh(new TorusGeometry(0.15, 0.035, 20, 64, Math.PI * 1.25), mat));
    asa.position.set(0.56, 0.09 + 0.36, 0);
    asa.rotation.z = -Math.PI * 0.62;
    const perfilPires = [];
    for (const [r, y] of [[0.02, 0], [0.5, 0.01], [0.78, 0.05], [0.9, 0.1], [0.885, 0.115], [0.76, 0.075], [0.48, 0.04], [0.02, 0.035]]) perfilPires.push(new Vector2(r, y));
    const pires = sombra(new Mesh(new LatheGeometry(perfilPires, 140), mat));
    const colher = sombra(new Mesh(new RoundedBoxGeometry(0.9, 0.02, 0.07, 3, 0.008), new MeshPhysicalMaterial({ color: '#bfa77a', metalness: 1, roughness: 0.3 })));
    colher.position.set(0.18, 0.1, 0.55);
    colher.rotation.y = 0.5;
    grupo.add(pires, xicara, cafe, asa, colher);
    grupo.scale.setScalar(1.15);
    camera.position.set(0.4, 4.3, 6.2);
    camera.lookAt(0.05, 0.3, 0);
  },

  // Caderno fechado e caneta: o planejamento conversado.
  caderno(grupo, camera) {
    const capa = sombra(new Mesh(new RoundedBoxGeometry(1.5, 0.12, 2.05, 4, 0.025), new MeshPhysicalMaterial({ color: '#cbbfae', roughness: 0.85, sheen: 0.4, sheenColor: '#e6dccb' })));
    capa.position.y = 0.06;
    const folhas = new Mesh(new BoxGeometry(1.44, 0.09, 1.99), new MeshPhysicalMaterial({ color: '#f4efe6', roughness: 0.9 }));
    folhas.position.set(0.02, 0.06, 0);
    const elastico = sombra(new Mesh(new BoxGeometry(0.035, 0.125, 2.07), new MeshPhysicalMaterial({ color: '#3a342e', roughness: 0.6 })));
    elastico.position.set(0.58, 0.062, 0);
    const caneta = sombra(new Mesh(new CylinderGeometry(0.045, 0.045, 1.6, 40), new MeshPhysicalMaterial({ color: '#24211d', roughness: 0.35, clearcoat: 0.6 })));
    caneta.rotation.set(0, 0, Math.PI / 2);
    caneta.rotateOnWorldAxis({ x: 0, y: 1, z: 0 }, 0.5);
    caneta.position.set(0.25, 0.17, 0.2);
    const anel = sombra(new Mesh(new CylinderGeometry(0.048, 0.048, 0.06, 40), new MeshPhysicalMaterial({ color: '#bfa77a', metalness: 1, roughness: 0.3 })));
    anel.rotation.copy(caneta.rotation);
    anel.position.set(0.25 + Math.cos(0.5) * 0.35, 0.17, 0.2 - Math.sin(0.5) * 0.35);
    grupo.add(capa, folhas, elastico, caneta, anel);
    grupo.rotation.y = -0.4;
    camera.position.set(0.3, 6.5, 4.4);
    camera.lookAt(0.1, 0.05, 0);
  },

  // Hero: busto de porcelana grafite, sem rosto, recortado (fundo
  // transparente). Ocupa o lugar do retrato do doutor até a foto chegar.
  busto(grupo, camera, { cor = '#34302b' } = {}) {
    const mat = porcelana({ color: cor, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.25, sheen: 0.5, sheenColor: '#b9ab98', sheenRoughness: 0.45 });

    // Cabeça: ovoide (altura ≈ 1,3 × largura), queixo afinando. Sem rosto.
    const cabeca = new SphereGeometry(1, 160, 120);
    const p = cabeca.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const baixo = Math.max(0, -y);
      const afina = 1 - 0.26 * baixo ** 1.8;
      const nuca = z < 0 ? 1.05 : 1;
      p.setXYZ(i, x * 0.54 * afina, y * 0.7, z * 0.64 * afina * nuca + 0.05 * suave(0.35, 0.95, baixo));
    }
    const malhaCabeca = sombra(new Mesh(semEmenda(cabeca), mat));
    malhaCabeca.position.set(0, 2.02, 0.1);
    // Levemente inclinada e virada: postura de retrato, não de manequim.
    malhaCabeca.rotation.set(0.12, 0.25, -0.06);

    // Pescoço curto e largo, trapézio descendo até ombros largos e o peito,
    // numa peça só (perfil girado no torno).
    const perfil = new SplineCurve(
      [
        [0.36, 1.66],
        [0.37, 1.36],
        [0.42, 1.12],
        [0.62, 0.98],
        [1.05, 0.84],
        [1.5, 0.66],
        [1.84, 0.4],
        [2.0, 0.02],
        [2.03, -0.5],
        [1.98, -1.4],
        [1.92, -2.6],
      ].map(([r, y]) => new Vector2(r, y)),
    ).getPoints(120);
    const tronco = new LatheGeometry(perfil, 180);
    // Seção oval no tronco (mais raso que largo); o pescoço continua redondo.
    const t = tronco.attributes.position;
    for (let i = 0; i < t.count; i++) {
      const y = t.getY(i);
      const z = t.getZ(i);
      const k = suave(0.7, 1.2, y);
      t.setZ(i, z * (0.46 + 0.5 * k));
    }
    const malhaTronco = sombra(new Mesh(semEmenda(tronco), mat));

    const corpo = new Group();
    corpo.add(malhaCabeca, malhaTronco);
    corpo.rotation.y = 0.42;
    grupo.add(corpo);

    // Quadro 4:5: alto da cabeça a ~6% do topo, cortado no peito, com folga
    // dos lados para os ombros não encostarem na borda.
    camera.fov = 22;
    camera.updateProjectionMatrix();
    camera.position.set(0.3, 1.0, 14.2);
    camera.lookAt(0, 0.62, 0);
  },

  // Retrato provisório: estúdio escuro com um pedestal alto e luz lateral,
  // marcando o lugar onde vai o retrato do doutor.
  pedestal(grupo, camera) {
    const coluna = sombra(new Mesh(new CylinderGeometry(0.55, 0.55, 2.6, 128), porcelana({ color: '#d9d0c3', roughness: 0.55, clearcoat: 0.2 })));
    coluna.position.y = 1.3;
    const esfera = sombra(new Mesh(new SphereGeometry(0.42, 128, 96), porcelana({ color: '#efe9e0', roughness: 0.3, clearcoat: 0.8 })));
    esfera.position.y = 3.02;
    grupo.add(coluna, esfera);
    camera.position.set(0.2, 2.4, 11);
    camera.lookAt(0, 2.0, 0);
  },
};

export async function renderizar({ cena = 'seixos', largura = 1600, altura = 2000, fundo = 'porcelana', exposicao = 1, cor }) {
  const transparente = fundo === 'transparente';
  const canvas = document.createElement('canvas');
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: transparente, preserveDrawingBuffer: true });
  if (transparente) renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(1);
  renderer.setSize(largura, altura, false);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = exposicao;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = VSMShadowMap;

  const scene = new Scene();
  scene.background = transparente ? null : texturaFundo(fundo, largura, altura);
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(estudioReflexos(), 0.02).texture;
  scene.environmentIntensity = fundo === 'grafite' ? 0.55 : 1;

  const chave = new DirectionalLight('#fff3e3', fundo === 'grafite' ? 1.4 : 2.1);
  chave.position.set(-4, 7, 4);
  chave.castShadow = true;
  chave.shadow.mapSize.set(4096, 4096);
  chave.shadow.camera.left = -5;
  chave.shadow.camera.right = 5;
  chave.shadow.camera.top = 5;
  chave.shadow.camera.bottom = -5;
  chave.shadow.radius = 26;
  chave.shadow.blurSamples = 25;
  chave.shadow.bias = -0.0004;
  scene.add(chave, new HemisphereLight('#fffaf2', '#cfc5b6', fundo === 'grafite' ? 0.25 : 0.6));

  // Chão invisível que só recebe a sombra (o papel de estúdio é o fundo).
  const chao = new Mesh(new PlaneGeometry(40, 40), new ShadowMaterial({ color: '#3b2f22', opacity: fundo === 'grafite' ? 0.5 : 0.24 }));
  chao.rotation.x = -Math.PI / 2;
  chao.receiveShadow = true;
  // Recorte (fundo transparente) não tem chão nem sombra projetada.
  if (!transparente) scene.add(chao);

  const camera = new PerspectiveCamera(28, largura / altura, 0.1, 100);
  const grupo = new Group();
  scene.add(grupo);
  (CENAS[cena] || CENAS.seixos)(grupo, camera, cor ? { cor } : {});

  await renderer.compileAsync(scene, camera);
  renderer.render(scene, camera);
  return canvas.toDataURL('image/png');
}
