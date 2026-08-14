export const FATOR_ATIVIDADE = 1.375;
export const AJUSTE_LACTACAO = 450;
export const PISO_LACTANTE = 1800;
export const PISO_GERAL = 1200;

const NUMERO_DECIMAL = /^(?:\d+(?:[.,]\d+)?|[.,]\d+)$/;

/**
 * Converte a entrada do formulário sem aceitar valores parciais como "70kg".
 * Idade e peso só precisam ser positivos; altura conserva uma faixa plausível.
 */
export function validarNumero(valor, { campo } = {}) {
  const texto = String(valor ?? '').trim();
  if (!NUMERO_DECIMAL.test(texto)) return null;

  const numero = Number(texto.replace(',', '.'));
  if (!Number.isFinite(numero) || numero <= 0) return null;
  if (campo === 'altura' && (numero < 80 || numero > 250)) return null;
  return numero;
}

/** Contrato nutricional único usado pela apresentação e pelos testes. */
export function calcularEstimativa({ peso, altura, idade, amamenta }) {
  const entradas = { peso, altura, idade };
  for (const [campo, valor] of Object.entries(entradas)) {
    if (!Number.isFinite(valor) || valor <= 0) {
      throw new TypeError(`${campo} deve ser um número positivo`);
    }
  }

  const gerExato = (10 * peso) + (6.25 * altura) - (5 * idade) - 161;
  const ajusteLactacao = amamenta ? AJUSTE_LACTACAO : 0;
  const piso = amamenta ? PISO_LACTANTE : PISO_GERAL;
  const estimativa = Math.max(piso, gerExato * FATOR_ATIVIDADE + ajusteLactacao);

  return {
    ger: Math.round(gerExato),
    fatorAtividade: FATOR_ATIVIDADE,
    ajusteLactacao,
    piso,
    minimo: Math.round(estimativa / 10) * 10,
  };
}
