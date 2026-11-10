# CLAUDE.md — site-que-vende

Kit que mede os 5 padrões do site que vende (auditor Playwright + amostras + skill). Guia em `guia/` (PT, `en/`, `es/`).

- Commits: autor `inematds <inematds@gmail.com>`. Repo `inematds/site-que-vende`, Pages da raiz (branch main).
- Antes de qualquer commit: `bash tests/rodar.sh` → `TUDO OK`. O par `exemplos/ruim` (0 de 5) e `exemplos/bom` (5 de 5) é o teste de aceitação: não afrouxar o auditor para um exemplo passar.
- Não citar fonte, autor, canal nem curso em nenhum arquivo (regra do Nei, 23/10/2026). Números só os de `skill/site-que-vende/referencias/cinco-padroes.md`.
- Mudou o fluxo? Atualizar "O processo, do início ao fim" no README (PT/EN/ES) no mesmo commit.
- Versão em `VERSION` e `skill/site-que-vende/scripts/package.json` (semver do Nei: minor carrega o patch).

## Self-learning

When I correct you, or you catch yourself making a mistake: before continuing, add the lesson as a one-line rule under ## Lessons, so it never happens again.

## Lessons
- Medir movimento por mudança de posição (getBoundingClientRect) conta imagem carregando como animação em site real: usar só opacidade, transform, recorte e filtro. (09/11/2026)
- Botão neutro (preto/branco) faz o "matiz parecido" casar com todo o texto da página: contar cor fora do clique só quando o destaque é colorido. (09/11/2026)
