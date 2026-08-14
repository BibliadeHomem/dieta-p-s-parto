import { initScroll, initReveal } from './scroll.js';
import './quiz.js';
import { atribuirVariante, aplicarVariante } from './experimento.js';
import { criarAnalytics } from './analytics.js';

function metaEvento(nome, dados = {}) {
  if (typeof window.fbq === 'function') window.fbq('trackCustom', nome, dados);
}

initReveal();
initScroll().start();

const variante = atribuirVariante();
const analytics = criarAnalytics();
aplicarVariante(variante);
analytics.registrar('variante_atribuida', { variante });

let quizIniciado = false;
document.querySelector('[data-quiz]')?.addEventListener('input', () => {
  if (quizIniciado) return;
  quizIniciado = true;
  analytics.registrar('quiz_iniciado', { variante });
}, { once: true });

document.querySelector('[data-ir="quiz"]')?.addEventListener('click', () => {
  metaEvento('QuizStarted');
});

document.addEventListener('quiz:etapa-concluida', ({ detail }) => {
  metaEvento(`QuizStep${detail.etapa}Completed`, { step: detail.etapa, field: detail.chave });
});

/* Peça 4: liga o resultado do quiz aos 3 nós da tela de resultado. */
const FASE_TEXTO = {
  livre: 'em livre demanda',
  intervalos: 'com intervalos',
  reduzindo: 'já reduzindo, aos poucos',
  nao: 'não',
};
const ROTINA_TEXTO = {
  parada: 'mais parada',
  casa: 'andando bastante em casa',
  extra: 'com atividade física à parte',
};

document.addEventListener('quiz:concluido', (ev) => {
  const { respostas, calculo } = ev.detail;
  const fase = document.getElementById('res-fase');
  const rotina = document.getElementById('res-rotina');
  const cifra = document.getElementById('res-cifra');
  const chaveFase = respostas.fase || 'nao';
  if (fase) fase.textContent = FASE_TEXTO[chaveFase] || chaveFase;
  if (rotina) rotina.textContent = ROTINA_TEXTO[respostas.atividade] || respostas.atividade;
  if (cifra) cifra.textContent = calculo.minimo.toLocaleString('pt-BR');
  for (const valor of document.querySelectorAll('[data-result-value]')) {
    valor.textContent = calculo.minimo.toLocaleString('pt-BR');
  }

  const conteudo = document.querySelector('[data-gated]');
  if (conteudo) {
    conteudo.hidden = false;
    conteudo.inert = false;
  }
  analytics.registrar('quiz_concluido', { variante });
  metaEvento('QuizCompleted');

  const resultado = document.getElementById('resultado');
  if (resultado) {
    requestAnimationFrame(() => {
      resultado.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }
});

const oferta = document.querySelector('[data-offer]');
if (oferta && 'IntersectionObserver' in window) {
  const observadorOferta = new IntersectionObserver(([entrada]) => {
    if (!entrada.isIntersecting) return;
    analytics.registrar('oferta_visualizada', { variante });
    observadorOferta.disconnect();
  }, { threshold: 0.35 });
  observadorOferta.observe(oferta);
}

for (const checkout of document.querySelectorAll('[data-checkout]')) {
  checkout.addEventListener('click', () => analytics.registrar('cta_clicado', { variante }));
}
document.addEventListener('checkout:convertido', () => {
  analytics.registrar('conversao', { variante });
});

/* Âncoras internas: rolagem suave só aqui, nunca global. */
const desbloquear = document.querySelector('[data-unlock-content]');
const conteudoPosResultado = document.querySelector('[data-after-result]');
desbloquear?.addEventListener('click', () => {
  if (!conteudoPosResultado) return;
  conteudoPosResultado.hidden = false;
  conteudoPosResultado.inert = false;
  desbloquear.setAttribute('aria-expanded', 'true');
  desbloquear.hidden = true;

  const primeiroBloco = document.getElementById('stack');
  if (!primeiroBloco) return;
  requestAnimationFrame(() => primeiroBloco.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  }));
});

for (const a of document.querySelectorAll('[data-ir]')) {
  a.addEventListener('click', (ev) => {
    const alvo = document.getElementById(a.dataset.ir);
    if (!alvo) return;
    ev.preventDefault();
    const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    alvo.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' });
    alvo.setAttribute('tabindex', '-1');
    /* Focar no mesmo instante em que a rolagem suave começa cancela a
       animação em alguns navegadores. Espera ela assentar primeiro. */
    if (suave) {
      let focado = false;
      const foco = () => {
        if (focado) return;
        focado = true;
        alvo.focus({ preventScroll: true });
      };
      addEventListener('scrollend', foco, { once: true });
      setTimeout(foco, 700);
    } else {
      alvo.focus({ preventScroll: true });
    }
  });
}
