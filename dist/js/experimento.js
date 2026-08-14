export const VARIANTES = Object.freeze(['A', 'B']);
const CHAVE = 'fitflix_oferta_variante';

export function atribuirVariante({ storage, aleatorio = Math.random } = {}) {
  const armazenamento = storage ?? globalThis.localStorage;
  try {
    const salva = armazenamento.getItem(CHAVE);
    if (VARIANTES.includes(salva)) return salva;
    const variante = aleatorio() < 0.5 ? 'A' : 'B';
    armazenamento.setItem(CHAVE, variante);
    return variante;
  } catch {
    return aleatorio() < 0.5 ? 'A' : 'B';
  }
}

export function aplicarVariante(variante, raiz = document) {
  raiz.documentElement.dataset.offerVariant = variante;
  const titulo = raiz.querySelector('[data-offer-title]');
  const cta = raiz.querySelector('[data-checkout]');
  if (variante === 'B') {
    if (titulo) titulo.textContent = 'Leve as próximas 12 semanas organizadas para a sua rotina.';
    if (cta) cta.firstChild.textContent = 'Quero organizar minhas próximas 12 semanas ';
  }
}
