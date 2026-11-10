# Amostras grátis — todas as chaves do JSON

`amostras/amostra.js` traz duas tags. A configuração vai num `<script type="application/json">` dentro da tag.
Modelo funcionando: `amostras/exemplo.html`. Nada é enviado a servidor nenhum.

```html
<amostra-calculadora> <script type="application/json"> { ... } </script> </amostra-calculadora>
<amostra-quiz>        <script type="application/json"> { ... } </script> </amostra-quiz>
<script src="amostra.js"></script>
```

## `<amostra-calculadora>`

Conta: `resultado = (base + soma dos campos) × multiplicadores`, mostrado como faixa `resultado ± margem`.

| Chave | Tipo | Para quê | Padrão |
|---|---|---|---|
| `titulo`, `subtitulo` | texto | cabeçalho da caixa | sem |
| `campos` | lista | os controles (obrigatória, ver abaixo) | |
| `base` | número | valor fixo somado antes dos multiplicadores | 0 |
| `margem` | número (%) | largura da faixa; `0` mostra um valor só | 10 |
| `arredondar` | número | arredonda o resultado para múltiplos disto | 10 |
| `moeda` | código ISO | `BRL`, `USD`, `EUR`… | `BRL` |
| `idioma` | código | formato do número e textos fixos (`pt-BR`, `en`, `es`) | o `lang` da página |
| `prefixo`, `sufixo` | texto | linha acima e abaixo do número | "Estimativa" / sem |
| `ate` | texto | separador da faixa | " a " (pt, es), " to " (en) |
| `botao` | `{texto, href}` | o botão depois do resultado | sem |
| `nota` | texto | linha pequena no fim (ex.: "valores de exemplo") | sem |

Campo do tipo **`faixa`** (controle deslizante):

| Chave | Para quê |
|---|---|
| `rotulo`, `min`, `max` | obrigatórias |
| `passo`, `valor`, `unidade` | passo do controle, valor inicial, texto depois do número ("m²") |
| `porUnidade` | quanto cada unidade soma ao resultado (ex.: 28 reais por m²) |
| `multiplica: true` | em vez de somar, o valor **multiplica** o resultado (vezes `porUnidade`, se houver). Ex.: horários vagos × valor do serviço × 4 semanas = duas faixas com `multiplica` e `base: 1` |

Campo do tipo **`opcoes`** (botões de escolha única):

| Chave | Para quê |
|---|---|
| `rotulo`, `opcoes` | obrigatórias; cada opção é `{rotulo, soma, vezes}` |
| `soma` | valor somado quando a opção está marcada |
| `vezes` | multiplicador quando a opção está marcada (ex.: 1.6 no acabamento premium) |
| `padrao` | índice da opção que começa marcada (0 = primeira) |

## `<amostra-quiz>`

Cada opção soma pontos em um ou mais resultados; ganha o resultado com mais pontos.

| Chave | Tipo | Para quê |
|---|---|---|
| `titulo` | texto | aparece na primeira pergunta |
| `perguntas` | lista (obrigatória) | cada uma `{texto, opcoes: [{rotulo, pontos: {chave: n}}]}` |
| `resultados` | objeto (obrigatório) | `{chave: {titulo, texto, botao: {texto, href}}}` |
| `prefixo` | texto | linha acima do resultado ("Para você") |
| `refazer` | texto | o link de recomeçar ("Responder de novo") |
| `textoPergunta` | texto | contador, com `{n}` e `{t}` ("Pergunta {n} de {t}") |
| `idioma` | código | textos fixos em `pt`, `en` ou `es` |

Mantenha de 3 a 5 perguntas: quiz comprido ninguém termina (o auditor falha acima de 7 perguntas).

Comportamentos para saber: no **empate**, ganha o resultado que aparece primeiro em `resultados`; o `titulo` só aparece na
primeira pergunta; uma opção que dá pontos para uma chave que não existe em `resultados` mostra o erro no lugar do quiz.

## Aparência

Variáveis CSS na sua página (a amostra herda a fonte):

```css
:root {
  --amostra-destaque: #c2410c;      /* a cor do botão: a mesma cor de destaque do site */
  --amostra-destaque-texto: #fff;
  --amostra-fundo: #fff;  --amostra-texto: #1b1b1f;  --amostra-borda: rgba(0,0,0,.12);  --amostra-raio: 16px;
}
```

## Evento (opcional)

As duas tags disparam `amostra-resultado` **uma vez por mudança feita pela pessoa** (a conta inicial, ao carregar a página,
não dispara). Serve para medir uso, sem coletar dado pessoal:

```js
document.addEventListener('amostra-resultado', e => console.log(e.detail)); // {min, max} ou {resultado: "chave"}
```

## Erros

JSON inválido ou incompleto aparece escrito no lugar da amostra (ex.: `amostra-quiz: falta a lista "perguntas"`).
