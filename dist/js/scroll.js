/* ============================================================================
   Motor de scroll storytelling 3D — Dieta Pós-Parto
   ----------------------------------------------------------------------------
   Princípios, nesta ordem de prioridade:

   1. NÃO sequestrar o scroll. O dedo dela manda. Nada de scroll-jacking, nada
      de wheel.preventDefault, nada de snap forçado. A profundidade vem de
      camadas se movendo em velocidades diferentes, não de prender a página.
   2. Uma leitura de layout por resize, zero por frame. Todos os rects ficam em
      cache. O loop de rAF só lê window.scrollY e só escreve custom properties.
   3. Só trabalha em cena visível. IntersectionObserver liga e desliga cada cena,
      e o will-change entra e sai junto — will-change permanente em 13 cenas é
      o caminho mais rápido para estourar a memória de GPU de um celular fraco.
   4. Amortecimento, não travamento. Cada cena persegue seu alvo com um lerp
      quadro a quadro. É isso que dá o peso de câmera sem tirar o controle dela.
   5. Se prefers-reduced-motion, o motor não roda. As cenas ficam no estado
      final, legíveis, sem uma linha de transform.

   Contrato com o CSS: cada [data-scene] recebe
     --p   progresso 0→1 da cena cruzando a viewport (amortecido)
     --c   posição relativa ao centro, -1 (abaixo) → 0 (centro) → 1 (acima)
     --e   0→1→0, pico quando a cena está centrada  (ease de entrada e saída)
     --v   velocidade instantânea do scroll, -1→1, normalizada e amortecida
   ========================================================================== */

const SUPPORTS = typeof window !== 'undefined' && 'requestAnimationFrame' in window;
const REDUCED = SUPPORTS && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const LOW_POWER = SUPPORTS && (
  navigator.connection?.saveData === true
  || (Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 2)
  || (Number.isFinite(navigator.hardwareConcurrency) && navigator.hardwareConcurrency <= 2)
);
const STATIC_MODE = REDUCED || LOW_POWER;

/** Uma cena registrada. */
class Scene {
  constructor(el) {
    this.el = el;
    this.layers = el.querySelectorAll('.camada');
    this.active = false;
    // damping: quanto menor, mais pesada a câmera. 1 = sem amortecimento.
    this.damp = parseFloat(el.dataset.damp || '0.14');
    this.p = 0;
    this.target = 0;
    this.top = 0;
    this.height = 0;
    this.written = -1;
  }

  measure(scrollY) {
    const r = this.el.getBoundingClientRect();
    this.top = r.top + scrollY;
    this.height = r.height;
  }

  /** Calcula o alvo sem tocar no layout. */
  computeTarget(scrollY, vh) {
    // A cena começa quando seu topo entra por baixo e termina quando sua base sai por cima.
    const span = this.height + vh;
    const raw = (scrollY + vh - this.top) / (span || 1);
    this.target = raw < 0 ? 0 : raw > 1 ? 1 : raw;
  }

  /** Avança o valor amortecido. Devolve true se mudou o suficiente para escrever. */
  step(dt) {
    // lerp independente de framerate: converge igual a 60fps e a 144fps
    const k = 1 - Math.pow(1 - this.damp, dt * 60);
    this.p += (this.target - this.p) * k;
    if (Math.abs(this.target - this.p) < 0.0004) this.p = this.target;
    return Math.abs(this.p - this.written) > 0.0009;
  }

  write(vel) {
    const p = this.p;
    this.written = p;
    const c = p * 2 - 1; // -1 → 1
    // e: 0 nas pontas, 1 no centro, com ombro suave
    const e = 1 - Math.min(1, Math.abs(c) / 0.72) ** 2;
    const s = this.el.style;
    s.setProperty('--p', p.toFixed(4));
    s.setProperty('--c', c.toFixed(4));
    s.setProperty('--e', (e < 0 ? 0 : e).toFixed(4));
    s.setProperty('--v', vel.toFixed(4));
  }

  setActive(on) {
    if (this.active === on) return;
    this.active = on;
    this.el.classList.toggle('is-live', on);
    // will-change só enquanto a cena está viva
    for (const layer of this.layers) layer.style.willChange = on ? 'transform' : '';
  }
}

class ScrollEngine {
  constructor() {
    this.scenes = [];
    this.vh = window.innerHeight;
    this.scrollY = window.scrollY;
    this.lastScrollY = this.scrollY;
    this.vel = 0;
    this.lastT = 0;
    this.running = false;
    this.dirty = true;
    this.io = null;
  }

  register(el) {
    const scene = new Scene(el);
    this.scenes.push(scene);
    el.__scene = scene;
    if (this.io) this.io.observe(el);
    return scene;
  }

  measureAll() {
    this.vh = window.innerHeight;
    const y = window.scrollY;
    for (const s of this.scenes) s.measure(y);
    this.dirty = true;
  }

  start() {
    if (STATIC_MODE) {
      // Estado final estático, sem loop, sem transform.
      document.documentElement.classList.add('reduced-motion');
      if (LOW_POWER) document.documentElement.classList.add('low-power');
      for (const s of this.scenes) {
        s.el.style.setProperty('--p', '0.5');
        s.el.style.setProperty('--c', '0');
        s.el.style.setProperty('--e', '1');
        s.el.style.setProperty('--v', '0');
      }
      return;
    }

    this.io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const sc = en.target.__scene;
          if (sc) sc.setActive(en.isIntersecting);
        }
      },
      { rootMargin: '20% 0px 20% 0px', threshold: 0 }
    );
    for (const s of this.scenes) this.io.observe(s.el);

    this.measureAll();

    // Um único listener passivo. Só marca sujo — nada de trabalho aqui.
    addEventListener('scroll', () => { this.dirty = true; }, { passive: true });

    let rt;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => this.measureAll(), 120);
    };
    addEventListener('resize', onResize, { passive: true });
    addEventListener('orientationchange', onResize, { passive: true });

    // Fontes e imagens mudam altura depois do load. Remedir quando isso acontece.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.measureAll());
    addEventListener('load', () => this.measureAll(), { once: true });

    const ro = new ResizeObserver(() => onResize());
    ro.observe(document.body);

    this.running = true;
    this.lastT = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  frame(t) {
    if (!this.running) return;
    // dt em segundos, com teto para não explodir depois de uma aba em background
    const dt = Math.min(0.05, (t - this.lastT) / 1000) || 0.016;
    this.lastT = t;

    if (this.dirty) {
      this.scrollY = window.scrollY;
      this.dirty = false;
    }

    // velocidade normalizada e amortecida: alimenta blur/skew de movimento no CSS
    const rawVel = (this.scrollY - this.lastScrollY) / (this.vh || 1) / (dt || 0.016);
    this.lastScrollY = this.scrollY;
    const clamped = Math.max(-1, Math.min(1, rawVel / 2.4));
    this.vel += (clamped - this.vel) * (1 - Math.pow(1 - 0.12, dt * 60));

    const y = this.scrollY;
    const vh = this.vh;
    for (const s of this.scenes) {
      if (!s.active) continue;
      s.computeTarget(y, vh);
      if (s.step(dt)) s.write(this.vel);
    }

    requestAnimationFrame((tt) => this.frame(tt));
  }
}

export const engine = new ScrollEngine();

export function initScroll(root = document) {
  if (!SUPPORTS) return engine;
  for (const el of root.querySelectorAll('[data-scene]')) {
    if (!el.__scene) engine.register(el);
  }
  return engine;
}

/* --------------------------------------------------------------------------
   Reveal: entrada de blocos de texto. Separado do motor de cena de propósito —
   texto que aparece uma vez e fica não precisa de rAF, e IntersectionObserver
   sozinho custa praticamente nada.
   ------------------------------------------------------------------------ */
export function initReveal(root = document) {
  const nodes = root.querySelectorAll('[data-reveal]');
  if (!nodes.length) return;
  if (REDUCED) {
    for (const n of nodes) n.classList.add('is-in');
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.01 }
  );
  for (const n of nodes) io.observe(n);
}
