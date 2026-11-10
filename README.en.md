# site-que-vende

[![site-que-vende](guia/assets/banner-en.jpg)](https://inematds.github.io/site-que-vende/guia/en/)

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

## What it is

site-que-vende is a kit that measures the five patterns in a browser that distinguish a website that brings in customers from an AI-made “pretty and cheap” website, and tells you what to fix. It opens your page on desktop and mobile, measures text, color, layers, motion, and a free sample, then returns a report with a list of fixes ready to paste into your coding agent. It includes a skill for Claude Code, two free sample components (quiz and calculator), and a pair of example pages, one bad and one good.

[Complete guide](https://inematds.github.io/site-que-vende/guia/en/) ·
[Bad example](https://inematds.github.io/site-que-vende/exemplos/ruim/) (0 of 5) ·
[Good example](https://inematds.github.io/site-que-vende/exemplos/bom/) (5 of 5) ·
[Samples](https://inematds.github.io/site-que-vende/skill/site-que-vende/amostras/exemplo.html)

## The 5 patterns

| # | Pattern | In one sentence | What the auditor measures |
|---|---|---|---|
| 1 | Mirror test | The first screen says who it is for, what the person gets, and what to do now | generic headline, button on the first screen (desktop and mobile), button text, competing buttons |
| 2 | Highlighter rule | The accent color appears only on clickable elements (60/30/10) | where the button color appears outside clickable elements, how much of the page it covers |
| 3 | Front, middle and back | Background behind, content in the middle, button in front | first-screen background, element crossing the edge, number of shadows |
| 4 | Motion with a purpose | Text is ready immediately, one thing moves per screen, and motion can be turned off | headline at 0.4 s, things moving per screen, “reduce motion” |
| 5 | Free sample | Visitors try the result before sharing their contact information | whether a tool exists, whether it responds immediately, whether it is short |

Test details and numbers: [`cinco-padroes.md`](skill/site-que-vende/referencias/cinco-padroes.md).

## Get started in 2 minutes

```bash
git clone https://github.com/inematds/site-que-vende && cd site-que-vende
cd skill/site-que-vende/scripts && npm install && npx playwright install chromium && cd -

node skill/site-que-vende/scripts/auditar.js https://seusite.com.br --saida auditoria
# ou um arquivo:  node skill/site-que-vende/scripts/auditar.js minha-pagina/index.html
```

Output (the bad example in this repository):

```
FALHA  1. Teste do espelho
         - Título genérico: "Soluções inovadoras de agendamento com IA" serve para qualquer empresa
         - O botão diz "Enviar": não conta o que acontece depois do clique.
FALHA  2. Regra do marca-texto
         - A cor do botão (#8b5cf6) aparece em 35 lugares que não são clique (9 borda, 11 texto, 11 título, 4 ícone ou selo).
...
0 de 5 padrões passam.  Relatório: auditoria/relatorio.html
O que consertar (cole no seu agente): auditoria/consertar.md
```

The auditor's messages are in Portuguese.

Exit code: `0` passed all five, `1` one or more failed, `2` usage error. Works in CI.

## What’s included

| Item | File | What it does |
|---|---|---|
| Auditor | `skill/site-que-vende/scripts/auditar.js` | opens the page (URL or file), measures the 5 patterns, saves `relatorio.html`, `relatorio.json`, `consertar.md`, and screenshots |
| Measurements | `skill/site-que-vende/scripts/medir.js` | code that runs inside the page (color, button, layers, motion, sample) |
| Samples | `skill/site-que-vende/amostras/amostra.js` | `<amostra-calculadora>` and `<amostra-quiz>`: one file, no dependencies, configured with JSON |
| Sample template | `skill/site-que-vende/amostras/exemplo.html` | working quiz and calculator to copy |
| Skill | `skill/site-que-vende/SKILL.md` | the 5 steps for the agent: brief → measure → fix → measure → human review |
| Brief | `skill/site-que-vende/referencias/brief.md` | questions to answer before design and a ready-to-paste prompt |
| The 5 patterns | `skill/site-que-vende/referencias/cinco-padroes.md` | the idea, test numbers, and what is measured |
| Examples | `exemplos/ruim/` and `exemplos/bom/` | the same fictional business: one fails all 5, the other passes all 5 |
| Tests | `tests/rodar.sh` | 21 checks: the bad example fails for the right reason, the good one passes, and the samples work |

## The process, from start to finish (7 steps)

🧠 = session with a person (uses tokens) · ⚙️ = script (zero tokens) · 👤 = you

| # | Step | Command / what happens | Who |
|---|---|---|---|
| 1 | Brief | answer the questions in `referencias/brief.md` (who it is for, what they get, what to do now, three colors, sample question) | 👤 + 🧠 |
| 2 | Page | AI generates the page using the brief’s “ready-to-paste prompt” (or your site is already live) | 🧠 |
| 3 | Measure | `node skill/site-que-vende/scripts/auditar.js <url ou arquivo> --saida auditoria` | ⚙️ |
| 4 | Fix | paste `auditoria/consertar.md` into the agent; it fixes only what failed, in order 1 → 5 | 🧠 |
| 5 | Sample | if pattern 5 failed: copy `amostras/amostra.js` and configure the quiz or calculator with your business’s numbers | 👤 + 🧠 |
| 6 | Measure again | repeat steps 3 and 4 until `5 de 5` (up to 3 rounds; after that, decide with the person) | ⚙️ |
| 7 | Human review and publish | look at `desktop-tela1.png` and `celular-tela1.png`, answer the three mirror test questions, publish | 👤 |

Kit tests: `bash tests/rodar.sh`.

## Install the skill in Claude Code

```bash
ln -s "$PWD/skill/site-que-vende" ~/.claude/skills/site-que-vende
```

Then just ask: “audit my site with site-que-vende” or “why doesn’t my site convert?”
In another agent (Codex, Cursor), say: “read `skill/site-que-vende/SKILL.md` and follow the steps.”
The auditor and samples also work on their own, without an agent.

## Use a sample on your site

```html
<amostra-calculadora>
  <script type="application/json">
  { "titulo": "Quanto custa pintar a sua casa?", "base": 350,
    "campos": [
      {"rotulo": "Área de parede", "tipo": "faixa", "min": 20, "max": 300, "passo": 10, "valor": 80, "unidade": "m²", "porUnidade": 28},
      {"rotulo": "Acabamento", "tipo": "opcoes", "opcoes": [{"rotulo": "Econômico", "vezes": 1}, {"rotulo": "Premium", "vezes": 1.6}]}
    ],
    "margem": 12, "prefixo": "Sua pintura fica entre",
    "botao": {"texto": "Receber o orçamento exato", "href": "#contato"} }
  </script>
</amostra-calculadora>
<script src="amostra.js"></script>
```

The button color comes from your page: `:root { --amostra-destaque: #c2410c; }`. Nothing is sent to any server.

## Limits (read before relying on it)

- The auditor measures form, not truth: a specific but false headline passes. That is why step 7 includes human review.
- If the main button is black, white, or gray, pattern 2 becomes a warning because the auditor cannot count where else that color appears.
- Big brand websites often fail several patterns and still sell: they already have the trust that a small business must earn on the first screen.
- Passing all five does not guarantee a sale. It means the site does not lose customers for the five most common reasons.
- The auditor’s messages are in Portuguese. The audited pages can be in Portuguese, English, or Spanish.

## License

MIT. The example pages use a fictional company.
