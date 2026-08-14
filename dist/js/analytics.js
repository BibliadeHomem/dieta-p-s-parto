export const EVENTOS_FUNIL = Object.freeze([
  'variante_atribuida',
  'quiz_iniciado',
  'quiz_concluido',
  'oferta_visualizada',
  'cta_clicado',
  'conversao',
]);

export function criarAnalytics({ enviar } = {}) {
  const destino = enviar ?? ((evento) => {
    globalThis.dispatchEvent?.(new CustomEvent('fitflix:analytics', { detail: evento }));
  });

  return {
    registrar(nome, contexto = {}) {
      if (!EVENTOS_FUNIL.includes(nome)) return false;
      const evento = { nome };
      if (contexto.variante === 'A' || contexto.variante === 'B') evento.variante = contexto.variante;
      destino(evento);
      return true;
    },
  };
}
