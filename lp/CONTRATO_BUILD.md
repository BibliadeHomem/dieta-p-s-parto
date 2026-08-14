# CONTRATO DE BUILD — landing page Dieta Pós-Parto

Documento autossuficiente. Se você é um **builder** ou um **crítico** deste loop, leia isto inteiro
antes de tocar em qualquer arquivo. Não precisa ler os outros 30 documentos do projeto.

---

## 0. O que estamos construindo

Uma landing page **quiz-first** de página única para um material educativo de R$ 37 sobre
alimentação no puerpério. A leitora é uma mãe brasileira amamentando, exausta, orçamento apertado,
celular fraco, lendo com uma mão só.

A copy **já está aprovada e fechada**. Ela venceu um loop adversarial de 15 rodadas contra a Noom.
Está em `../COPY_FINAL_LP.md`.

> ### A regra número 1 deste build
> **Ninguém reescreve a copy. Nem uma palavra.**
> O texto visível da página sai de `../COPY_FINAL_LP.md` literalmente, incluindo pontuação.
> Você decide onde o texto vive, como ele entra, o que se move atrás dele. Nunca o que ele diz.
> Se um bloco de copy não couber no seu layout, o layout muda. Não o texto.
> Corrigir uma vírgula da copy é motivo de reprovação automática da rodada.

---

## 1. A barra

`https://discodungeongame.com/` — site de um RPG de puzzle, feito em **Framer**.

Foi percorrido e medido de verdade (não descrito). O que ele é, factualmente:

| | |
|---|---|
| Stack | Framer. **Sem** Three.js, **sem** WebGL, **sem** canvas, **sem** GSAP |
| Altura total | 8.474 px desktop / 9.039 px mobile |
| Técnica de profundidade | camadas raster 2D com parallax diferencial + escala + pin. Só isso |
| Paleta | escura e **constante** do topo ao rodapé |
| Arte | ilustração autoral de altíssimo nível — é a maior força dele, de longe |

**As forças dele, que temos que igualar:**
- Personagem-âncora que persiste entre cenas e cria continuidade narrativa
- Molduras de primeiro plano (rocha, caverna) que enquadram o conteúdo e vendem a profundidade
- Mockups de celular deslizando de fora do quadro, em ângulo, com sombra correta
- Iluminação diegética: a luz da cena vem de um objeto que existe na cena

**As fraquezas dele, que são a nossa abertura — e onde a comparação cega se ganha:**
1. **Trechos de preto morto.** Entre cenas há telas inteiras quase vazias. Em vários pontos do
   scroll o quadro não tem nada acontecendo. Nós nunca podemos ter um quadro morto.
2. **A paleta nunca muda.** Sem arco. Do primeiro ao último pixel é a mesma noite roxa. Nossa
   página **amanhece** (§3) — isso é narrativa que ele não tem.
3. **Profundidade só no eixo Z aparente, nunca rotação.** Nada gira, nada muda de plano. É parallax,
   não 3D. Nós usamos `rotateY`/`rotateX` reais sob uma `perspective` compartilhada.
4. **Mobile é uma degradação, não uma adaptação.** No celular ele vira texto grande empilhado com uma
   imagem estática embaixo. Quase toda a profundidade some. A nossa tem que ter profundidade
   de verdade em 390 px.
5. **Peso.** Framer + GTM duplo + rastreadores. Nossa página é HTML/CSS/JS puro, zero dependência.

---

## 2. Restrições de compliance — quebrou, a rodada é reprovada antes de ser julgada

Estas vêm de `../Checklist_Compliance.md` e `../STATE.md §6`. Valem para texto, imagem, ícone,
`alt`, microcopy, tudo que é renderizado.

### NUNCA
- **Nenhuma promessa de resultado.** Zero kg, zero cm, zero prazo, zero "até".
- **Nenhum antes-e-depois.** Nenhuma imagem, ícone, gráfico ou ilustração que enquadre barriga,
  cintura, balança, fita métrica ou manequim. O corpo dela nunca é assunto visual.
- **"Sim, é seguro"** ou qualquer afirmação categórica de segurança na amamentação.
- As palavras **prescrição**, **sua dieta**, **seu plano**, **seu tratamento**.
- **Nenhuma prova social.** Zero depoimento, zero contador, zero nota, zero selo, zero
  "milhares de mães", zero avatar de cliente, zero logo de imprensa. Nada disso existe.
- **Nenhuma urgência falsa.** Zero contagem regressiva, zero "vagas", zero "só hoje".
- **A nutricionista responsável técnica não aparece em nenhum ponto do corpo persuasivo.**
  Só no rodapé, em placeholder, junto aos dados do MEI. Nunca como argumento de venda.
- **Travessão ou hífen como pontuação de frase** em texto visível. Hífen ortográfico ("pós-parto") ok.

### SEMPRE
- Preço R$ 37,00 à vista, sem parcelamento, e só **depois** da oferta e da ancoragem.
- Garantia de 7 dias com a palavra **incondicional** explícita, em seção própria.
- **Resultado do quiz na tela antes de pedir e-mail.** É a regra mais importante do fluxo inteiro.
- Dois checkboxes LGPD **separados e desmarcados por padrão**: dado de saúde (destacado, no ponto
  do cálculo) e marketing (opcional, e dito que é opcional).
- Disclaimer educativo uma vez, no rodapé.

---

## 3. Direção visual travada — "a página amanhece"

A variável que muda com o scroll é **a luz**. A barra é uniformemente escura e paga com trechos
mortos. Nós usamos a hora do dia como narrativa, e ela casa exatamente com o arco da copy.

| Peças | `data-ato` | Hora | Cor de fundo |
|---|---|---|---|
| 1, 2, 3 — gancho, quiz, micro-resultados | `noite` | 4h da manhã, só o abajur | `--noite` |
| 4 — tela de resultado | `noite` → o número **acende** | o primeiro clarão | halo âmbar |
| 5, 6, 7 — transição, empatia, permissão | `frio` | pré-amanhecer, fundo do poço | `--azul-noite` |
| 8 — mecanismo | `tecnico` | luz neutra de mesa de trabalho | `--tecnico` |
| 9, 10 — stack, ancoragem | `aurora` | sol nascendo | `--aurora` |
| 11, 12, 13, 14, 15 — preço, garantia, FAQ, CTA, rodapé | `manha` | manhã cheia | `--manha` (claro) |

Trocar de ato é só trocar `data-ato` na `<section>`. A paleta inteira vem junto pelos tokens.
A transição de cor é de 900 ms de propósito: o amanhecer não pode ser percebido como um corte.

Imagens: ver `../../PLANO_IMAGENS.md`. As 17 imagens estão especificadas com prompt de Nano Banana.
**As que existem hoje em `lp/img/` são camadas provisórias** geradas em `_build/placeholders.py`,
com a proporção, o enquadramento e o alfa corretos de cada IMG. Trocar pelo arquivo final é trocar
o `src`. Nunca ajuste layout para compensar a arte provisória.

---

## 4. Arquitetura técnica — como construir uma cena

Stack: **HTML + CSS + JS de módulo nativo. Zero dependência, zero build step, zero framework.**

### Arquivos

```
lp/
  index.html          página inteira, uma <section class="cena"> por peça
  css/tokens.css      paleta, escala tipográfica, espaço, profundidade   (não editar sem motivo)
  css/base.css        reset, tipografia, botão, utilitários              (não editar sem motivo)
  css/cena.css        o andaime 3D                                        (não editar sem motivo)
  css/blocos.css      estilo por peça  ← é aqui que você trabalha
  js/scroll.js        o motor                                             (não editar sem motivo)
  js/app.js           inicialização
  js/quiz.js          estado e cálculo do quiz
```

### O motor, e o contrato dele

`js/scroll.js` roda **um** `requestAnimationFrame`, lê `scrollY` **uma vez** por frame, e escreve
custom properties em cada `[data-scene]` visível. Nunca lê layout no loop. Nunca sequestra o scroll.

Cada `[data-scene]` recebe:

| var | significado |
|---|---|
| `--p` | 0→1, progresso da cena cruzando a viewport, **amortecido** |
| `--c` | -1→0→1, posição relativa ao centro da tela |
| `--e` | 0→1→0, pico quando a cena está centrada. É o que você usa para "acender" algo |
| `--v` | -1→1, velocidade instantânea do scroll, amortecida |

`data-damp` na section controla o peso da câmera. Menor = mais pesado. Padrão 0.14, hero 0.10.

### Estrutura obrigatória de uma cena

```html
<section class="cena" data-scene data-damp="0.14" data-ato="frio" aria-labelledby="x-tit">
  <div class="cena__palco">
    <div class="camada" data-z="fundo">…</div>
    <div class="camada" data-z="meio"  style="--giro: 8deg">…</div>
    <div class="camada" data-z="frente">…</div>
    <div class="nevoa"></div><div class="vinheta"></div>
  </div>
  <div class="cena__conteudo">  <!-- texto, sempre 2D, sempre nítido -->
    <h2 class="h2" id="x-tit" data-reveal>…</h2>
  </div>
</section>
```

`data-z` já traz `translateZ`, contra-escala e deriva de parallax calibrados, desktop e mobile.
Por camada você pode sobrescrever `--deriva`, `--giro`, `--inclina`, `--escala`.

### As cinco regras técnicas que não se negociam

1. **Texto nunca entra no 3D.** Um `translateZ` em texto rasteriza na escala errada e borra em tela
   de alta densidade. Camada 3D carrega imagem e forma; texto fica em `.cena__conteudo`, plano 2D.
   *É por isso que a nossa lê nítida em movimento e a barra borra.*
2. **Só `transform` e `opacity` animam.** Nada de `top`, `left`, `width`, `margin`, `filter: blur`
   animado por scroll. Só composição: zero layout, zero paint.
3. **`will-change` é gerenciado pelo motor**, entra e sai com o IntersectionObserver. Não escreva
   `will-change` fixo em CSS: `will-change` permanente em 15 cenas estoura a GPU de um celular fraco.
4. **`prefers-reduced-motion` desliga o motor inteiro** e deixa a página no estado final legível.
   Toda cena precisa fazer sentido parada. Teste isso.
5. **Nenhuma imagem sem `width`/`height`.** CLS tem que ser 0.

### Acessibilidade, não opcional

- Um `<h1>` na página, `h2` por seção, hierarquia sem pulo.
- Toda imagem decorativa: `alt=""`. Toda imagem de conteúdo: `alt` descritivo em pt-BR.
- Contraste mínimo 4.5:1 para corpo, 3:1 para texto grande, **medido sobre a camada que está atrás**.
- Foco visível em tudo que é focável. Ordem de tabulação segue a ordem visual.
- O quiz funciona por teclado do começo ao fim. `aria-live` nos micro-resultados.

---

## 5. Orçamento de performance — números, não intenções

Medido em `Moto G Power`, throttle 4x CPU, rede Slow 4G.

| Métrica | Teto |
|---|---|
| Lighthouse Performance mobile | ≥ 92 |
| LCP | ≤ 2,0 s |
| CLS | **0** |
| INP | ≤ 150 ms |
| Total de JS transferido | ≤ 18 KB comprimido |
| Total de CSS | ≤ 22 KB comprimido |
| Peso da primeira tela (HTML+CSS+JS+imagem do hero) | ≤ 190 KB |
| Peso total da página | ≤ 1,1 MB |
| Frames abaixo de 55 fps durante um scroll completo | ≤ 2% |

Regras práticas que sustentam isso: imagem fora da primeira dobra é `loading="lazy"`
`decoding="async"`; AVIF com fallback WebP; nenhuma webfont externa; nenhum script de terceiro
no caminho crítico.

---

## 6. Responsivo — "qualquer resolução" é literal

Alvos de teste obrigatórios em toda rodada:

`320×568` · `390×844` · `430×932` · `768×1024` (retrato e paisagem) · `1024×768` ·
`1280×800` · `1440×900` · `1920×1080` · `2560×1440` · celular deitado `844×390`

- Toda medida é fluida (`clamp`) por padrão. Media query só onde a **estrutura** muda, nunca para
  ajustar tamanho de fonte.
- `overflow-x` nunca aparece. Em nenhuma largura.
- Alvo de toque mínimo 44×44 px.
- `svh`, nunca `vh`, para altura de tela — a barra do navegador móvel quebra `vh`.
- Em `≤ 47.9375rem` as derivas de parallax e a perspectiva já caem automaticamente (`cena.css`).
  O mesmo deslocamento em `svh` atravessa uma fração muito maior de uma tela de 390 px: o que era
  profundidade vira embrulho.

---

## 7. O loop: builder e crítico

Cada peça é um pedaço pequeno e julgável. Para cada uma:

**Builder** — recebe a peça, a copy literal, este contrato. Constrói. Não vê o veredito anterior
como elogio, só como lacuna a fechar.

**Crítico** — contexto limpo, **não sabe qual página é qual**. Recebe dois conjuntos de capturas,
rotulados só como **A** e **B**, desktop e mobile, no mesmo ponto narrativo. Abre a barra real no
navegador. Responde exatamente três coisas:

1. **Qual das duas dá mais sensação de profundidade e continuidade?** Escolha binária. Sem empate,
   sem nota, sem "ambas são boas".
2. **Qual erro concreto da perdedora custou a escolha?** Um só. O maior.
3. **Qual é a maior lacuna restante da vencedora?**

**Elogio é descartado. Não é informação.** Se o crítico escrever "ficou bonito", a rodada não conta.

Ordem de julgamento, obrigatória:
1. **Gate de compliance** (§2). Quebrou, perde, por melhor que esteja. Registrar qual regra.
2. **Gate de quadro morto.** Se qualquer captura da sequência estiver visualmente vazia — sem
   sujeito, sem texto legível, sem evento — reprova antes de comparar. Vale para os dois lados.
3. **Gate de mobile.** Se a profundidade sumiu em 390 px, reprova. Mobile não é degradação.
4. Só então a comparação cega.

O loop de uma peça termina quando o crítico escolhe a nossa **às cegas**. Não antes.
