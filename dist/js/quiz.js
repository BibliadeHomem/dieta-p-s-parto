/* quiz.js — peças 2 e 3. Estado, navegação, micro-resultados e cálculo.
   Nenhum dado sai do navegador: zero fetch, zero localStorage, zero cookie. O
   resultado vai para a peça 4 por CustomEvent e por window.__quiz.

   CONSTANTES. Mifflin-St Jeor, mulher, coeficientes públicos, os mesmos que a
   peça 8 mostra na tela:
     GER = (10 x peso_kg) + (6,25 x altura_cm) - (5 x idade) - 161
   Fator de atividade, escala de Mifflin, três degraus porque a copy tem três
   respostas. 1,20 sedentária = "Mais parada"; 1,375 levemente ativa =
   "Andando bastante em casa"; 1,55 moderadamente ativa = "Com alguma atividade
   física à parte".
   Ajuste de lactação: é uma FAIXA ESTIMADA, não número cravado, e a peça 8 diz
   isso literal. Referência: custo de produzir leite menos a mobilização de
   reserva materna, que a literatura situa perto de 330 a 500 kcal/dia na
   lactação plena, decrescendo no desmame. FAIXAS_LACTACAO guarda a faixa;
   AJUSTE_LACTACAO usa um ponto dela só para somar um número na tela. Quem
   exibir trata como estimativa, nunca valor exato. */

import { calcularEstimativa, validarNumero } from './diagnostico.js';

export const FAIXAS_LACTACAO = { livre: [450, 450], intervalos: [450, 450], reduzindo: [450, 450], nao: [0, 0] };

const PASSOS = ['peso', 'altura', 'idade', 'amamenta', 'atividade', 'renda', 'lgpd'];
const CONTAM = ['peso', 'altura', 'idade', 'amamenta', 'atividade', 'renda', 'lgpd'];
const CAMPOS_NUMERICOS = new Set(['peso', 'altura', 'idade']);

/** Micro-resultado que cada resposta destrava. Ramifica na atividade. */
function microDe(chave, valor, r) {
  if (chave === 'altura') return r.peso ? 'm1' : null;
  if (chave === 'amamenta') return valor === 'nao' ? null : 'm2';
  if (chave === 'atividade') return valor === 'parada' ? 'm3' : 'm4';
  if (chave === 'renda') return valor === 'ate2' ? 'm5' : null;
  return null;
}

export function initQuiz(raiz) {
  const sec = raiz || document.querySelector('[data-quiz]');
  if (!sec || sec.__quizPronto) return null;
  sec.__quizPronto = true;

  const pilha = sec.querySelector('[data-quiz-pilha]');
  const cards = new Map();
  for (const c of sec.querySelectorAll('.qcard')) cards.set(c.dataset.card, c);
  const rotulo = sec.querySelector('[data-quiz-passo]');
  const barra = sec.querySelector('[data-quiz-barra]');
  const r = {};  // respostas, só em memória
  let contato = null; // dados pessoais ficam apenas na memória desta aba
  let i = 0;     // passo atual
  let timer = 0;
  const micro = (card) => card.querySelector('[data-quiz-micro]');
  function alturaPilha() {
    const at = cards.get(PASSOS[i]);
    if (at) pilha.style.setProperty('--altura-pilha', at.offsetHeight + 'px');
  }

  function pintar(foco) {
    PASSOS.forEach((nome, k) => {
      const c = cards.get(nome);
      if (!c) return;
      c.classList.toggle('e-ativo', k === i);
      c.classList.toggle('e-proximo', k === i + 1);
      c.classList.toggle('e-passado', k < i);
      c.inert = k !== i;
    });
    const n = CONTAM.indexOf(PASSOS[i]) + 1;
    if (rotulo) rotulo.textContent = String(n || Math.min(CONTAM.length, i));
    alturaPilha();
    if (foco) {
      const alvo = cards.get(PASSOS[i]).querySelector('input, button');
      if (alvo) alvo.focus({ preventScroll: true });
    }
  }

  function progresso() {
    const n = CONTAM.filter((k) => r[k] !== undefined).length;
    sec.style.setProperty('--progresso', (n / CONTAM.length).toFixed(3));
    if (barra) barra.setAttribute('aria-valuenow', String(n));
  }

  /* Micro-resultado em menos de 1 s. O nó é clonado de um <template> e inserido
     no role="status": inserção real é o que o leitor de tela anuncia. */
  function mostrarMicro(card, id, atraso) {
    const alvo = micro(card);
    const tpl = document.getElementById('quiz-micro-' + id);
    if (!alvo || !tpl) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      alvo.replaceChildren(tpl.content.cloneNode(true));
      alturaPilha();
    }, atraso === undefined ? 260 : atraso);
  }

  function erro(card, on) {
    const el = card.querySelector('[data-quiz-erro]');
    if (el) el.hidden = !on;
  }
  function lerNumero(card, chave) {
    const input = card.querySelector('[data-quiz-num]');
    const v = validarNumero(input.value, { campo: chave });
    if (v === null) { erro(card, true); input.focus(); return null; }
    erro(card, false);
    return v;
  }

  function lerContato(card) {
    const campos = [...card.querySelectorAll('[data-quiz-contact]')];
    const valores = Object.fromEntries(campos.map((input) => [input.dataset.quizContact, input.value.trim()]));
    const digitos = (valores.whatsapp || '').replace(/\D/g, '');
    const validos = {
      nome: (valores.nome || '').length >= 2,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.email || ''),
      whatsapp: digitos.length >= 10 && digitos.length <= 13,
    };
    const primeiroInvalido = campos.find((input) => !validos[input.dataset.quizContact]);
    for (const input of campos) input.setAttribute('aria-invalid', String(!validos[input.dataset.quizContact]));
    const aviso = card.querySelector('[data-quiz-contact-error]');
    if (aviso) aviso.hidden = !primeiroInvalido;
    if (primeiroInvalido) { primeiroInvalido.focus(); return null; }
    return { nome: valores.nome, email: valores.email, whatsapp: valores.whatsapp };
  }

  function ir(destino, foco) {
    i = Math.max(0, Math.min(PASSOS.length - 1, destino));
    pintar(foco !== false);
  }

  function seguir() {
    const chave = PASSOS[i];
    const card = cards.get(chave);

    if (CAMPOS_NUMERICOS.has(chave)) {
      const v = lerNumero(card, chave);
      if (v === null) return;
      r[chave] = v;
      progresso();
      const m = microDe(chave, v, r);
      if (m) mostrarMicro(card, m, 0);
    }

    if (/^(amamenta|atividade|renda)$/.test(chave) && r[chave] === undefined) {
      card.querySelector('input').focus();
      return;
    }

    if (chave === 'lgpd') {
      contato = lerContato(card);
      if (!contato) return;
      const cb = card.querySelector('[data-quiz-consent]');
      if (!cb.checked) { erro(card, true); cb.focus(); return; }
      erro(card, false);
      concluir();
      return;
    }

    ir(i + 1);
  }

  function concluir() {
    const amamenta = r.amamenta !== 'nao';
    const fase = amamenta ? r.amamenta : null;
    const dados = {
      respostas: { ...r, amamenta, fase },
      calculo: calcularEstimativa({ peso: r.peso, altura: r.altura, idade: r.idade, amamenta }),
      faixaLactacao: FAIXAS_LACTACAO[fase || 'nao']
    };
    window.__quiz = { ...dados, contato: { ...contato } }; // memória da aba, e só ela
    sec.classList.add('is-concluido');
    document.dispatchEvent(new CustomEvent('quiz:concluido', { detail: dados }));
  }

  sec.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-quiz-seguir]')) { ev.preventDefault(); seguir(); }
    else if (ev.target.closest('[data-quiz-voltar]')) { ev.preventDefault(); ir(i - 1); }
  });

  sec.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.matches('[data-quiz-opc]')) {
      const card = t.closest('.qcard');
      r[card.dataset.card] = t.value;
      progresso();
      const m = microDe(card.dataset.card, t.value, r);
      if (m) mostrarMicro(card, m);
      else { micro(card).replaceChildren(); alturaPilha(); }
    } else if (t.matches('[data-quiz-consent]')) {
      r.lgpd = t.checked || undefined;
      if (t.checked) erro(t.closest('.qcard'), false);
      progresso();
    } else if (t.matches('[data-quiz-marketing]')) {
      r.marketing = t.checked;
    }
  });

  sec.addEventListener('keydown', (ev) => {   // Enter avança
    if (ev.key === 'Enter' && ev.target.matches('[data-quiz-num]')) { ev.preventDefault(); seguir(); }
  });
  sec.addEventListener('input', (ev) => {
    if (ev.target.matches('[data-quiz-num]')) erro(ev.target.closest('.qcard'), false);
    if (ev.target.matches('[data-quiz-contact]')) {
      ev.target.removeAttribute('aria-invalid');
      const aviso = ev.target.closest('.qcard').querySelector('[data-quiz-contact-error]');
      if (aviso) aviso.hidden = true;
    }
  });
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => alturaPilha());
    for (const c of cards.values()) ro.observe(c);
  } else addEventListener('resize', alturaPilha, { passive: true });

  progresso(); pintar(false);
  return { calcularEstimativa, estado: () => ({ ...r }) };
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', () => initQuiz());
else initQuiz();
